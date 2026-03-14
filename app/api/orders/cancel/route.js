import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";

// ✅ Razorpay cancelled/failed orders cleanup
export async function POST(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 });
        }

        const { orderIds } = await request.json();

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({ error: "Invalid orderIds" }, { status: 400 });
        }

        await prisma.order.deleteMany({
            where: {
                id: { in: orderIds },
                userId,                          // sirf apne orders
                isPaid: false,                   // paid orders kabhi delete na ho
                paymentMethod: PaymentMethod.RAZORPAY  // sirf Razorpay wale
            }
        });

        return NextResponse.json({ message: "Orders cancelled" });

    } catch (error) {
        console.error("CANCEL ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}