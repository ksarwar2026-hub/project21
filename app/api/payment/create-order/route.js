import Razorpay from "razorpay";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const { orderIds } = await req.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "Invalid orderIds" }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: {
        id: {
          in: orderIds,
        },
        userId,
        isPaid: false,
        paymentMethod: PaymentMethod.RAZORPAY,
      },
      select: {
        id: true,
        total: true,
      },
    });

    if (orders.length !== orderIds.length) {
      return NextResponse.json({ error: "Unable to find pending Razorpay orders" }, { status: 400 });
    }

    const amount = orders.reduce((sum, order) => sum + Number(order.total), 0);

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    await prisma.order.updateMany({
      where: {
        id: {
          in: orderIds,
        },
        userId,
        isPaid: false,
        paymentMethod: PaymentMethod.RAZORPAY,
      },
      data: {
        razorpayOrderId: order.id,
      },
    });

    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
