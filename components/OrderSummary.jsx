import { CheckCircle2, LockKeyhole, PlusIcon, SquarePenIcon, XIcon } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react'
import AddressModal from './AddressModal';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth, useClerk, useUser } from '@clerk/nextjs'
import axios from 'axios';
import { fetchCart } from '@/lib/features/cart/cartSlice';
import { addAddress } from '@/lib/features/address/addressSlice';
import { useAnalytics } from '@/lib/posthog/useAnalytics';
import { POSTHOG_EVENTS } from '@/lib/posthog/config';
import { getOrCreateCheckoutSessionId, resetCheckoutSessionId } from '@/lib/posthog/checkoutSession';
import { trackMetaInitiateCheckout, trackMetaPurchaseEvents } from '@/lib/meta/client';

const ONLINE_PAYMENT_ENABLED = false;
const GUEST_ADDRESS_ID = 'guest-checkout-address';
const CHECKOUT_STORAGE_KEY = 'ksarwar.checkout.v1';
const LOGIN_PROMPT_STORAGE_KEY = 'ksarwar.checkout.loginPromptShown';
const ADDRESS_FIELDS = ['name', 'email', 'street', 'city', 'state', 'zip', 'country', 'phone'];

function createCheckoutIdempotencyKey() {
    const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    return `checkout.${id}`;
}

function sanitizeAddress(address) {
    if (!address || typeof address !== 'object') {
        return null;
    }

    const sanitized = ADDRESS_FIELDS.reduce((acc, field) => {
        acc[field] = String(address[field] || '').trim();
        return acc;
    }, {});

    return ADDRESS_FIELDS.every((field) => sanitized[field]) ? sanitized : null;
}

function getUserProfile(user) {
    return {
        name: user?.fullName || user?.username || '',
        email: user?.primaryEmailAddress?.emailAddress || '',
        phone: user?.primaryPhoneNumber?.phoneNumber || '',
    };
}

function mergeUserProfileIntoAddress(address, user) {
    const profile = getUserProfile(user);

    return {
        ...address,
        name: profile.name || address.name,
        email: profile.email || address.email,
        phone: address.phone || profile.phone,
    };
}

function addressesMatch(first, second) {
    const a = sanitizeAddress(first);
    const b = sanitizeAddress(second);

    if (!a || !b) {
        return false;
    }

    return ADDRESS_FIELDS.every((field) => a[field].toLowerCase() === b[field].toLowerCase());
}

function isAuthError(error) {
    return error?.response?.status === 401 || error?.response?.status === 403;
}

const OrderSummary = ({
    totals,
    items,
    cartItems,
    couponCode,
    setCouponCode,
    refreshTotals,
    pricingLoading = false,
}) => {

    const { user, isLoaded: isUserLoaded } = useUser()
    const { getToken } = useAuth()
    const { openSignIn } = useClerk()
    const dispatch = useDispatch()
    const { capture } = useAnalytics()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';

    const router = useRouter();

    const addressList = useSelector(state => state.address.list);

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [checkoutIdempotencyKey, setCheckoutIdempotencyKey] = useState(createCheckoutIdempotencyKey);
    const beginCheckoutTrackedRef = useRef(false);
    const autoSaveAddressRef = useRef(false);
    const coupon = totals?.appliedCoupon || null;
    const subtotal = Number(totals?.subtotal || 0);
    const couponDiscount = Number(totals?.couponDiscount || 0);
    const shipping = Number(totals?.shipping || 0);
    const total = Number(totals?.total || 0);

    const persistPendingCheckout = (address) => {
        if (typeof window === 'undefined') {
            return;
        }

        const pendingAddress = sanitizeAddress(address);

        if (!pendingAddress) {
            window.sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
            return;
        }

        window.sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify({
            address: pendingAddress,
            savedAt: Date.now(),
        }));
    };

    const clearPendingCheckout = () => {
        if (typeof window === 'undefined') {
            return;
        }

        window.sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
    };

    const showCheckoutLoginPrompt = () => {
        setShowLoginPrompt(true);
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(LOGIN_PROMPT_STORAGE_KEY, '1');
        }
        capture(POSTHOG_EVENTS.LOGIN_PROMPT_SHOWN, {
            checkout_session_id: getOrCreateCheckoutSessionId(),
            checkout_stage: 'login_prompt_shown',
            trigger: 'place_order',
            has_address: Boolean(selectedAddress),
            total_price: total,
        });
    };

    const ensureCheckoutAddress = async () => {
        const sanitizedAddress = sanitizeAddress(selectedAddress);

        if (!sanitizedAddress) {
            return null;
        }

        if (selectedAddress?.id && selectedAddress.id !== GUEST_ADDRESS_ID) {
            return selectedAddress;
        }

        if (!user) {
            return null;
        }

        const accountReadyAddress = mergeUserProfileIntoAddress(sanitizedAddress, user);
        const matchingAddress = addressList.find((address) => addressesMatch(address, accountReadyAddress));

        if (matchingAddress) {
            setSelectedAddress(matchingAddress);
            clearPendingCheckout();
            return matchingAddress;
        }

        const token = await getToken();
        const { data } = await axios.post('/api/address', { address: accountReadyAddress }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        dispatch(addAddress(data.newAddress));
        setSelectedAddress(data.newAddress);
        clearPendingCheckout();
        return data.newAddress;
    };

    const handleSaveAddress = async (nextAddress) => {
        const sanitizedAddress = sanitizeAddress(nextAddress);

        if (!sanitizedAddress) {
            toast.error('Please fill all delivery details.');
            return;
        }

        capture(POSTHOG_EVENTS.ADDRESS_COMPLETED, {
            checkout_session_id: getOrCreateCheckoutSessionId(),
            checkout_stage: 'address_completed',
            is_logged_in: Boolean(user),
            source: 'checkout_address_modal',
        });

        if (!user) {
            const guestAddress = { ...sanitizedAddress, id: GUEST_ADDRESS_ID };
            setSelectedAddress(guestAddress);
            persistPendingCheckout(guestAddress);
            setShowAddressModal(false);
            toast.success('Delivery details saved for this checkout.');
            return;
        }

        try {
            setIsSavingAddress(true);
            const accountReadyAddress = mergeUserProfileIntoAddress(sanitizedAddress, user);
            const matchingAddress = addressList.find((address) => addressesMatch(address, accountReadyAddress));

            if (matchingAddress) {
                setSelectedAddress(matchingAddress);
                clearPendingCheckout();
                setShowAddressModal(false);
                toast.success('Delivery address selected.');
                return;
            }

            const token = await getToken();
            const { data } = await axios.post('/api/address', { address: accountReadyAddress }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            dispatch(addAddress(data.newAddress));
            setSelectedAddress(data.newAddress);
            clearPendingCheckout();
            setShowAddressModal(false);
            toast.success(data.message || 'Delivery address saved.');
        } catch (error) {
            if (isAuthError(error)) {
                persistPendingCheckout(sanitizedAddress);
                showCheckoutLoginPrompt();
                return;
            }

            toast.error(error?.response?.data?.error || error.message);
        } finally {
            setIsSavingAddress(false);
        }
    };

    const handleCouponCode = async (event) => {
        event.preventDefault();
        try {
            if(!user){
                showCheckoutLoginPrompt();
                return;
            }
            const token = await getToken();
            const { data } = await axios.post('/api/coupon', {code: couponCodeInput, cartItems}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setCouponCode(data.coupon.code)
            await refreshTotals(data.coupon.code)
            capture(POSTHOG_EVENTS.COUPON_APPLIED, {
                coupon_code: data.coupon.code,
                discount: data.coupon.discount,
            })
            toast.success('Coupon Applied')
        } catch (error) {
            if (isAuthError(error)) {
                showCheckoutLoginPrompt();
                return;
            }
            toast.error(error?.response?.data?.error || error.message)
        }
        
    }

    const handleLoginClick = () => {
        capture(POSTHOG_EVENTS.LOGIN_STARTED, {
            checkout_session_id: getOrCreateCheckoutSessionId(),
            checkout_stage: 'login_started',
            trigger: 'checkout_prompt',
            has_address: Boolean(selectedAddress),
            total_price: total,
        });
        setShowLoginPrompt(false);
        openSignIn();
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        if (isSubmitting) {
            return;
        }

        if (!selectedAddress) {
            toast('Please add a delivery address.');
            return;
        }

        if (paymentMethod !== 'COD' && !ONLINE_PAYMENT_ENABLED) {
            toast('Online payment is coming soon. Cash on Delivery is available now.');
            setPaymentMethod('COD');
            return;
        }

        if (!user) {
            persistPendingCheckout(selectedAddress);
            showCheckoutLoginPrompt();
            return;
        }

        try {
            setIsSubmitting(true);
            const token = await getToken();
            const checkoutAddress = await ensureCheckoutAddress();

            if (!checkoutAddress?.id) {
                toast.error('Please add a valid delivery address.');
                return;
            }

            const orderData = {
                addressId: checkoutAddress.id,
                items: cartItems,
                paymentMethod,
                expectedTotal: total,
                idempotencyKey: checkoutIdempotencyKey,
            };

            if (coupon) {
                orderData.couponCode = coupon.code;
            }

            capture(POSTHOG_EVENTS.CHECKOUT_STARTED, {
                checkout_session_id: getOrCreateCheckoutSessionId(),
                checkout_stage: 'place_order_started',
                payment_method: paymentMethod,
                items_count: items.length,
                total_price: total,
                coupon_code: coupon?.code || '',
            })
            trackMetaInitiateCheckout({
                items,
                value: total,
                couponCode: coupon?.code || '',
            })

            // Step 1: Create Order in DB
            const { data } = await axios.post('/api/orders', orderData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (ONLINE_PAYMENT_ENABLED && paymentMethod === 'RAZORPAY') {

                // Step 2: Create Razorpay Order
                const razorRes = await axios.post('/api/payment/create-order', {
                    orderIds: data.orderIds
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const razorOrder = razorRes.data;
                let paymentDone = false;

                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: razorOrder.amount,
                    currency: razorOrder.currency,
                    name: "K-SARWAR",
                    description: "Order Payment",
                    order_id: razorOrder.id,

                    handler: async function (response) {
                        paymentDone = true;

                        // Step 3: Verify Payment
                        // Fresh token because the Razorpay modal can stay open for a while.
                        const freshToken = await getToken();
                        const verifyRes = await axios.post('/api/payment/verify', {
                            ...response,
                             orderIds: data.orderIds 
                        }, {
                            headers: { Authorization: `Bearer ${freshToken}` }
                        });

                        trackMetaPurchaseEvents(verifyRes.data?.metaPurchaseEvents || []);
                        capture(POSTHOG_EVENTS.CHECKOUT_COMPLETED, {
                            checkout_session_id: getOrCreateCheckoutSessionId(),
                            checkout_stage: 'checkout_completed',
                            payment_method: paymentMethod,
                            order_ids: data.orderIds,
                            total_price: total,
                        });
                        clearPendingCheckout();
                        resetCheckoutSessionId();
                        toast.success("Payment Successful");
                        router.push('/orders');
                        dispatch(fetchCart({ getToken }));
                    },

                    modal: {
                        ondismiss: async function () {
                            if (paymentDone) return;

                            try {
                                await axios.post('/api/orders/cancel', {
                                    orderIds: data.orderIds
                                }, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                                toast.error('Payment cancelled. Order removed.');
                            } catch (err) {
                                console.error('Order cleanup failed:', err);
                            }
                        }
                    },

                    theme: {
                        color: "#000000",
                    },
                };

                const razor = new window.Razorpay(options);
                razor.open();

            } else {
                // COD
                await trackMetaPurchaseEvents(data.metaPurchaseEvents || []);
                capture(POSTHOG_EVENTS.CHECKOUT_COMPLETED, {
                    checkout_session_id: getOrCreateCheckoutSessionId(),
                    checkout_stage: 'checkout_completed',
                    payment_method: paymentMethod,
                    order_ids: data.orderIds,
                    total_price: total,
                });
                clearPendingCheckout();
                resetCheckoutSessionId();
                setCheckoutIdempotencyKey(createCheckoutIdempotencyKey());
                toast.success(data.message);
                router.push('/orders');
                dispatch(fetchCart({ getToken }));
            }

        } catch (error) {
            if (isAuthError(error)) {
                persistPendingCheckout(selectedAddress);
                showCheckoutLoginPrompt();
                return;
            }

            if (error?.response?.status === 409) {
                await refreshTotals(couponCode)
            }
            toast.error(error?.response?.data?.error || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            const savedCheckout = JSON.parse(window.sessionStorage.getItem(CHECKOUT_STORAGE_KEY) || '{}');
            const savedAddress = sanitizeAddress(savedCheckout.address);

            if (savedAddress) {
                setSelectedAddress({ ...savedAddress, id: GUEST_ADDRESS_ID });
            }
        } catch (error) {
            window.sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
        }
    }, []);

    useEffect(() => {
        if (!items?.length || beginCheckoutTrackedRef.current) {
            return;
        }

        beginCheckoutTrackedRef.current = true;
        capture(POSTHOG_EVENTS.BEGIN_CHECKOUT, {
            checkout_session_id: getOrCreateCheckoutSessionId(),
            checkout_stage: 'begin_checkout',
            items_count: items.length,
            total_price: total,
        });
    }, [capture, items, total]);

    useEffect(() => {
        if (!isUserLoaded || !user || typeof window === 'undefined') {
            return;
        }

        if (window.sessionStorage.getItem(LOGIN_PROMPT_STORAGE_KEY)) {
            capture(POSTHOG_EVENTS.LOGIN_COMPLETED, {
                checkout_session_id: getOrCreateCheckoutSessionId(),
                checkout_stage: 'login_completed',
                trigger: 'checkout_prompt',
                total_price: total,
            });
            window.sessionStorage.removeItem(LOGIN_PROMPT_STORAGE_KEY);
        }
    }, [capture, isUserLoaded, total, user]);

    useEffect(() => {
        if (!user || !selectedAddress || selectedAddress.id !== GUEST_ADDRESS_ID) {
            return;
        }

        const sanitizedAddress = sanitizeAddress(selectedAddress);
        if (!sanitizedAddress || autoSaveAddressRef.current) {
            return;
        }

        const accountReadyAddress = mergeUserProfileIntoAddress(sanitizedAddress, user);
        setSelectedAddress({ ...accountReadyAddress, id: GUEST_ADDRESS_ID });
        persistPendingCheckout(accountReadyAddress);

        autoSaveAddressRef.current = true;
        ensureCheckoutAddress().catch((error) => {
            autoSaveAddressRef.current = false;
            if (isAuthError(error)) {
                showCheckoutLoginPrompt();
                return;
            }
            toast.error(error?.response?.data?.error || error.message);
        });
    }, [user, selectedAddress, addressList]);

    return (
        <div className='w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm sm:text-base lg:text-sm rounded-xl p-4 sm:p-7'>
            <h2 className='text-xl font-medium text-slate-600'>Payment Summary</h2>

            <p className='text-slate-400 text-xs my-4'>Payment Method</p>
            <fieldset className='space-y-3'>
                <label htmlFor="COD" className='flex cursor-pointer gap-3 rounded-lg border border-slate-300 bg-white p-3 text-slate-700'>
                    <input type="radio" id="COD" name="payment" onChange={() => setPaymentMethod('COD')} checked={paymentMethod === 'COD'} className='mt-1 accent-slate-700' />
                    <span className='min-w-0 flex-1'>
                        <span className='flex items-center justify-between gap-2 font-medium'>
                            Cash on Delivery
                            <span className='shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700'>Available now</span>
                        </span>
                        <span className='mt-1 block text-xs text-slate-500'>Pay in cash when your order arrives.</span>
                    </span>
                </label>

                <label htmlFor="RAZORPAY" className='flex cursor-not-allowed gap-3 rounded-lg border border-slate-200 bg-slate-100/70 p-3 text-slate-400'>
                    <input type="radio" id="RAZORPAY" name='payment' disabled checked={false} className='mt-1 accent-slate-400' />
                    <span className='min-w-0 flex-1'>
                        <span className='flex items-center justify-between gap-2 font-medium text-slate-500'>
                            Online Payment
                            <span className='shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500'>Coming Soon</span>
                        </span>
                        <span className='mt-1 block text-xs'>UPI · Debit/Credit Cards · Net Banking</span>
                        <span className='mt-1 flex items-center gap-1 text-xs'>
                            <LockKeyhole size={12} />
                            Secure payments powered by Razorpay
                        </span>
                    </span>
                </label>
            </fieldset>

            <div className='my-4 py-4 border-y border-slate-200 text-slate-400'>
                <p>Address</p>
                {
                    selectedAddress ? (
                        <div className='flex gap-2 items-start mt-2'>
                            <div className='min-w-0 flex-1 text-xs leading-5'>
                                <p className='font-medium text-slate-600'>{selectedAddress.name}</p>
                                <p className='break-words'>{selectedAddress.email}</p>
                                <p className='break-words'>{selectedAddress.street}</p>
                                <p>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.zip}</p>
                                <p>{selectedAddress.country}</p>
                                <p>Phone: {selectedAddress.phone}</p>
                            </div>
                            <button type="button" aria-label="Edit delivery address" onClick={() => setShowAddressModal(true)} className='shrink-0 rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700'>
                                <SquarePenIcon size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="min-w-0">
                            {
                                user && addressList.length > 0 && (
                                    <select className='border border-slate-300 p-2 w-full my-3 outline-none rounded text-sm text-slate-600' onChange={(e) => setSelectedAddress(addressList[e.target.value] || null)} >
                                        <option value="">Select Address</option>
                                        {
                                            addressList.map((address, index) => (
                                                <option key={address.id || index} value={index}>{address.name}, {address.street}, {address.city}, {address.state} - {address.zip}</option>
                                            ))
                                        }
                                    </select>
                                )
                            }
                            <button
                                type="button"
                                className='flex items-center gap-1 text-slate-600 mt-2 transition hover:text-slate-900'
                                onClick={() => {
                                    capture(POSTHOG_EVENTS.ADDRESS_STARTED, {
                                        checkout_session_id: getOrCreateCheckoutSessionId(),
                                        checkout_stage: 'address_started',
                                        is_logged_in: Boolean(user),
                                        source: 'checkout_summary',
                                    });
                                    setShowAddressModal(true);
                                }}
                            >
                                Add Address <PlusIcon size={18} />
                            </button>
                        </div>
                    )
                }
            </div>
            <div className='pb-4 border-b border-slate-200'>
                <div className='flex justify-between'>
                    <div className='flex flex-col gap-1 text-slate-400'>
                        <p>Subtotal:</p>
                        <p>Shipping:</p>
                        {coupon && <p>Coupon ({coupon.code}):</p>}
                    </div>
                    <div className='flex flex-col gap-1 font-medium text-right'>
                        <p>{currency}{subtotal.toLocaleString()}</p>
                        <p>{shipping > 0 ? `${currency}${shipping.toLocaleString()}` : 'Free'}</p>
                        {coupon && <p>{`-${currency}${couponDiscount.toLocaleString()}`}</p>}
                    </div>
                </div>
                {
                    !coupon ? (
                        <form onSubmit={handleCouponCode} className='flex flex-col justify-center gap-3 mt-3 sm:flex-row'>
                            <input onChange={(e) => setCouponCodeInput(e.target.value)} value={couponCodeInput} type="text" placeholder='Coupon Code' className='border border-slate-400 p-1.5 rounded w-full outline-none' />
                            <button className='bg-slate-600 text-white px-3 py-2 rounded hover:bg-slate-800 active:scale-95 transition-all sm:py-0'>Apply</button>
                        </form>
                    ) : (
                        <div className='w-full flex items-center justify-center gap-2 text-xs mt-2'>
                            <p>Code: <span className='font-semibold ml-1'>{coupon.code.toUpperCase()}</span></p>
                            <p>{coupon.description}</p>
                            <XIcon size={18} onClick={() => {
                                setCouponCode('')
                                setCouponCodeInput('')
                                refreshTotals('')
                            }} className='hover:text-red-700 transition cursor-pointer' />
                        </div>
                    )
                }
            </div>
            <div className='flex justify-between py-4'>
                <p>Total:</p>
                <p className='font-medium text-right'>
                    {currency}{total.toLocaleString()}
                </p>
            </div>
            <button disabled={pricingLoading || isSubmitting} onClick={handlePlaceOrder} className='w-full bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 active:scale-95 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed'>
                {pricingLoading ? 'Updating totals...' : isSubmitting ? 'Placing order...' : 'Place Order'}
            </button>

            {showAddressModal && (
                <AddressModal
                    setShowAddressModal={setShowAddressModal}
                    initialAddress={selectedAddress || undefined}
                    onSaveAddress={handleSaveAddress}
                    isSaving={isSavingAddress}
                />
            )}

            {showLoginPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-2xl sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D7E5BB] text-[#344E41]">
                                <CheckCircle2 size={20} />
                            </div>
                            <button
                                type="button"
                                aria-label="Close login prompt"
                                className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                onClick={() => setShowLoginPrompt(false)}
                            >
                                <XIcon size={18} />
                            </button>
                        </div>
                        <h3 className="mt-4 text-2xl font-semibold text-slate-800">You're almost there</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Log in to securely complete your order. Your delivery details will stay here, so you will not need to enter them again.
                        </p>
                        <button
                            type="button"
                            onClick={handleLoginClick}
                            className="mt-5 min-h-11 w-full rounded-full bg-[#344E41] px-5 text-sm font-semibold text-white transition hover:bg-[#1E372B] active:scale-[0.98]"
                        >
                            Log in to complete order
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowLoginPrompt(false)}
                            className="mt-3 min-h-10 w-full rounded-full px-5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                        >
                            Review details
                        </button>
                    </div>
                </div>
            )}

        </div>
    )
}

export default OrderSummary
