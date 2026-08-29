'use client'
import Counter from "@/components/Counter";
import OrderSummary from "@/components/OrderSummary";
import PageTitle from "@/components/PageTitle";
import { deleteItemFromCart, fetchCart } from "@/lib/features/cart/cartSlice";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

function CartSkeleton() {
    const rows = [0, 1, 2];

    return (
        <div className="min-h-screen mx-6 text-slate-800">
            <div className="max-w-7xl mx-auto">
                <PageTitle heading="My Cart" text="items in your cart" linkText="Add more" />

                <div className="flex items-start justify-between gap-5 max-lg:flex-col">
                    <div className="w-full max-w-4xl animate-pulse">
                        <div className="hidden md:block">
                            <div className="grid grid-cols-[58%_18%_16%_8%] pb-3 text-sm text-slate-300">
                                <div className="h-4 w-20 rounded bg-slate-200" />
                                <div className="mx-auto h-4 w-16 rounded bg-slate-200" />
                                <div className="mx-auto h-4 w-20 rounded bg-slate-200" />
                                <div className="mx-auto h-4 w-14 rounded bg-slate-200" />
                            </div>
                            {rows.map((row) => (
                                <div key={row} className="grid grid-cols-[58%_18%_16%_8%] items-center border-t border-slate-100 py-4">
                                    <div className="flex items-center gap-4 pr-4">
                                        <div className="h-24 w-24 shrink-0 rounded-lg bg-slate-100" />
                                        <div className="min-w-0 flex-1 space-y-3">
                                            <div className="h-4 w-4/5 rounded bg-slate-200" />
                                            <div className="h-3 w-1/3 rounded bg-slate-100" />
                                            <div className="h-4 w-24 rounded bg-slate-200" />
                                        </div>
                                    </div>
                                    <div className="mx-auto h-9 w-24 rounded-full bg-slate-100" />
                                    <div className="mx-auto h-4 w-20 rounded bg-slate-200" />
                                    <div className="mx-auto h-9 w-9 rounded-full bg-slate-100" />
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-3 md:hidden">
                            {rows.map((row) => (
                                <div key={row} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                                    <div className="grid grid-cols-[88px_1fr] gap-3">
                                        <div className="h-[88px] w-[88px] rounded-lg bg-white" />
                                        <div className="space-y-3">
                                            <div className="h-4 w-full rounded bg-slate-200" />
                                            <div className="h-3 w-1/2 rounded bg-slate-100" />
                                            <div className="h-4 w-24 rounded bg-slate-200" />
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                                        <div className="h-9 w-24 rounded-full bg-white" />
                                        <div className="h-4 w-20 rounded bg-slate-200" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full max-w-lg lg:max-w-[340px] animate-pulse rounded-xl border border-slate-200 bg-slate-50/30 p-4 sm:p-7">
                        <div className="h-6 w-40 rounded bg-slate-200" />
                        <div className="mt-6 space-y-4">
                            <div className="h-4 w-28 rounded bg-slate-100" />
                            <div className="h-10 w-full rounded bg-slate-100" />
                            <div className="h-px w-full bg-slate-200" />
                            <div className="flex justify-between">
                                <div className="h-4 w-20 rounded bg-slate-100" />
                                <div className="h-4 w-24 rounded bg-slate-200" />
                            </div>
                            <div className="flex justify-between">
                                <div className="h-4 w-20 rounded bg-slate-100" />
                                <div className="h-4 w-16 rounded bg-slate-200" />
                            </div>
                            <div className="h-10 w-full rounded bg-slate-200" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CartErrorState({ message, onRetry }) {
    return (
        <div className="min-h-[80vh] mx-6 flex items-center justify-center text-center">
            <div className="max-w-md rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-slate-600">
                <h1 className="text-2xl font-semibold text-slate-700">Unable to load your cart</h1>
                <p className="mt-3 text-sm text-slate-500">{message}</p>
                <button onClick={onRetry} className="mt-5 rounded bg-slate-700 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-900 active:scale-95">
                    Try again
                </button>
            </div>
        </div>
    )
}

export default function Cart() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
    const { getToken, isLoaded, userId } = useAuth();
    
    const { cartItems, fetchStatus, fetchError } = useSelector(state => state.cart);

    const dispatch = useDispatch();

    const [cartArray, setCartArray] = useState([]);
    const [totals, setTotals] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [pricingLoading, setPricingLoading] = useState(true);
    const [pricingError, setPricingError] = useState(null);
    const totalsRequestRef = useRef(0);

    const fetchTotals = async (nextCouponCode = couponCode) => {
        const requestId = totalsRequestRef.current + 1;
        totalsRequestRef.current = requestId;

        try {
            setPricingLoading(true);
            setPricingError(null);
            const token = await getToken();
            const { data } = await axios.post(
                '/api/cart/totals',
                { cartItems, couponCode: nextCouponCode || undefined },
                token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
            );

            if (requestId !== totalsRequestRef.current) {
                return data.totals;
            }

            setTotals(data.totals);
            setCartArray(data.totals.items || []);
            setCouponCode(data.totals.appliedCoupon?.code || '');
            return data.totals;
        } catch (error) {
            if (requestId !== totalsRequestRef.current) {
                return null;
            }

            if (nextCouponCode) {
                setCouponCode('');
                toast.error(error?.response?.data?.error || error.message);
                return fetchTotals('');
            }

            const message = error?.response?.data?.error || error.message || 'Unable to load cart totals';
            toast.error(message);
            setPricingError(message);
            setTotals(null);
            setCartArray([]);
        } finally {
            if (requestId === totalsRequestRef.current) {
                setPricingLoading(false);
            }
        }
    }

    const handleDeleteItemFromCart = (productId) => {
        dispatch(deleteItemFromCart({ productId }))
    }

    useEffect(() => {
        if (!isLoaded) {
            return;
        }

        if (userId && fetchStatus !== 'succeeded') {
            return;
        }

        fetchTotals(couponCode);
    }, [cartItems, isLoaded, userId, fetchStatus]);

    const handleRetry = () => {
        if (userId && fetchStatus === 'failed') {
            dispatch(fetchCart({ getToken }));
            return;
        }

        fetchTotals(couponCode);
    }

    const cartFetchFailed = isLoaded && userId && fetchStatus === 'failed';
    const waitingForCartFetch = !isLoaded || (userId && (fetchStatus === 'idle' || fetchStatus === 'loading'));
    const waitingForInitialTotals = pricingLoading && !totals && !pricingError;

    if (cartFetchFailed || pricingError) {
        return (
            <CartErrorState
                message={cartFetchFailed ? fetchError || 'Please try loading your cart again.' : pricingError}
                onRetry={handleRetry}
            />
        )
    }

    if (waitingForCartFetch || waitingForInitialTotals) {
        return <CartSkeleton />
    }

    return cartArray.length > 0 ? (
        <div className="min-h-screen mx-6 text-slate-800">

            <div className="max-w-7xl mx-auto ">
                {/* Title */}
                <PageTitle heading="My Cart" text="items in your cart" linkText="Add more" />

                <div className="flex items-start justify-between gap-5 max-lg:flex-col">

                    <table className="hidden w-full max-w-4xl table-fixed text-slate-600 md:table">
                        <colgroup>
                            <col className="w-[58%]" />
                            <col className="w-[18%]" />
                            <col className="w-[16%]" />
                            <col className="w-[8%]" />
                        </colgroup>
                        <thead>
                            <tr className="max-sm:text-sm">
                                <th className="text-left">Product</th>
                                <th>Quantity</th>
                                <th>Total Price</th>
                                <th className="max-md:hidden">Remove</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                cartArray.map((item, index) => (
                                    <tr key={index} className="space-x-2">
                                        <td className="py-4 pr-4 align-middle">
                                            <div className="flex items-center gap-4">
                                            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                                                <Image src={item.images[0]} className="h-full w-full object-contain p-2" alt={item.name} width={96} height={96} />
                                            </div>
                                            <div className="min-w-0 max-w-md">
                                                <p className="text-sm font-medium leading-5 text-slate-700">{item.name}</p>
                                                <p className="text-xs text-slate-500">{item.category}</p>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {item.activeCampaign && (
                                                        <p className="text-xs text-slate-400 line-through">
                                                            {currency}{Number(item.price).toLocaleString()}
                                                        </p>
                                                    )}
                                                    <p>{currency}{Number(item.effectivePrice).toLocaleString()}</p>
                                                </div>
                                                {item.activeCampaign && (
                                                    <p className="text-xs font-medium text-emerald-700">
                                                        {item.activeCampaign.name || 'Limited Time Offer'}
                                                    </p>
                                                )}
                                            </div>
                                            </div>
                                        </td>
                                        <td className="text-center align-middle">
                                            <Counter productId={item.id} />
                                        </td>
                                        <td className="text-center align-middle font-medium">{currency}{Number(item.lineTotal).toLocaleString()}</td>
                                        <td className="text-center align-middle">
                                            <button onClick={() => handleDeleteItemFromCart(item.id)} className=" text-red-500 hover:bg-red-50 p-2.5 rounded-full active:scale-95 transition-all">
                                                <Trash2Icon size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>

                    <div className="grid w-full gap-3 md:hidden">
                        {cartArray.map((item) => (
                            <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-slate-600">
                                <div className="grid grid-cols-[88px_1fr] gap-3">
                                    <div className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-lg bg-white">
                                        <Image src={item.images[0]} className="h-full w-full object-contain p-2" alt={item.name} width={88} height={88} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium leading-5 text-slate-700">{item.name}</p>
                                        <p className="mt-1 text-xs text-slate-500">{item.category}</p>
                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                            {item.activeCampaign && (
                                                <p className="text-xs text-slate-400 line-through">
                                                    {currency}{Number(item.price).toLocaleString()}
                                                </p>
                                            )}
                                            <p className="text-sm font-semibold text-slate-800">
                                                {currency}{Number(item.effectivePrice).toLocaleString()}
                                            </p>
                                        </div>
                                        {item.activeCampaign && (
                                            <p className="mt-1 text-xs font-medium text-emerald-700">
                                                {item.activeCampaign.name || 'Limited Time Offer'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                                    <Counter productId={item.id} />
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-800">
                                            {currency}{Number(item.lineTotal).toLocaleString()}
                                        </p>
                                        <button aria-label={`Remove ${item.name}`} onClick={() => handleDeleteItemFromCart(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full active:scale-95 transition-all">
                                            <Trash2Icon size={17} />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                    <OrderSummary
                        totals={totals}
                        items={cartArray}
                        cartItems={cartItems}
                        couponCode={couponCode}
                        setCouponCode={setCouponCode}
                        refreshTotals={fetchTotals}
                        pricingLoading={pricingLoading}
                    />
                </div>
            </div>
        </div>
    ) : (
        <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400">
            <h1 className="text-2xl sm:text-4xl font-semibold">Your cart is empty</h1>
        </div>
    )
}
