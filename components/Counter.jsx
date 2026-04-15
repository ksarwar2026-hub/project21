'use client'
import { addToCart, removeFromCart } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import { useAnalytics } from "@/lib/posthog/useAnalytics";
import { POSTHOG_EVENTS } from "@/lib/posthog/config";

const Counter = ({ productId }) => {

    const { cartItems } = useSelector(state => state.cart);

    const dispatch = useDispatch();
    const { capture } = useAnalytics();

    const addToCartHandler = () => {
        capture(POSTHOG_EVENTS.CART_QUANTITY_INCREASED, {
            product_id: productId,
            current_quantity: cartItems[productId] || 0,
        })
        dispatch(addToCart({ productId }))
    }

    const removeFromCartHandler = () => {
        capture(POSTHOG_EVENTS.CART_QUANTITY_DECREASED, {
            product_id: productId,
            current_quantity: cartItems[productId] || 0,
        })
        dispatch(removeFromCart({ productId }))
    }

    return (
        <div className="inline-flex items-center gap-1 sm:gap-3 px-3 py-1 rounded border border-slate-200 max-sm:text-sm text-slate-600">
            <button onClick={removeFromCartHandler} className="p-1 select-none">-</button>
            <p className="p-1">{cartItems[productId]}</p>
            <button onClick={addToCartHandler} className="p-1 select-none">+</button>
        </div>
    )
}

export default Counter
