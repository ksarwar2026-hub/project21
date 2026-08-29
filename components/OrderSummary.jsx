import { PlusIcon, SquarePenIcon, XIcon } from 'lucide-react';
import React, { useState } from 'react'
import AddressModal from './AddressModal';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs'
import axios from 'axios';
import { fetchCart } from '@/lib/features/cart/cartSlice';
import { useAnalytics } from '@/lib/posthog/useAnalytics';
import { POSTHOG_EVENTS } from '@/lib/posthog/config';
import { trackMetaInitiateCheckout, trackMetaPurchaseEvents } from '@/lib/meta/client';

function createCheckoutIdempotencyKey() {
    const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    return `checkout.${id}`;
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

    const {user} = useUser()
    const { getToken } = useAuth()
    const dispatch = useDispatch()
    const { capture } = useAnalytics()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';

    const router = useRouter();

    const addressList = useSelector(state => state.address.list);

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checkoutIdempotencyKey, setCheckoutIdempotencyKey] = useState(createCheckoutIdempotencyKey);
    const coupon = totals?.appliedCoupon || null;
    const subtotal = Number(totals?.subtotal || 0);
    const couponDiscount = Number(totals?.couponDiscount || 0);
    const shipping = Number(totals?.shipping || 0);
    const total = Number(totals?.total || 0);

    const handleCouponCode = async (event) => {
        event.preventDefault();
        try {
            if(!user){
                return toast('Please login to proceed')
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
            toast.error(error?.response?.data?.error || error.message)
        }
        
    }

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        if (isSubmitting) {
            return;
        }

        try {
            if (!user) {
                return toast('Please login to place an order');
            }

            if (!selectedAddress) {
                return toast('Please select an address');
            }

            setIsSubmitting(true);
            const token = await getToken();

            const orderData = {
                addressId: selectedAddress.id,
                items: cartItems,
                paymentMethod,
                expectedTotal: total,
                idempotencyKey: checkoutIdempotencyKey,
            };

            if (coupon) {
                orderData.couponCode = coupon.code;
            }

            capture(POSTHOG_EVENTS.CHECKOUT_STARTED, {
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

            if (paymentMethod === 'RAZORPAY') {

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
                        // Fresh token — purana token Razorpay modal mein expire ho sakta hai
                        const freshToken = await getToken();
                        const verifyRes = await axios.post('/api/payment/verify', {
                            ...response,
                             orderIds: data.orderIds 
                        }, {
                            headers: { Authorization: `Bearer ${freshToken}` }
                        });

                        trackMetaPurchaseEvents(verifyRes.data?.metaPurchaseEvents || []);
                        toast.success("Payment Successful 🎉");
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
                setCheckoutIdempotencyKey(createCheckoutIdempotencyKey());
                toast.success(data.message);
                router.push('/orders');
                dispatch(fetchCart({ getToken }));
            }

        } catch (error) {
            if (error?.response?.status === 409) {
                await refreshTotals(couponCode)
            }
            toast.error(error?.response?.data?.error || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className='w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm sm:text-base lg:text-sm rounded-xl p-4 sm:p-7'>
            <h2 className='text-xl font-medium text-slate-600'>Payment Summary</h2>

            {/* Razorpay under development notice */}
            <p className='text-red-500 text-xs mt-3 font-medium'>
                Online payment via Razorpay is currently under development. Please select Cash on Delivery.
            </p>

            <p className='text-slate-400 text-xs my-4'>Payment Method</p>
            <div className='flex gap-2 items-center'>
                <input type="radio" id="COD" onChange={() => setPaymentMethod('COD')} checked={paymentMethod === 'COD'} className='accent-gray-500' />
                <label htmlFor="COD" className='cursor-pointer'>COD</label>
            </div>
            <div className='flex gap-2 items-center mt-1'>
                <input type="radio" id="RAZORPAY" name='payment' onChange={() => setPaymentMethod('RAZORPAY')} checked={paymentMethod === 'RAZORPAY'} className='accent-gray-500' />
                <label htmlFor="RAZORPAY" className='cursor-pointer'>Razorpay Payment</label>
            </div>
            <div className='my-4 py-4 border-y border-slate-200 text-slate-400'>
                <p>Address</p>
                {
                    selectedAddress ? (
                        <div className='flex gap-2 items-start mt-1'>
                            <div className='text-xs leading-5'>
                                <p className='font-medium text-slate-600'>{selectedAddress.name}</p>
                                <p>{selectedAddress.street}</p>
                                <p>{selectedAddress.city}, {selectedAddress.state} – {selectedAddress.zip}</p>
                                <p>{selectedAddress.country}</p>
                                <p>Phone: {selectedAddress.phone}</p>
                            </div>
                            <SquarePenIcon onClick={() => setSelectedAddress(null)} className='cursor-pointer shrink-0 mt-1' size={16} />
                        </div>
                    ) : (
                        <div className="min-w-0">
                            {
                                addressList.length > 0 && (
                                    <select className='border border-slate-400 p-2 w-full my-3 outline-none rounded text-sm' onChange={(e) => setSelectedAddress(addressList[e.target.value])} >
                                        <option value="">Select Address</option>
                                        {
                                            addressList.map((address, index) => (
                                                <option key={index} value={index}>{address.name}, {address.street}, {address.city}, {address.state} – {address.zip}</option>
                                            ))
                                        }
                                    </select>
                                )
                            }
                            <button className='flex items-center gap-1 text-slate-600 mt-1' onClick={() => setShowAddressModal(true)} >Add Address <PlusIcon size={18} /></button>
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
                        <form onSubmit={e => toast.promise(handleCouponCode(e), { loading: 'Checking Coupon...' })} className='flex flex-col justify-center gap-3 mt-3 sm:flex-row'>
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
            <button disabled={pricingLoading || isSubmitting} onClick={e => toast.promise(handlePlaceOrder(e), { loading: 'placing Order...' })} className='w-full bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 active:scale-95 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed'>
                {pricingLoading ? 'Updating totals...' : isSubmitting ? 'Placing order...' : 'Place Order'}
            </button>

            {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}

        </div>
    )
}

export default OrderSummary
