'use client'
import { StarIcon, PlusIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useDispatch } from 'react-redux'
import { addToCart } from '@/lib/features/cart/cartSlice'
import toast from 'react-hot-toast'
import { useUser } from '@clerk/nextjs'

const ProductCard = ({ product, truncateName = true }) => {

const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
const dispatch = useDispatch()
const { user } = useUser()

const totalRatings = product.rating.length
const avgRating = totalRatings > 0
    ? (product.rating.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings).toFixed(1)
    : null
const roundedRating = avgRating ? Math.round(avgRating) : 0

const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product.inStock) return toast('Currently out of stock')
    if (!user) return toast('Please login to add to cart')
    dispatch(addToCart({ productId: product.id }))
    toast.success('Added to cart')
}

return (

    <Link
        href={`/product/${product.id}`}
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
        {currency}{product.price.toLocaleString()}
    </p>

    {product.mrp && product.mrp > product.price && (
        <>
            <p className='text-xs text-slate-400 line-through'>
                {currency}{product.mrp.toLocaleString()}
            </p>
        </>
    )}

</div>

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
