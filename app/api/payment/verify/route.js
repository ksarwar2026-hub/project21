import crypto from "crypto";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { captureServerEvents } from "@/lib/posthog/server";
import { POSTHOG_EVENTS } from "@/lib/posthog/config";
import {
  META_EVENTS,
  buildPurchaseDataFromOrder,
  buildPurchaseEventId,
} from "@/lib/meta/events";
import {
  buildMetaUserData,
  sendMetaCapiEvents,
  toBrowserMetaEvents,
} from "@/lib/meta/server";

export async function POST(request) {
  try {
    // 🔐 Get logged-in user
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderIds,
    } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid orderIds" },
        { status: 400 }
      );
    }

    // 🔒 Verify Razorpay signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const updatedOrders = await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
        userId: userId, // extra security
        paymentMethod: "RAZORPAY",
        razorpayOrderId: razorpay_order_id,
        isPaid: false,
      },
      data: {
        isPaid: true,
        razorpayPaymentId: razorpay_payment_id,
      },
    });

    if (updatedOrders.count !== orderIds.length) {
      return NextResponse.json(
        { error: "Payment does not match pending orders" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    const paidOrders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        userId,
      },
      include: {
        address: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    // 🛒 Clear cart AFTER successful payment
    await prisma.user.update({
      where: { id: userId },
      data: { cart: {} },
    });

    await captureServerEvents([
      ...paidOrders.map((order) => ({
        distinctId: userId,
        event: POSTHOG_EVENTS.ORDER_PLACED,
        properties: {
          user_id: user?.id || userId,
          user_name: user?.name || "",
          user_email: user?.email || "",
          order_id: order.id,
          store_id: order.storeId,
          total: order.total,
          payment_method: order.paymentMethod,
          item_count: order.orderItems.length,
        },
      })),
      ...paidOrders.flatMap((order) =>
        order.orderItems.map((item) => ({
          distinctId: userId,
          event: POSTHOG_EVENTS.PRODUCT_ORDERED,
          properties: {
            user_id: user?.id || userId,
            user_name: user?.name || "",
            user_email: user?.email || "",
            order_id: order.id,
            store_id: order.storeId,
            payment_method: order.paymentMethod,
            product_id: item.productId,
            product_name: item.product?.name || "",
            category: item.product?.category || "",
            price: item.price,
            quantity: item.quantity,
          },
        }))
      ),
    ]);

    const metaPurchaseEvents = paidOrders.map((order) => ({
      eventName: META_EVENTS.PURCHASE,
      eventId: buildPurchaseEventId(order.id, razorpay_payment_id),
      customData: buildPurchaseDataFromOrder(order),
      userData: buildMetaUserData({
        user,
        address: order.address,
        request,
      }),
    }));

    await sendMetaCapiEvents(metaPurchaseEvents, { request });

    return NextResponse.json({
      success: true,
      metaPurchaseEvents: toBrowserMetaEvents(metaPurchaseEvents),
    });

  } catch (error) {
    console.error("VERIFY ERROR:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
