import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import { captureServerEvents } from "@/lib/posthog/server";
import { POSTHOG_EVENTS } from "@/lib/posthog/config";

export async function POST(request) {
  try {
    const { userId, has } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const { addressId, items, couponCode, paymentMethod } =
      await request.json();

    if (
      !addressId ||
      !paymentMethod ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "missing order details." },
        { status: 401 }
      );
    }

    if (paymentMethod === "STRIPE") {
      return NextResponse.json(
        { error: "Stripe payment is currently disabled" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    let coupon = null;

    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (!coupon) {
        return NextResponse.json(
          { error: "Coupon not found" },
          { status: 400 }
        );
      }
    }

    if (couponCode && coupon.forNewUser) {
      const userorders = await prisma.order.findMany({
        where: { userId },
      });

      if (userorders.length > 0) {
        return NextResponse.json(
          { error: "Coupon valid for new users" },
          { status: 400 }
        );
      }
    }

    const isPlusMember = has({ plan: "plus" });

    if (couponCode && coupon.forMember) {
      if (!isPlusMember) {
        return NextResponse.json(
          { error: "Coupon valid for members only" },
          { status: 400 }
        );
      }
    }

    const ordersByStore = new Map();

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.id },
      });

      if (!product) continue;

      const storeId = product.storeId;

      if (!ordersByStore.has(storeId)) {
        ordersByStore.set(storeId, []);
      }

      ordersByStore.get(storeId).push({
        ...item,
        price: product.price,
        name: product.name,
        category: product.category,
      });
    }

    let orderIds = [];
    let fullAmount = 0;

    const analyticsEvents = [];

    for (const [storeId, sellerItems] of ordersByStore.entries()) {
      let total = sellerItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );

      if (couponCode) {
        total -= (total * coupon.discount) / 100;
      }

      // ✅ Launch phase: Shipping free for everyone (no +5 added)

      total = Math.round(total); // ✅ Decimal nahi chahiye DB mein bhi
      fullAmount += total;

      const order = await prisma.order.create({
        data: {
          userId,
          storeId,
          addressId,
          total,
          paymentMethod,
          isPaid: false,
          isCouponUsed: coupon ? true : false,
          coupon: coupon ? coupon : {},
          orderItems: {
            create: sellerItems.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });

      orderIds.push(order.id);

      analyticsEvents.push({
        distinctId: userId,
        event: paymentMethod === "COD" ? POSTHOG_EVENTS.ORDER_PLACED : "order_pending_payment",
        properties: {
          user_id: user?.id || userId,
          user_name: user?.name || "",
          user_email: user?.email || "",
          order_id: order.id,
          store_id: storeId,
          total,
          payment_method: paymentMethod,
          coupon_code: coupon?.code || "",
          item_count: sellerItems.length,
        },
      });

      if (paymentMethod === "COD") {
        sellerItems.forEach((item) => {
          analyticsEvents.push({
            distinctId: userId,
            event: POSTHOG_EVENTS.PRODUCT_ORDERED,
            properties: {
              user_id: user?.id || userId,
              user_name: user?.name || "",
              user_email: user?.email || "",
              order_id: order.id,
              store_id: storeId,
              payment_method: paymentMethod,
              product_id: item.id,
              product_name: item.name || "",
              category: item.category || "",
              price: item.price,
              quantity: item.quantity,
            },
          });
        });
      }
    }

    // COD ke liye cart clear karo
    if (paymentMethod === "COD") {
      await prisma.user.update({
        where: { id: userId },
        data: { cart: {} },
      });
    }

    await captureServerEvents(analyticsEvents);

    return NextResponse.json({
      orderIds,
      totalAmount: fullAmount,
      message: "Orders Placed Successfully",
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: "not authorized" },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        userId,
        OR: [
          { paymentMethod: PaymentMethod.COD },
          {
            AND: [
              { paymentMethod: PaymentMethod.RAZORPAY },
              { isPaid: true },
            ],
          },
        ],
      },
      include: {
        orderItems: { include: { product: true } },
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
