import prisma from "@/lib/prisma";
import { applyEffectiveCampaignPrice, campaignProductIncludeFor } from "@/lib/campaigns";

function toPaise(value) {
  return Math.round((Number(value) || 0) * 100);
}

function toRupees(paise) {
  return Number((paise / 100).toFixed(2));
}

function normalizeCartItems(cartItems) {
  if (Array.isArray(cartItems)) {
    return cartItems
      .map((item) => ({
        productId: String(item.productId || item.id || "").trim(),
        quantity: Math.max(0, Math.floor(Number(item.quantity) || 0)),
      }))
      .filter((item) => item.productId && item.quantity > 0);
  }

  if (cartItems && typeof cartItems === "object") {
    return Object.entries(cartItems)
      .map(([productId, quantity]) => ({
        productId,
        quantity: Math.max(0, Math.floor(Number(quantity) || 0)),
      }))
      .filter((item) => item.productId && item.quantity > 0);
  }

  return [];
}

async function validateCoupon({ couponCode, subtotalPaise, userId, isPlusMember }) {
  if (!couponCode) {
    return {
      appliedCoupon: null,
      couponDiscountPaise: 0,
    };
  }

  const code = String(couponCode || "").trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({
    where: {
      code,
    },
  });

  if (!coupon || coupon.expiresAt <= new Date()) {
    const error = new Error("Coupon not found or expired");
    error.status = 400;
    throw error;
  }

  if (coupon.forNewUser) {
    if (!userId) {
      const error = new Error("Please login to use this coupon");
      error.status = 401;
      throw error;
    }

    const userOrderCount = await prisma.order.count({
      where: {
        userId,
      },
    });

    if (userOrderCount > 0) {
      const error = new Error("Coupon valid for new users");
      error.status = 400;
      throw error;
    }
  }

  if (coupon.forMember && !isPlusMember) {
    const error = new Error("Coupon valid for members only");
    error.status = 400;
    throw error;
  }

  const minimumPurchasePaise = toPaise(coupon.minimumPurchase);

  if (subtotalPaise < minimumPurchasePaise) {
    const error = new Error(
      `Coupon requires a minimum purchase of Rs. ${toRupees(minimumPurchasePaise).toLocaleString("en-IN")}`
    );
    error.status = 400;
    throw error;
  }

  let couponDiscountPaise = 0;

  if (coupon.discountType === "FIXED") {
    couponDiscountPaise = Math.min(subtotalPaise, toPaise(coupon.discount));
  } else {
    couponDiscountPaise = Math.round((subtotalPaise * Number(coupon.discount)) / 100);
  }

  if (coupon.maximumDiscount !== null && coupon.maximumDiscount !== undefined) {
    couponDiscountPaise = Math.min(couponDiscountPaise, toPaise(coupon.maximumDiscount));
  }

  return {
    appliedCoupon: {
      code: coupon.code,
      description: coupon.description,
      discount: coupon.discount,
      discountType: coupon.discountType,
      minimumPurchase: coupon.minimumPurchase,
      maximumDiscount: coupon.maximumDiscount,
      forNewUser: coupon.forNewUser,
      forMember: coupon.forMember,
      expiresAt: coupon.expiresAt,
    },
    couponDiscountPaise,
  };
}

export async function calculateCartTotals({
  cartItems,
  couponCode,
  userId,
  isPlusMember = false,
  requireAvailable = false,
} = {}) {
  const entries = normalizeCartItems(cartItems);
  const now = new Date();

  if (!entries.length) {
    return {
      items: [],
      subtotal: 0,
      couponDiscount: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      totalPaise: 0,
      appliedCoupon: null,
      unavailableItems: [],
      missingItems: [],
    };
  }

  const productIds = entries.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
      store: {
        is: {
          isActive: true,
        },
      },
    },
    include: {
      store: true,
      campaignProducts: campaignProductIncludeFor(now),
    },
  });

  const productsById = new Map(products.map((product) => [product.id, product]));
  const missingItems = entries.filter((item) => !productsById.has(item.productId));
  const unavailableItems = [];
  const calculatedItems = [];
  let subtotalPaise = 0;

  for (const entry of entries) {
    const product = productsById.get(entry.productId);

    if (!product) continue;

    if (!product.inStock) {
      unavailableItems.push({
        productId: product.id,
        name: product.name,
      });
    }

    const pricedProduct = applyEffectiveCampaignPrice(product, now);
    const basePricePaise = toPaise(product.price);
    const effectivePricePaise = toPaise(pricedProduct.effectivePrice);
    const lineTotalPaise = effectivePricePaise * entry.quantity;
    subtotalPaise += lineTotalPaise;

    calculatedItems.push({
      id: product.id,
      productId: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      images: product.images,
      inStock: product.inStock,
      storeId: product.storeId,
      store: product.store,
      mrp: product.mrp,
      price: toRupees(basePricePaise),
      effectivePrice: toRupees(effectivePricePaise),
      quantity: entry.quantity,
      lineTotal: toRupees(lineTotalPaise),
      activeCampaign: pricedProduct.activeCampaign,
    });
  }

  if (requireAvailable && (missingItems.length > 0 || unavailableItems.length > 0)) {
    const names = unavailableItems.map((item) => item.name).join(", ");
    const error = new Error(
      names ? `${names} is currently unavailable` : "Some cart products are no longer available"
    );
    error.status = 400;
    throw error;
  }

  const { appliedCoupon, couponDiscountPaise } = await validateCoupon({
    couponCode,
    subtotalPaise,
    userId,
    isPlusMember,
  });

  const shippingPaise = 0;
  const taxPaise = 0;
  const totalPaise = Math.max(0, subtotalPaise - couponDiscountPaise + shippingPaise + taxPaise);

  return {
    items: calculatedItems,
    subtotal: toRupees(subtotalPaise),
    couponDiscount: toRupees(couponDiscountPaise),
    shipping: toRupees(shippingPaise),
    tax: toRupees(taxPaise),
    total: toRupees(totalPaise),
    totalPaise,
    appliedCoupon,
    unavailableItems,
    missingItems,
  };
}

export function getExpectedTotalMismatch(expectedTotal, calculatedTotalPaise) {
  if (expectedTotal === undefined || expectedTotal === null || expectedTotal === "") {
    return false;
  }

  return toPaise(expectedTotal) !== calculatedTotalPaise;
}
