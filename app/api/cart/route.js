import prisma from "@/lib/prisma";
import { currentUser, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

async function ensureUser(userId) {
    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress || ""
    const name = clerkUser?.fullName || clerkUser?.username || email || "Customer"
    const image = clerkUser?.imageUrl || ""

    return prisma.user.upsert({
        where: { id: userId },
        update: {
            email,
            name,
            image,
        },
        create: {
            id: userId,
            email,
            name,
            image,
            cart: {},
        },
    })
}

// Update user cart 
export async function POST(request){
    try {
        const { userId } = getAuth(request)

        if (!userId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 })
        }

        const { cart } = await request.json()
        const normalizedCart = normalizeCart(cart)

        await ensureUser(userId)

        // Save the cart to the user object
        await prisma.user.update({
            where: {id: userId},
            data: {cart: normalizedCart}
        })

        return NextResponse.json({ message: 'Cart updated' })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}

// Get user cart 
export async function GET(request){
    try {
        const { userId } = getAuth(request)

        if (!userId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 })
        }
        
        const user = await ensureUser(userId)

        return NextResponse.json({ cart: normalizeCart(user.cart) })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
