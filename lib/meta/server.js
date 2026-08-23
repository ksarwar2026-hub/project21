import crypto from "crypto";
import { isUsableMetaValue } from "@/lib/meta/events";

const META_GRAPH_API_VERSION = "v24.0";

function getMetaCapiAccessToken() {
  return process.env.META_CAPI_ACCESS_TOKEN || "";
}

function getMetaEventTargetId() {
  return process.env.META_CAPI_EVENT_SOURCE_ID || "";
}

function getMetaTestEventCode() {
  return process.env.META_TEST_EVENT_CODE || "";
}

export function isMetaCapiConfigured() {
  return (
    isUsableMetaValue(getMetaEventTargetId()) &&
    isUsableMetaValue(getMetaCapiAccessToken())
  );
}

function hashMetaValue(value) {
  const normalized = String(value || "").trim();

  if (!normalized) return undefined;

  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeCountry(value) {
  const normalized = String(value || "").trim().toLowerCase();

  const countryMap = {
    india: "in",
    bharat: "in",
    "united states": "us",
    usa: "us",
    us: "us",
    "united kingdom": "gb",
    uk: "gb",
    england: "gb",
  };

  if (countryMap[normalized]) return countryMap[normalized];
  if (/^[a-z]{2}$/.test(normalized)) return normalized;

  return "";
}

function normalizePhone(value, country) {
  let digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.length === 10 && normalizeCountry(country) === "in") {
    return `91${digits}`;
  }

  return digits;
}

function normalizeNamePart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function getNameParts(value) {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName: normalizeNamePart(parts[0] || ""),
    lastName: normalizeNamePart(parts.length > 1 ? parts[parts.length - 1] : ""),
  };
}

function normalizeLocation(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function firstHeaderValue(value) {
  return String(value || "").split(",")[0].trim();
}

function getFbclidFromUrl(value) {
  if (!value) return "";

  try {
    return new URL(value).searchParams.get("fbclid") || "";
  } catch {
    return "";
  }
}

function getRequestUserData(request, eventSourceUrl) {
  if (!request) return {};

  const fbclid =
    getFbclidFromUrl(eventSourceUrl) ||
    getFbclidFromUrl(request.headers.get("referer")) ||
    getFbclidFromUrl(request.url);
  const fbc =
    request.cookies?.get("_fbc")?.value ||
    (fbclid ? `fb.1.${Math.floor(Date.now() / 1000)}.${fbclid}` : undefined);

  return {
    client_ip_address:
      firstHeaderValue(request.headers.get("x-forwarded-for")) ||
      firstHeaderValue(request.headers.get("x-real-ip")) ||
      firstHeaderValue(request.headers.get("cf-connecting-ip")) ||
      undefined,
    client_user_agent: request.headers.get("user-agent") || undefined,
    fbp: request.cookies?.get("_fbp")?.value,
    fbc,
  };
}

function cleanObject(value) {
  return Object.entries(value || {}).reduce((acc, [key, item]) => {
    if (item !== undefined && item !== null && item !== "") {
      acc[key] = item;
    }
    return acc;
  }, {});
}

export function buildMetaUserData({ user = {}, address = {}, request, eventSourceUrl } = {}) {
  const nameParts = getNameParts(user.name || address.name);
  const country = normalizeCountry(address.country);

  return cleanObject({
    ...getRequestUserData(request, eventSourceUrl),
    em: hashMetaValue(normalizeEmail(user.email || address.email)),
    ph: hashMetaValue(normalizePhone(address.phone, address.country)),
    external_id: hashMetaValue(String(user.id || "").trim()),
    fn: hashMetaValue(nameParts.firstName),
    ln: hashMetaValue(nameParts.lastName),
    ct: hashMetaValue(normalizeLocation(address.city)),
    st: hashMetaValue(normalizeLocation(address.state)),
    zp: hashMetaValue(normalizeLocation(address.zip)),
    country: hashMetaValue(country),
  });
}

function getEventSourceUrl(request, fallbackUrl) {
  if (fallbackUrl) return fallbackUrl;
  if (!request) return undefined;

  return (
    request.headers.get("referer") ||
    request.headers.get("origin") ||
    request.url ||
    undefined
  );
}

function logMetaCapiDebug(message, details = {}) {
  if (process.env.NODE_ENV === "production") return;
  console.info(`[Meta CAPI] ${message}`, details);
}

export async function sendMetaCapiEvents(events = [], { request, userData = {} } = {}) {
  const validEvents = events.filter((event) => event?.eventName && event?.eventId);

  if (!validEvents.length || !isMetaCapiConfigured()) {
    logMetaCapiDebug("skipped", {
      reason: !validEvents.length ? "no_events" : "missing_config",
      events: validEvents.map((event) => ({
        eventName: event.eventName,
        eventId: event.eventId,
      })),
    });
    return { sent: false, skipped: true };
  }

  const targetId = getMetaEventTargetId();
  const url = new URL(`https://graph.facebook.com/${META_GRAPH_API_VERSION}/${targetId}/events`);
  url.searchParams.set("access_token", getMetaCapiAccessToken());

  const payload = {
    data: validEvents.map((event) => ({
      event_name: event.eventName,
      event_time: event.eventTime || Math.floor(Date.now() / 1000),
      event_id: event.eventId,
      event_source_url: getEventSourceUrl(request, event.eventSourceUrl),
      action_source: "website",
      user_data: cleanObject({
        ...buildMetaUserData({ request, eventSourceUrl: event.eventSourceUrl }),
        ...userData,
        ...event.userData,
      }),
      custom_data: cleanObject({
        ...event.customData,
        referrer_url: event.referrerUrl || request?.headers.get("referer") || undefined,
      }),
    })),
  };
  const testEventCode = getMetaTestEventCode().trim();

  if (isUsableMetaValue(testEventCode)) {
    payload.test_event_code = testEventCode;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const responseText = await response.text();
    let responseBody = {};

    try {
      responseBody = responseText ? JSON.parse(responseText) : {};
    } catch {
      responseBody = { message: responseText };
    }

    if (!response.ok) {
      console.error("META_CAPI_ERROR", {
        status: response.status,
        eventIds: validEvents.map((event) => event.eventId),
        error: responseBody?.error
          ? {
              message: responseBody.error.message,
              type: responseBody.error.type,
              code: responseBody.error.code,
              fbtrace_id: responseBody.error.fbtrace_id,
            }
          : responseBody,
      });

      return { sent: false, error: responseBody };
    }

    logMetaCapiDebug("sent", {
      eventIds: validEvents.map((event) => event.eventId),
      response: responseBody,
    });

    return { sent: true, response: responseBody };
  } catch (error) {
    console.error("META_CAPI_ERROR", {
      eventIds: validEvents.map((event) => event.eventId),
      message: error?.message || error,
    });

    return { sent: false, error };
  }
}

export function toBrowserMetaEvents(events = []) {
  return events.map((event) => ({
    eventName: event.eventName,
    eventId: event.eventId,
    customData: event.customData,
  }));
}
