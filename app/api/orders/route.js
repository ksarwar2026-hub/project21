import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import { captureServerEvents } from "@/lib/posthog/server";
import { POSTHOG_EVENTS } from "@/lib/posthog/config";
import { calculateCartTotals, getExpectedTotalMismatch } from "@/lib/pricing/cart";
import {
  META_EVENTS,
  buildPurchaseData,
  buildPurchaseEventId,
} from "@/lib/meta/events";
import {
  buildMetaUserData,
  sendMetaCapiEvents,
  toBrowserMetaEvents,
} from "@/lib/meta/server";

function toPaise(value) {
  return Math.round((Number(value) || 0) * 100);
}

function toRupees(paise) {
  return Number((paise / 100).toFixed(2));
}

function isValidIdempotencyKey(value) {
  return (
    typeof value === "string" &&
    value.length >= 16 &&
    value.length <= 120 &&
    /^[A-Za-z0-9._:-]+$/.test(value)
  );
}

function toJsonValue(value) {
  return JSON.parse(JSON.stringify(value));
}

async function reserveCodCheckout({ idempotencyKey, userId }) {
  try {
    await prisma.checkoutIdempotency.create({
      data: {
        key: idempotencyKey,
        userId,
        paymentMethod: PaymentMethod.COD,
      },
    });

    return { reserved: true };
  } catch (error) {
    if (error?.code !== "P2002") {
      throw error;
    }

    const existing = await prisma.checkoutIdempotency.findUnique({
      where: { key: idempotencyKey },
    });

    if (!existing || existing.userId !== userId || existing.paymentMethod !== PaymentMethod.COD) {
      const conflict = new Error("Checkout is already being processed");
      conflict.status = 409;
      throw conflict;
    }

    if (existing.response) {
      return {
        reserved: false,
        response: {
          ...existing.response,
          idempotentReplay: true,
          metaPurchaseEvents: [],
        },
      };
    }

    const processing = new Error("Checkout is already being processed");
    processing.status = 409;
    throw processing;
  }
}

export async function POST(request) {
  try {
    const { userId, has } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const { addressId, items, couponCode, paymentMethod, expectedTotal, idempotencyKey } =
      await request.json();

    if (
      !addressId ||
      !paymentMethod ||
      !items ||
      (Array.isArray(items) && items.length === 0) ||
      (!Array.isArray(items) && Object.keys(items).length === 0)
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

    if (paymentMethod === "COD" && !isValidIdempotencyKey(idempotencyKey)) {
      return NextResponse.json(
        { error: "Invalid checkout attempt. Please refresh and try again." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    const isPlusMember = has({ plan: "plus" });
    const totals = await calculateCartTotals({
      cartItems: items,
      couponCode,
      userId,
      isPlusMember,
      requireAvailable: true,
    });

    if (getExpectedTotalMismatch(expectedTotal, totals.totalPaise)) {
      return NextResponse.json(
        {
          error: "Some prices in your cart have changed. Please review your updated total.",
          totals,
        },
        { status: 409 }
      );
    }

    const ordersByStore = new Map();

    for (const item of totals.items) {
      const storeId = item.storeId;

      if (!ordersByStore.has(storeId)) {
        ordersByStore.set(storeId, []);
      }

      ordersByStore.get(storeId).push(item);
    }

    let orderIds = [];
    let fullAmount = 0;

    const analyticsEvents = [];
    const metaPurchaseEvents = [];
    let idempotencyReservation = null;

    if (paymentMethod === "COD") {
      idempotencyReservation = await reserveCodCheckout({ idempotencyKey, userId });

      if (!idempotencyReservation.reserved) {
        return NextResponse.json(idempotencyReservation.response);
      }
    }

    const storeEntries = Array.from(ordersByStore.entries());
    const couponDiscountPaise = toPaise(totals.couponDiscount);
    const subtotalPaise = toPaise(totals.subtotal);
    let allocatedCouponDiscountPaise = 0;

    for (const [index, [storeId, sellerItems]] of storeEntries.entries()) {
      const storeSubtotalPaise = sellerItems.reduce(
        (acc, item) => acc + toPaise(item.effectivePrice) * item.quantity,
        0
      );
      const storeCouponDiscountPaise =
        index === storeEntries.length - 1
          ? couponDiscountPaise - allocatedCouponDiscountPaise
          : Math.round((couponDiscountPaise * storeSubtotalPaise) / Math.max(subtotalPaise, 1));
      allocatedCouponDiscountPaise += storeCouponDiscountPaise;

      const total = toRupees(Math.max(0, storeSubtotalPaise - storeCouponDiscountPaise));
      fullAmount += total;

      const order = await prisma.order.create({
        data: {
          userId,
          storeId,
          addressId,
          total,
          paymentMethod,
          isPaid: false,
          isCouponUsed: totals.appliedCoupon ? true : false,
          coupon: totals.appliedCoupon || {},
          orderItems: {
            create: sellerItems.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.effectivePrice,
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
          coupon_code: totals.appliedCoupon?.code || "",
          item_count: sellerItems.length,
        },
      });

      if (paymentMethod === "COD") {
        metaPurchaseEvents.push({
          eventName: META_EVENTS.PURCHASE,
          eventId: buildPurchaseEventId(order.id, "cod"),
          customData: buildPurchaseData({
            orderId: order.id,
            value: total,
            items: sellerItems,
            couponCode: totals.appliedCoupon?.code || "",
          }),
          userData: buildMetaUserData({ user, address, request }),
        });

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
              price: item.effectivePrice,
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

    const responsePayload = {
      orderIds,
      totalAmount: toRupees(toPaise(fullAmount)),
      totals,
      metaPurchaseEvents: toBrowserMetaEvents(metaPurchaseEvents),
      message: "Orders Placed Successfully",
    };

    if (paymentMethod === "COD") {
      await prisma.checkoutIdempotency.update({
        where: { key: idempotencyKey },
        data: {
          response: {
            ...toJsonValue(responsePayload),
            metaPurchaseEvents: [],
          },
        },
      });
    }

    await captureServerEvents(analyticsEvents);
    await sendMetaCapiEvents(metaPurchaseEvents, { request });

    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: error.status || 400 }
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
