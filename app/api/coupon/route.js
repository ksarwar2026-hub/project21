import prisma from "@/lib/prisma";
import { calculateCartTotals } from "@/lib/pricing/cart";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


// Verify coupon
export async function POST(request){
    try {
        const {userId, has} = getAuth(request)
        const { code, cartItems } = await request.json()

        if (!code?.trim()) {
            return NextResponse.json({ error: "Coupon code is required" }, { status: 400 })
        }

        if (cartItems) {
            const totals = await calculateCartTotals({
                cartItems,
                couponCode: code,
                userId,
                isPlusMember: Boolean(has?.({plan: 'plus'})),
            })

            return NextResponse.json({ coupon: totals.appliedCoupon, totals })
        }

        const coupon = await prisma.coupon.findUnique({
            where: {code: code.toUpperCase()}
        })

        if (!coupon || coupon.expiresAt <= new Date()){
            return NextResponse.json({ error: "Coupon not found or expired" }, { status: 404 })
        }

        if(coupon.forNewUser){
            const userorders = await prisma.order.findMany({where: {userId}})
            if(userorders.length > 0){
                return NextResponse.json({ error: "Coupon valid for new users" }, { status: 400 })
            }
        }

        if (coupon.forMember){
            const hasPlusPlan = has({plan: 'plus'})
            if(!hasPlusPlan){
                return NextResponse.json({ error: "Coupon valid for members only" }, { status: 400 })
            }
        }

        return NextResponse.json({coupon})
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: error.status || 400 })
    }
}
