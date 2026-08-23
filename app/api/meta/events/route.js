import { NextResponse } from "next/server";
import { META_EVENTS } from "@/lib/meta/events";
import { sendMetaCapiEvents } from "@/lib/meta/server";
import { getBaseUrl } from "@/lib/site";

const ALLOWED_CLIENT_META_EVENTS = new Set([
  META_EVENTS.PAGE_VIEW,
  META_EVENTS.VIEW_CONTENT,
  META_EVENTS.ADD_TO_CART,
  META_EVENTS.INITIATE_CHECKOUT,
]);

const MAX_BODY_BYTES = 12 * 1024;
const MAX_CONTENTS = 50;
const MAX_EVENT_ID_LENGTH = 120;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 90;
const rateLimitStore = new Map();

function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getAllowedOrigins(request) {
  const origins = new Set([new URL(getBaseUrl()).origin]);

  if (process.env.NODE_ENV !== "production") {
    origins.add(new URL(request.url).origin);
  }

  return origins;
}

function getHeaderOrigin(value) {
  if (!value) return "";

  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function validateRequestOrigin(request) {
  const allowedOrigins = getAllowedOrigins(request);
  const origin = getHeaderOrigin(request.headers.get("origin"));
  const refererOrigin = getHeaderOrigin(request.headers.get("referer"));
  const requestOrigin = origin || refererOrigin;

  return Boolean(requestOrigin && allowedOrigins.has(requestOrigin));
}

function validateEventSourceUrl(request, value) {
  if (!value || typeof value !== "string" || value.length > 2048) {
    return "";
  }

  try {
    const eventUrl = new URL(value);
    return getAllowedOrigins(request).has(eventUrl.origin) ? eventUrl.toString() : "";
  } catch {
    return "";
  }
}

function getRateLimitKey(request) {
  return (
    String(request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(request) {
  const now = Date.now();
  const key = getRateLimitKey(request);
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  rateLimitStore.set(key, current);

  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

function cleanString(value, maxLength = 300) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function cleanNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function cleanStringArray(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => cleanString(item, 120))
    .filter(Boolean)
    .slice(0, MAX_CONTENTS);
}

function cleanContents(value) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, MAX_CONTENTS)
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;

      const id = cleanString(item.id, 120);
      if (!id) return null;

      const content = {
        id,
        quantity: Math.max(1, Math.floor(cleanNumber(item.quantity) || 1)),
      };
      const itemPrice = cleanNumber(item.item_price);

      if (itemPrice !== undefined) {
        content.item_price = itemPrice;
      }

      return content;
    })
    .filter(Boolean);
}

function sanitizeCustomData(eventName, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return eventName === META_EVENTS.PAGE_VIEW ? {} : null;
  }

  if (eventName === META_EVENTS.PAGE_VIEW) {
    return {};
  }

  const contentIds = cleanStringArray(value.content_ids);
  const contents = cleanContents(value.contents);
  const sanitized = {
    content_ids: contentIds,
    content_type: value.content_type === "product" ? "product" : undefined,
    contents,
    currency: value.currency === "INR" ? "INR" : undefined,
    value: cleanNumber(value.value),
    content_name: cleanString(value.content_name),
    content_category: cleanString(value.content_category),
    num_items: cleanNumber(value.num_items),
    coupon: cleanString(value.coupon, 80),
  };

  const cleaned = Object.entries(sanitized).reduce((acc, [key, item]) => {
    if (
      item !== undefined &&
      item !== null &&
      item !== "" &&
      (!Array.isArray(item) || item.length > 0)
    ) {
      acc[key] = item;
    }
    return acc;
  }, {});

  return cleaned.content_ids?.length || cleaned.contents?.length ? cleaned : null;
}

function validateEventId(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_EVENT_ID_LENGTH &&
    /^[A-Za-z0-9._:-]+$/.test(value)
  );
}

export async function POST(request) {
  try {
    if (!validateRequestOrigin(request)) {
      return jsonError("Invalid request origin", 403);
    }

    if (isRateLimited(request)) {
      return jsonError("Too many Meta event requests", 429);
    }

    const rawBody = await request.text();

    if (rawBody.length > MAX_BODY_BYTES) {
      return jsonError("Meta event payload too large", 413);
    }

    const { eventName, eventId, customData, eventSourceUrl } = JSON.parse(rawBody);

    if (!ALLOWED_CLIENT_META_EVENTS.has(eventName) || !validateEventId(eventId)) {
      return jsonError("Invalid Meta event", 400);
    }

    const safeEventSourceUrl = validateEventSourceUrl(request, eventSourceUrl);
    const safeCustomData = sanitizeCustomData(eventName, customData);

    if (!safeEventSourceUrl || safeCustomData === null) {
      return jsonError("Invalid Meta event payload", 400);
    }

    const result = await sendMetaCapiEvents(
      [
        {
          eventName,
          eventId,
          customData: safeCustomData,
          eventSourceUrl: safeEventSourceUrl,
        },
      ],
      { request }
    );

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("META_CLIENT_EVENT_ROUTE_ERROR", error);
    return NextResponse.json({ error: "Unable to send Meta event" }, { status: 400 });
  }
}
