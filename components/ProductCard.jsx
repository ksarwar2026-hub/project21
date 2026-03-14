'use client'
import { StarIcon, PlusIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
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
    if (!user) return toast('Please login to add to cart')
    dispatch(addToCart({ productId: product.id }))
    toast.success('Added to cart')
}

return (

    <Link
        href={`/product/${product.id}`}
        className='group block w-full border border-slate-200/70 rounded-xl p-3 bg-slate-50 transition-all duration-300 hover:border-slate-300 hover:shadow-sm'
    >

        {/* IMAGE */}
        <div className='relative w-full aspect-square bg-[#F8F8F8] rounded-lg overflow-hidden'>

            <Image
                fill
                className='object-cover group-hover:scale-[1.04] transition duration-300'
                src={product.images[0]}
                alt={product.name}
                sizes="(max-width: 640px) 50vw, 25vw"
            />

        </div>

        {/* INFO */}
        <div className='flex justify-between items-end gap-3 pt-2'>

            <div className='flex-1 min-w-0'>

                {/* NAME */}
                <p className={`text-[13px] text-slate-800 font-medium leading-snug overflow-hidden ${truncateName ? 'line-clamp-2' : ''}`}>
                    {product.name}
                </p>

                {/* RATING */}
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

                {/* PRICE */}
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

            {/* ADD TO CART */}
            <button
                onClick={handleAddToCart}
                className='shrink-0 w-6 h-6 bg-slate-900 hover:bg-black text-white rounded-md flex items-center justify-center active:scale-95 transition-all shadow-sm'
            >
                <PlusIcon size={18} />
            </button>

        </div>

    </Link>

)

}

export default ProductCard
