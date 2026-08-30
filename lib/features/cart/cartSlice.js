import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

let debounceTimer = null

function normalizeCart(cart) {
    if (!cart || typeof cart !== "object" || Array.isArray(cart)) {
        return {}
    }

    return Object.entries(cart).reduce((acc, [productId, quantity]) => {
        const id = String(productId || "").trim()
        const count = Math.max(0, Math.floor(Number(quantity) || 0))

        if (id && count > 0) {
            acc[id] = count
        }

        return acc
    }, {})
}

function mergeCarts(accountCart, guestCart) {
    const merged = { ...normalizeCart(accountCart) }

    Object.entries(normalizeCart(guestCart)).forEach(([productId, quantity]) => {
        merged[productId] = (merged[productId] || 0) + quantity
    })

    return merged
}

export const uploadCart = createAsyncThunk('cart/uploadCart', 
    async ({ getToken }, thunkAPI) => {
        clearTimeout(debounceTimer)

        return await new Promise((resolve) => {
            debounceTimer = setTimeout(async () => {
                try {
                    const { cartItems } = thunkAPI.getState().cart
                    const token = await getToken()
                    if (!token) {
                        resolve()
                        return
                    }
                    await axios.post('/api/cart', {cart: cartItems}, { headers: { Authorization: `Bearer ${token}` } })
                    resolve()
                } catch (error) {
                    resolve(thunkAPI.rejectWithValue(error.response?.data || { error: error.message }))
                }
            }, 1000)
        })
    }
)

export const syncCartAfterLogin = createAsyncThunk(
    'cart/syncCartAfterLogin',
    async ({ getToken }, thunkAPI) => {
        try {
            const token = await getToken()
            if (!token) {
                return { cart: thunkAPI.getState().cart.cartItems || {} }
            }

            const localCart = thunkAPI.getState().cart.cartItems || {}
            const { data } = await axios.get('/api/cart', {headers: { Authorization: `Bearer ${token}` }})
            const mergedCart = mergeCarts(data?.cart || {}, localCart)

            await axios.post('/api/cart', {cart: mergedCart}, { headers: { Authorization: `Bearer ${token}` } })

            return { cart: mergedCart }
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || { error: error.message })
        }
    }
)

export const fetchCart = createAsyncThunk('cart/fetchCart', 
    async ({ getToken }, thunkAPI) => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/cart', {headers: { Authorization: `Bearer ${token}` }})
            return data
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || { error: error.message })
        }
    }
)

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        total: 0,
        cartItems: {},
        fetchStatus: 'idle',
        fetchError: null,
    },
    reducers: {
        addToCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                state.cartItems[productId]++
            } else {
                state.cartItems[productId] = 1
            }
            state.total += 1
        },
        removeFromCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                state.cartItems[productId]--
                state.total--
                if (state.cartItems[productId] === 0) {
                    delete state.cartItems[productId]
                }
            }
        },
        deleteItemFromCart: (state, action) => {
            const { productId } = action.payload
            state.total -= state.cartItems[productId] ? state.cartItems[productId] : 0
            delete state.cartItems[productId]
        },
        clearCart: (state) => {
            state.cartItems = {}
            state.total = 0
        },
    },
    extraReducers: (builder)=>{
        builder
            .addCase(fetchCart.pending, (state) => {
                state.fetchStatus = 'loading'
                state.fetchError = null
            })
            .addCase(fetchCart.fulfilled, (state, action)=>{
                const cartData = normalizeCart(action.payload?.cart || {})
                state.cartItems = cartData
                state.total = Object.values(state.cartItems).reduce((acc, item)=>acc + item, 0)
                state.fetchStatus = 'succeeded'
                state.fetchError = null
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.fetchStatus = 'failed'
                state.fetchError = action.payload?.error || action.error?.message || 'Unable to load cart'
            })
            .addCase(syncCartAfterLogin.pending, (state) => {
                state.fetchStatus = 'loading'
                state.fetchError = null
            })
            .addCase(syncCartAfterLogin.fulfilled, (state, action)=>{
                const cartData = normalizeCart(action.payload?.cart || {})
                state.cartItems = cartData
                state.total = Object.values(state.cartItems).reduce((acc, item)=>acc + item, 0)
                state.fetchStatus = 'succeeded'
                state.fetchError = null
            })
            .addCase(syncCartAfterLogin.rejected, (state, action) => {
                state.fetchStatus = 'failed'
                state.fetchError = action.payload?.error || action.error?.message || 'Unable to sync cart'
            })
    }
})

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart } = cartSlice.actions

export default cartSlice.reducer
