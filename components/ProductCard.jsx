'use client'
import { StarIcon, PlusIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { addToCart } from '@/lib/features/cart/cartSlice'
import toast from 'react-hot-toast'
import { useUser } from '@clerk/nextjs'
import { useAnalytics } from '@/lib/posthog/useAnalytics'
import { POSTHOG_EVENTS } from '@/lib/posthog/config'
import { trackMetaAddToCart } from '@/lib/meta/client'
import CampaignCountdown from '@/components/CampaignCountdown'

const ProductCard = ({ product, truncateName = true, eventSource = 'product_grid' }) => {

const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
const dispatch = useDispatch()
const { user } = useUser()
const { capture } = useAnalytics()
const [campaignVisible, setCampaignVisible] = useState(Boolean(product.activeCampaign))

const activeCampaign = campaignVisible ? product.activeCampaign : null
const displayPrice = activeCampaign ? Number(product.effectivePrice) : Number(product.price)
const originalPrice = activeCampaign
    ? Number(product.mrp) > displayPrice
        ? Number(product.mrp)
        : Number(product.price)
    : Number(product.mrp)
const hasOriginalPrice = originalPrice > displayPrice
const totalRatings = product.rating?.length || 0
const avgRating = totalRatings > 0
    ? (product.rating.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings).toFixed(1)
    : null
const roundedRating = avgRating ? Math.round(avgRating) : 0

const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product.inStock) return toast('Currently out of stock')
    if (!user) return toast('Please login to add to cart')
    capture(POSTHOG_EVENTS.ADD_TO_CART_CLICKED, {
        product_id: product.id,
        product_name: product.name,
        category: product.category,
        price: product.price,
        source: `${eventSource}_card`,
    })
    trackMetaAddToCart(product)
    dispatch(addToCart({ productId: product.id }))
    toast.success('Added to cart')
}

return (

    <Link
        href={`/product/${product.id}`}
        onClick={() => capture(POSTHOG_EVENTS.PRODUCT_CARD_CLICKED, {
            product_id: product.id,
            product_name: product.name,
            category: product.category,
            price: product.price,
            in_stock: product.inStock,
            source: eventSource,
        })}
        className='group block w-full border border-slate-200/70 rounded-xl p-3 bg-slate-50 transition-all duration-300 hover:border-slate-300 hover:shadow-sm'
    >

        <div className='relative w-full aspect-square bg-[#F8F8F8] rounded-lg overflow-hidden'>

            <Image
                fill
                className={`transition duration-300 ${product.inStock ? 'object-cover group-hover:scale-[1.04]' : 'object-cover opacity-80'}`}
                src={product.images[0]}
                alt={product.name}
                sizes="(max-width: 640px) 50vw, 25vw"
            />

            {!product.inStock && (
                <>
                    <div className='absolute inset-0 bg-slate-950/10' />
                    <div className='absolute left-2 top-2 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700'>
                        Out of stock
                    </div>
                </>
            )}

        </div>

        <div className='flex justify-between items-end gap-3 pt-2'>

            <div className='flex-1 min-w-0'>

                <p className={`text-[13px] text-slate-800 font-medium leading-snug overflow-hidden ${truncateName ? 'line-clamp-2' : ''}`}>
                    {product.name}
                </p>

                {!product.inStock && (
                    <p className='mt-1 text-[11px] font-medium text-rose-600 line-clamp-1'>
                        Fresh batch in progress. Restocking soon.
                    </p>
                )}

                <div className='flex items-center gap-1.5 mt-1 whitespace-nowrap'>

                    <div className='flex'>
                        {Array(5).fill('').map((_, index) => (
                            <StarIcon
                                key={index}
                                size={12}
                                className='text-transparent'
                                fill={roundedRating >= index + 1 ? "#16A34A" : "#E5E7EB"}
                            />
                        ))}
                    </div>

                    {avgRating
                        ? <span className='text-xs text-slate-500'>{avgRating} ({totalRatings})</span>
                        : <span className='text-xs text-slate-400'>No reviews</span>
                    }

                </div>

                <div className='flex items-center gap-2 mt-1'>

    <p className='text-sm font-semibold text-slate-900'>
        {currency}{displayPrice.toLocaleString()}
    </p>

    {hasOriginalPrice && (
        <>
            <p className='text-xs text-slate-400 line-through'>
                {currency}{originalPrice.toLocaleString()}
            </p>
        </>
    )}

</div>

                {activeCampaign && (
                    <div className='mt-2 space-y-2'>
                        <p className='inline-flex w-fit rounded-full bg-[#EEF4DE] px-2 py-1 text-[10px] font-semibold text-[#344E41]'>
                            {activeCampaign.name || 'Limited Time Offer'}
                        </p>
                        {activeCampaign.showCountdown && (
                            <CampaignCountdown
                                endsAt={activeCampaign.endsAt}
                                compact
                                onExpire={() => setCampaignVisible(false)}
                            />
                        )}
                    </div>
                )}

            </div>

            <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className={`shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-all shadow-sm ${
                    product.inStock
                        ? 'bg-slate-900 hover:bg-black text-white active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
                <PlusIcon size={18} />
            </button>

        </div>

    </Link>

)

}

export default ProductCard
