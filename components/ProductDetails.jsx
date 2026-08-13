'use client'

import { addToCart } from "@/lib/features/cart/cartSlice";
import {
    BadgeCheck,
    CreditCardIcon,
    FlaskConical,
    Leaf,
    PackageCheck,
    ShieldCheck,
    Sparkles,
    StarIcon,
    TagIcon,
    Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useEffect, useRef } from "react";
import { useAnalytics } from "@/lib/posthog/useAnalytics";
import { POSTHOG_EVENTS } from "@/lib/posthog/config";

const careHighlights = [
    { label: "Research led", icon: FlaskConical },
    { label: "Daily care", icon: Leaf },
    { label: "Quality checked", icon: BadgeCheck },
];

const serviceHighlights = [
    { title: "Free shipping", detail: "On prepaid orders", icon: Truck },
    { title: "Secure payment", detail: "Razorpay protected", icon: CreditCardIcon },
    { title: "Care support", detail: "Help after purchase", icon: ShieldCheck },
];

const ProductDetails = ({ product }) => {

    const productId = product.id;
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';

    const cart = useSelector(state => state.cart.cartItems);
    const dispatch = useDispatch();
    const { capture } = useAnalytics();
    const trackedViewRef = useRef(false);

    const router = useRouter()

    const [mainImage, setMainImage] = useState(product.images[0]);

    const ratingCount = product.rating?.length || 0;
    const mrp = Number(product.mrp) || 0;
    const price = Number(product.price) || 0;
    const hasDiscount = mrp > price && mrp > 0;
    const savingsPercent = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : 0;
    const savingsAmount = hasDiscount ? mrp - price : 0;
    const formattedPrice = `${currency}${price.toLocaleString("en-IN")}`;
    const formattedMrp = `${currency}${mrp.toLocaleString("en-IN")}`;
    const formattedSavings = `${currency}${savingsAmount.toLocaleString("en-IN")}`;

    const addToCartHandler = () => {
        if (!product.inStock) return toast('This product is currently out of stock')
        capture(POSTHOG_EVENTS.ADD_TO_CART_CLICKED, {
            product_id: product.id,
            product_name: product.name,
            category: product.category,
            price: product.price,
            source: 'product_page',
        })
        dispatch(addToCart({ productId }))
    }

    useEffect(() => {
        if (trackedViewRef.current) return
        trackedViewRef.current = true
        capture(POSTHOG_EVENTS.PRODUCT_VIEWED, {
            product_id: product.id,
            product_name: product.name,
            category: product.category,
            price: product.price,
            in_stock: product.inStock,
            store_id: product.storeId,
            store_name: product.store?.name || '',
        })
    }, [capture, product])

    const averageRating =
        ratingCount > 0
            ? product.rating.reduce((acc, item) => acc + item.rating, 0) / ratingCount
            : 0;

    return (
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(380px,0.98fr)] lg:items-start">

            <div className="grid gap-4 sm:grid-cols-[94px_minmax(0,1fr)] lg:sticky lg:top-28">

                <div className="order-2 flex gap-3 overflow-x-auto pb-1 sm:order-1 sm:flex-col sm:overflow-visible sm:pb-0">
                    {product.images.map((image, index) => (
                        <button
                            type="button"
                            key={index}
                            onClick={() => setMainImage(product.images[index])}
                            aria-label={`View product image ${index + 1}`}
                            className={`group flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-[#FCF9F8] p-2 transition sm:h-24 sm:w-full ${
                                mainImage === image
                                    ? "border-[#344E41] shadow-[0_0_0_4px_rgba(52,78,65,0.08)]"
                                    : "border-[#E5E2E1] hover:border-[#B8C5B2]"
                            }`}
                        >
                            <Image
                                src={image}
                                alt={`${product.name} thumbnail ${index + 1}`}
                                width={88}
                                height={88}
                                className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                            />
                        </button>
                    ))}
                </div>

                <div className="relative order-1 flex min-h-[360px] items-center justify-center overflow-hidden rounded-[28px] border border-[#E5E2E1] bg-[#F7F1E6] shadow-[0_24px_70px_rgba(30,55,43,0.08)] sm:order-2 sm:min-h-[520px]">
                    <div className="absolute left-5 top-5 z-10 rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#344E41] shadow-sm backdrop-blur">
                        K-SARWAR Lab
                    </div>
                    <Image
                        src={mainImage}
                        alt={product.name}
                        fill
                        className="object-contain p-8 sm:p-12"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 82vw, 560px"
                        priority
                    />
                    {!product.inStock && (
                        <div className="absolute right-5 top-5 z-10 rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700 shadow-sm">
                            Out of stock
                        </div>
                    )}
                </div>

            </div>

            <div className="rounded-[28px] border border-[#E5E2E1] bg-[#FCF9F8] p-5 shadow-[0_18px_56px_rgba(30,55,43,0.06)] sm:p-7 lg:p-8">

                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#D7E5BB] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#344E41]">
                        {product.category}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E2E1] bg-white px-3 py-1 text-xs font-semibold text-[#59645D]">
                        <Sparkles size={13} className="text-[#D8BD78]" />
                        Premium care routine
                    </span>
                </div>

                <h1 className="mt-5 font-serif text-[30px] font-medium leading-[1.12] text-[#1E372B] sm:text-[36px] lg:text-[40px]">
                    {product.name}
                </h1>

                <div className='mt-4 flex flex-wrap items-center gap-3'>
                    <div className="flex items-center rounded-full border border-[#E5E2E1] bg-white px-3 py-1.5">
                    {Array(5).fill('').map((_, index) => (
                        <StarIcon
                            key={index}
                                size={15}
                                className='text-transparent'
                                fill={averageRating >= index + 1 ? "#D8BD78" : "#DAD7D0"}
                        />
                    ))}
                    </div>
                    <p className="text-sm font-medium text-[#6E776F]">
                        {ratingCount > 0 ? `${averageRating.toFixed(1)} average` : "New arrival"} - {ratingCount} Reviews
                    </p>
                </div>

                <div className="my-7 border-y border-[#E5E2E1] py-6">
                    <div className="flex flex-wrap items-end gap-3">
                        <p className="text-4xl font-semibold tracking-normal text-[#1E372B]">{formattedPrice}</p>
                        {hasDiscount && (
                            <p className="pb-1 text-xl font-medium text-[#9A8F7B] line-through">
                                {formattedMrp}
                            </p>
                        )}
                    </div>

                    {hasDiscount && (
                        <div className="mt-4 flex flex-wrap gap-3">
                            <p className="inline-flex items-center gap-2 rounded-full bg-[#EEF4DE] px-3 py-2 text-sm font-semibold text-[#344E41]">
                                <TagIcon size={15} />
                                Save {savingsPercent}% today
                            </p>
                            <p className="inline-flex items-center gap-2 rounded-full border border-[#E5E2E1] bg-white px-3 py-2 text-sm font-semibold text-[#6E776F]">
                                You save {formattedSavings}
                            </p>
                        </div>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    {careHighlights.map((item) => (
                        <div key={item.label} className="flex min-h-20 items-center gap-3 rounded-2xl border border-[#E5E2E1] bg-white px-4 py-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0EAD8] text-[#344E41]">
                                <item.icon size={18} />
                            </span>
                            <span className="text-sm font-semibold leading-tight text-[#1E372B]">{item.label}</span>
                        </div>
                    ))}
                </div>

                {!product.inStock && (
                    <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                        <p className="text-sm font-semibold text-rose-700">Currently unavailable</p>
                        <p className="mt-1 text-sm text-rose-600">
                            This item is taking a short pause while we prepare the next fresh batch for you.
                        </p>
                    </div>
                )}

                <div className="mt-7 rounded-[22px] border border-[#E5E2E1] bg-[#F8F4EA] p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#77806F]">Purchase</p>
                            <p className="mt-1 text-base font-semibold text-[#1E372B]">Add this care step to your routine</p>
                        </div>
                        <PackageCheck className="hidden h-8 w-8 shrink-0 text-[#344E41] sm:block" />
                    </div>

                    <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
                    {
                        product.inStock && cart[productId] && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-sm font-semibold text-[#1E372B]">
                                    Quantity
                                </p>
                                <Counter productId={productId} />
                            </div>
                        )
                    }

                    <button
                        onClick={() => !cart[productId] ? addToCartHandler() : router.push('/cart')}
                        disabled={!product.inStock}
                            className={`min-h-12 flex-1 rounded-full px-8 text-sm font-semibold transition ${
                            product.inStock
                                    ? 'bg-[#344E41] text-white shadow-[0_12px_26px_rgba(52,78,65,0.18)] hover:bg-[#1E372B] active:scale-[0.98]'
                                    : 'bg-[#E2DED3] text-[#8E877A] cursor-not-allowed'
                        }`}
                    >
                        {!product.inStock ? 'Unavailable Right Now' : !cart[productId] ? 'Add to Cart' : 'View Cart'}
                    </button>
                    </div>
                </div>

                <div className="mt-5 grid gap-3 text-[#59645D] sm:grid-cols-3">
                    {serviceHighlights.map((item) => (
                        <div key={item.title} className="flex gap-3 rounded-2xl border border-[#E5E2E1] bg-white p-4">
                            <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#344E41]" />
                            <div>
                                <p className="text-sm font-semibold text-[#1E372B]">{item.title}</p>
                                <p className="mt-1 text-xs leading-5 text-[#7A8178]">{item.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>

        </section>
    )
}

export default ProductDetails
