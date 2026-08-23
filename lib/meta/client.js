'use client'

import {
  META_EVENTS,
  buildAddToCartData,
  buildCheckoutData,
  buildViewContentData,
  createMetaEventId,
  isUsableMetaValue,
} from "@/lib/meta/events";

let initialized = false;
let scriptLoading = false;
let lastPageView = { url: "", timestamp: 0 };

function getMetaPixelId() {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
}

export function isMetaPixelConfigured() {
  return isUsableMetaValue(getMetaPixelId());
}

function logMetaDebug(message, details = {}) {
  if (process.env.NODE_ENV === "production") return;
  console.info(`[Meta Pixel] ${message}`, details);
}

export function initMetaPixel() {
  if (typeof window === "undefined" || initialized || !isMetaPixelConfigured()) {
    return false;
  }

  const pixelId = getMetaPixelId();

  if (!window.fbq) {
    const fbq = function fbq() {
      fbq.callMethod
        ? fbq.callMethod.apply(fbq, arguments)
        : fbq.queue.push(arguments);
    };

    window.fbq = fbq;
    window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
  }

  if (!scriptLoading && !document.querySelector('script[src*="connect.facebook.net/en_US/fbevents.js"]')) {
    scriptLoading = true;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.onload = () => {
      scriptLoading = false;
    };
    script.onerror = () => {
      scriptLoading = false;
      if (process.env.NODE_ENV !== "production") {
        console.warn("[Meta Pixel] Failed to load fbevents.js");
      }
    };
    document.head.appendChild(script);
  }

  window.fbq("init", pixelId);
  initialized = true;
  logMetaDebug("initialized", { pixelId });
  return true;
}

async function sendMetaBrowserEventToServer({
  eventName,
  eventId,
  customData,
  eventSourceUrl,
}) {
  try {
    await fetch("/api/meta/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventName,
        eventId,
        customData,
        eventSourceUrl,
      }),
      keepalive: true,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Meta Pixel] CAPI mirror failed", {
        eventName,
        eventId,
        error: error?.message || error,
      });
    }
  }
}

export function trackMetaBrowserEvent(
  eventName,
  customData = {},
  { eventId = createMetaEventId(eventName), sendToServer = true } = {}
) {
  if (typeof window === "undefined" || !isMetaPixelConfigured()) {
    return null;
  }

  initMetaPixel();

  const eventSourceUrl = window.location.href;
  window.fbq("track", eventName, customData, { eventID: eventId });
  logMetaDebug("event", { eventName, eventId, customData });

  if (sendToServer) {
    sendMetaBrowserEventToServer({
      eventName,
      eventId,
      customData,
      eventSourceUrl,
    });
  }

  return eventId;
}

export function trackMetaPageView() {
  if (typeof window === "undefined") {
    return null;
  }

  const now = Date.now();
  const currentUrl = window.location.href;

  if (lastPageView.url === currentUrl && now - lastPageView.timestamp < 1500) {
    return null;
  }

  lastPageView = { url: currentUrl, timestamp: now };

  return trackMetaBrowserEvent(META_EVENTS.PAGE_VIEW, {}, {
    eventId: createMetaEventId("pageview"),
  });
}

export function trackMetaViewContent(product) {
  return trackMetaBrowserEvent(
    META_EVENTS.VIEW_CONTENT,
    buildViewContentData(product),
    { eventId: createMetaEventId(`viewcontent.${product?.id || "product"}`) }
  );
}

export function trackMetaAddToCart(product, { quantity = 1 } = {}) {
  return trackMetaBrowserEvent(
    META_EVENTS.ADD_TO_CART,
    buildAddToCartData(product, quantity),
    { eventId: createMetaEventId(`addtocart.${product?.id || product?.productId || "product"}`) }
  );
}

export function trackMetaInitiateCheckout({
  items = [],
  value = 0,
  couponCode = "",
} = {}) {
  return trackMetaBrowserEvent(
    META_EVENTS.INITIATE_CHECKOUT,
    buildCheckoutData({ items, value, couponCode }),
    { eventId: createMetaEventId("checkout") }
  );
}

export function trackMetaPurchaseEvents(events = []) {
  events.forEach((event) => {
    if (!event?.eventId || !event?.customData) return;

    trackMetaBrowserEvent(META_EVENTS.PURCHASE, event.customData, {
      eventId: event.eventId,
      sendToServer: false,
    });
  });
}
