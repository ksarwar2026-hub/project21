import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendOrderDeliveredWhatsApp } from "@/lib/whatsapp/orderDelivered";
import { sendOrderOutForDeliveryWhatsApp } from "@/lib/whatsapp/orderOutForDelivery";
import { sendOrderShippedWhatsApp } from "@/lib/whatsapp/orderShipped";


// Update seller order status
export async function POST(request){
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        }

        const {orderId, status } = await request.json()

        const currentOrder = await prisma.order.findFirst({
            where: { id: orderId, storeId },
            select: {
                id: true,
                status: true,
                userId: true,
                user: { select: { phone: true } },
                address: { select: { phone: true } },
            },
        })

        const shouldNotifyShipped =
            currentOrder?.status !== "SHIPPED" && status === "SHIPPED"
        const shouldNotifyOutForDelivery =
            currentOrder?.status === "SHIPPED" && status === "OUT_FOR_DELIVERY"
        const shouldNotifyDelivered =
            currentOrder?.status === "OUT_FOR_DELIVERY" && status === "DELIVERED"

        await prisma.order.update({
            where: { id: orderId, storeId },
            data: {status}
        })

        if (shouldNotifyShipped && currentOrder) {
            try {
                await sendOrderShippedWhatsApp({
                    orderId: currentOrder.id,
                    userId: currentOrder.userId,
                    user: currentOrder.user,
                    address: currentOrder.address,
                })
            } catch {
                // WhatsApp failures must not fail the order status update.
            }
        }

        if (shouldNotifyOutForDelivery && currentOrder) {
            try {
                await sendOrderOutForDeliveryWhatsApp({
                    orderId: currentOrder.id,
                    userId: currentOrder.userId,
                    user: currentOrder.user,
                    address: currentOrder.address,
                })
            } catch {
                // WhatsApp failures must not fail the order status update.
            }
        }

        if (shouldNotifyDelivered && currentOrder) {
            try {
                await sendOrderDeliveredWhatsApp({
                    orderId: currentOrder.id,
                    userId: currentOrder.userId,
                    user: currentOrder.user,
                    address: currentOrder.address,
                })
            } catch {
                // WhatsApp failures must not fail the order status update.
            }
        }

        return NextResponse.json({message: "Order Status updated"})
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// Get all orders for a seller
export async function GET(request){
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        }

        const orders = await prisma.order.findMany({
            where: {storeId},
            include: {user: true, address: true, orderItems: {include: {product: true}}},
            orderBy: {createdAt: 'desc' }
        })

        return NextResponse.json({orders})
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}
