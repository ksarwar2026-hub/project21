import "server-only";

import crypto from "node:crypto";
import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

const SIGNATURE_HEADER = "x-hub-signature-256";
const MAX_WEBHOOK_BODY_LENGTH = 1_000_000;
const MAX_ERROR_CODE_LENGTH = 64;
const MAX_ERROR_MESSAGE_LENGTH = 500;

function emptyResponse(status) {
  return new NextResponse(null, { status });
}

function sanitizeValue(value, maxLength) {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  const sanitized = String(value)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\+?\d{8,15}/g, "[redacted-phone]")
    .trim()
    .slice(0, maxLength);

  return sanitized || undefined;
}

function safeCompareSignature(signature, expectedSignature) {
  if (typeof signature !== "string" || !signature || !expectedSignature) {
    return false;
  }

  const received = Buffer.from(signature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  return (
    received.length === expected.length &&
    crypto.timingSafeEqual(received, expected)
  );
}

function isValidSignature(rawBody, signature) {
  const appSecret = String(process.env.WHATSAPP_WEBHOOK_APP_SECRET || "").trim();

  if (!appSecret) {
    return false;
  }

  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex")}`;

  return safeCompareSignature(signature, expectedSignature);
}

function parseMetaTimestamp(value) {
  const timestamp =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value.trim())
        ? Number(value.trim())
        : NaN;

  if (!Number.isSafeInteger(timestamp) || timestamp <= 0) {
    return null;
  }

  const date = new Date(timestamp * 1000);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getFailureDetails(statusEvent) {
  const error = Array.isArray(statusEvent.errors) ? statusEvent.errors[0] : null;
  const errorCode = sanitizeValue(error?.code, MAX_ERROR_CODE_LENGTH);
  const title = sanitizeValue(error?.title, MAX_ERROR_MESSAGE_LENGTH);
  const message = sanitizeValue(error?.message, MAX_ERROR_MESSAGE_LENGTH);
  const details = sanitizeValue(error?.error_data?.details, MAX_ERROR_MESSAGE_LENGTH);
  const errorMessage = [title, message, details]
    .filter(Boolean)
    .join(" ")
    .slice(0, MAX_ERROR_MESSAGE_LENGTH);

  return {
    errorCode: errorCode || "WHATSAPP_DELIVERY_FAILED",
    errorMessage: errorMessage || "WhatsApp message delivery failed.",
  };
}

function getStatusUpdate(statusEvent, timestamp) {
  switch (statusEvent.status) {
    case "sent":
      return {
        allowedStatuses: ["PENDING", "PROCESSING", "SENT"],
        data: {
          status: "SENT",
          sentAt: timestamp,
        },
      };
    case "delivered":
      return {
        allowedStatuses: ["PENDING", "PROCESSING", "SENT", "DELIVERED"],
        data: {
          status: "DELIVERED",
          deliveredAt: timestamp,
        },
      };
    case "read":
      return {
        allowedStatuses: [
          "PENDING",
          "PROCESSING",
          "SENT",
          "DELIVERED",
          "READ",
        ],
        data: {
          status: "READ",
          readAt: timestamp,
        },
      };
    case "failed":
      return {
        allowedStatuses: ["PENDING", "PROCESSING", "SENT", "FAILED"],
        data: {
          status: "FAILED",
          ...getFailureDetails(statusEvent),
        },
      };
    default:
      return null;
  }
}

function getStatusEvents(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return [];
  }

  const entries = Array.isArray(payload.entry) ? payload.entry : [];
  const events = [];

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];

    for (const change of changes) {
      const statuses = Array.isArray(change?.value?.statuses)
        ? change.value.statuses
        : [];

      for (const statusEvent of statuses) {
        if (
          statusEvent &&
          typeof statusEvent === "object" &&
          typeof statusEvent.id === "string" &&
          statusEvent.id.trim()
        ) {
          events.push(statusEvent);
        }
      }
    }
  }

  return events;
}

async function processStatusEvent(statusEvent) {
  const messageId = statusEvent.id.trim();
  const timestamp = parseMetaTimestamp(statusEvent.timestamp);
  const update = getStatusUpdate(statusEvent, timestamp);

  if (!timestamp || !update) {
    return;
  }

  await prisma.whatsAppNotification.updateMany({
    where: {
      metaMessageId: messageId,
      status: { in: update.allowedStatuses },
    },
    data: update.data,
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const verifyToken = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const configuredToken = String(
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || ""
  ).trim();

  if (
    mode !== "subscribe" ||
    !configuredToken ||
    verifyToken !== configuredToken ||
    !challenge
  ) {
    return emptyResponse(403);
  }

  return new NextResponse(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(request) {
  const rawBody = await request.text();

  if (
    rawBody.length > MAX_WEBHOOK_BODY_LENGTH ||
    !isValidSignature(rawBody, request.headers.get(SIGNATURE_HEADER))
  ) {
    return emptyResponse(401);
  }

  let payload;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return emptyResponse(400);
  }

  const statusEvents = getStatusEvents(payload);

  try {
    for (const statusEvent of statusEvents) {
      await processStatusEvent(statusEvent);
    }
  } catch {
    return emptyResponse(500);
  }

  return emptyResponse(200);
}
