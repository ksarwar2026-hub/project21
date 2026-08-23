import { inngest } from "@/inngest/client";
import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


// Add new coupon
export async function POST(request){
    try {
        const { userId } = getAuth(request)
        const isAdmin = await authAdmin(userId)

        if (!isAdmin) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 })
        }

        const { coupon } = await request.json()
        coupon.code = String(coupon.code || "").trim().toUpperCase()
        coupon.description = String(coupon.description || "").trim()
        coupon.discount = Number(coupon.discount)
        coupon.discountType = coupon.discountType === "FIXED" ? "FIXED" : "PERCENTAGE"
        coupon.minimumPurchase = Math.max(0, Number(coupon.minimumPurchase) || 0)
        coupon.maximumDiscount =
            coupon.maximumDiscount === "" || coupon.maximumDiscount === null || coupon.maximumDiscount === undefined
                ? null
                : Math.max(0, Number(coupon.maximumDiscount) || 0)

        if (!coupon.code || !coupon.description) {
            return NextResponse.json({ error: "missing coupon details" }, { status: 400 })
        }

        if (!Number.isFinite(coupon.discount) || coupon.discount <= 0) {
            return NextResponse.json({ error: "coupon discount is invalid" }, { status: 400 })
        }

        if (coupon.discountType === "PERCENTAGE" && coupon.discount > 100) {
            return NextResponse.json({ error: "percentage discount cannot exceed 100" }, { status: 400 })
        }

        if (Number.isNaN(new Date(coupon.expiresAt).getTime())) {
            return NextResponse.json({ error: "coupon expiry date is invalid" }, { status: 400 })
        }

        await prisma.coupon.create({data: coupon}).then(async (coupon) => {
            // Run Inngest Sheduler Function to delete coupon on expire
            await inngest.send({
                name: "app/coupon.expired",
                data: {
                    code: coupon.code,
                    expires_at: coupon.expiresAt,
                }
            })
        })

        return NextResponse.json({message: "Coupon added successfully"})

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// Delete coupon  /api/coupon?id=couponId
export async function DELETE(request){
    try {
        const { userId } = getAuth(request)
        const isAdmin = await authAdmin(userId)

        if (!isAdmin) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 })
        }

        const { searchParams } = request.nextUrl;
        const code = searchParams.get('code')

        await prisma.coupon.delete({where: { code }})
        return NextResponse.json({ message: 'Coupon deleted successfully' })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// Get all coupons
export async function GET(request){
    try {
        const { userId } = getAuth(request)
        const isAdmin = await authAdmin(userId)

        if (!isAdmin) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 })
        }
        const coupons = await prisma.coupon.findMany({})
        return NextResponse.json({ coupons })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}
