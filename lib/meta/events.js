export const META_EVENTS = {
  PAGE_VIEW: "PageView",
  VIEW_CONTENT: "ViewContent",
  ADD_TO_CART: "AddToCart",
  INITIATE_CHECKOUT: "InitiateCheckout",
  PURCHASE: "Purchase",
};

export const META_DEFAULT_CURRENCY = "INR";

export function isUsableMetaValue(value) {
  const normalized = String(value || "").trim();

  if (!normalized) return false;

  return ![
    "your_pixel_id",
    "your_dataset_id",
    "your_access_token",
    "changeme",
    "change_me",
    "placeholder",
  ].includes(normalized.toLowerCase());
}

export function createMetaEventId(prefix = "evt") {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}.${id}`;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getProductId(product = {}) {
  return String(product.productId || product.id || "").trim();
}

function getProductPrice(product = {}) {
  return toNumber(
    product.effectivePrice !== undefined ? product.effectivePrice : product.price
  );
}

export function buildMetaContent(product = {}, quantity = 1) {
  const id = getProductId(product);
  const content = {
    id,
    quantity: Math.max(1, Math.floor(toNumber(quantity) || 1)),
  };
  const itemPrice = getProductPrice(product);

  if (itemPrice > 0) {
    content.item_price = itemPrice;
  }

  return content;
}

export function buildViewContentData(product = {}) {
  const id = getProductId(product);
  const price = getProductPrice(product);
  const customData = {
    content_ids: id ? [id] : [],
    content_type: "product",
    contents: id ? [buildMetaContent(product, 1)] : [],
    currency: META_DEFAULT_CURRENCY,
  };

  if (product.name) customData.content_name = product.name;
  if (product.category) customData.content_category = product.category;
  if (price > 0) customData.value = price;

  return customData;
}

export function buildAddToCartData(product = {}, quantity = 1) {
  const id = getProductId(product);
  const price = getProductPrice(product);
  const safeQuantity = Math.max(1, Math.floor(toNumber(quantity) || 1));
  const customData = {
    content_ids: id ? [id] : [],
    content_type: "product",
    contents: id ? [buildMetaContent(product, safeQuantity)] : [],
    currency: META_DEFAULT_CURRENCY,
  };

  if (product.name) customData.content_name = product.name;
  if (product.category) customData.content_category = product.category;
  if (price > 0) customData.value = Number((price * safeQuantity).toFixed(2));

  return customData;
}

export function buildCheckoutData({
  items = [],
  value = 0,
  couponCode = "",
} = {}) {
  const contents = items
    .map((item) => buildMetaContent(item, item.quantity))
    .filter((item) => item.id);
  const contentIds = contents.map((item) => item.id);
  const itemCount = contents.reduce((sum, item) => sum + item.quantity, 0);
  const customData = {
    content_ids: contentIds,
    content_type: "product",
    contents,
    currency: META_DEFAULT_CURRENCY,
    num_items: itemCount,
  };
  const total = toNumber(value);

  if (total > 0) customData.value = total;
  if (couponCode) customData.coupon = couponCode;

  return customData;
}

export function buildPurchaseData({
  orderId,
  value = 0,
  items = [],
  couponCode = "",
} = {}) {
  return {
    ...buildCheckoutData({ items, value, couponCode }),
    order_id: orderId,
  };
}

export function buildPurchaseDataFromOrder(order = {}) {
  const items = (order.orderItems || []).map((item) => ({
    id: item.productId,
    productId: item.productId,
    name: item.product?.name || "",
    category: item.product?.category || "",
    price: item.price,
    effectivePrice: item.price,
    quantity: item.quantity,
  }));
  const couponCode =
    order.coupon && typeof order.coupon === "object" ? order.coupon.code || "" : "";

  return buildPurchaseData({
    orderId: order.id,
    value: order.total,
    items,
    couponCode,
  });
}

export function buildPurchaseEventId(orderId, paymentReference = "confirmed") {
  return `purchase.${orderId}.${paymentReference}`;
}
