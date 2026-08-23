import { calculateCartTotals } from "@/lib/pricing/cart";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId, has } = getAuth(request);
    const { cartItems, couponCode } = await request.json();
    const totals = await calculateCartTotals({
      cartItems,
      couponCode,
      userId,
      isPlusMember: Boolean(has?.({ plan: "plus" })),
    });

    return NextResponse.json({ totals });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Unable to calculate cart totals" },
      { status: error.status || 400 }
    );
  }
}
