import "server-only";

import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";

const WHATSAPP_NOTIFICATION_EVENT = "app/whatsapp.notification.dispatch";

const NOTIFICATION_TYPES = new Set([
  "ORDER_CONFIRMATION",
  "PAYMENT_CONFIRMATION",
  "ORDER_SHIPPED",
  "ORDER_OUT_FOR_DELIVERY",
  "ORDER_DELIVERED",
  "CUSTOMER_NOTIFICATION",
]);

const MESSAGE_TYPES = new Set(["TEXT", "TEMPLATE"]);
const TEMPLATE_COMPONENT_TYPES = new Set(["header", "body", "button"]);
const TEMPLATE_PARAMETER_TYPES = new Set([
  "text",
  "currency",
  "date_time",
  "image",
  "document",
  "video",
]);

function createServiceError(code, message, notificationId) {
  const error = new Error(message);
  error.code = code;

  if (notificationId) {
    error.notificationId = notificationId;
  }

  return error;
}
function normalizeEnum(value, allowedValues, fieldName) {
  const normalized = String(value || "").trim().toUpperCase();

  if (!allowedValues.has(normalized)) {
    throw createServiceError("WHATSAPP_NOTIFICATION_VALIDATION_ERROR", `${fieldName} is invalid.`);
  }

  return normalized;
}

function normalizeOptionalId(value, fieldName) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw createServiceError("WHATSAPP_NOTIFICATION_VALIDATION_ERROR", `${fieldName} is invalid.`);
  }

  const normalized = value.trim();

  if (!normalized) {
    throw createServiceError("WHATSAPP_NOTIFICATION_VALIDATION_ERROR", `${fieldName} is invalid.`);
  }

  return normalized;
}

function normalizeRecipientPhone(value) {
  if (typeof value !== "string") {
    throw createServiceError(
      "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
      "recipientPhone must be an international phone number."
    );
  }

  const recipient = value.trim();
  const digits = recipient.startsWith("+") ? recipient.slice(1) : recipient;

  if (!/^\d{8,15}$/.test(digits) || digits.startsWith("0")) {
    throw createServiceError(
      "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
      "recipientPhone must be an international phone number."
    );
  }

  return digits;
}

function hasMeaningfulValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function normalizeTemplateParameters(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Array.isArray(value)) {
    throw createServiceError(
      "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
      "templateParameters must be an array."
    );
  }

  return value.map((component) => {
    if (
      !component ||
      typeof component !== "object" ||
      Array.isArray(component) ||
      !TEMPLATE_COMPONENT_TYPES.has(component.type) ||
      !Array.isArray(component.parameters)
    ) {
      throw createServiceError(
        "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
        "templateParameters contains an invalid component."
      );
    }

    const normalizedComponent = {
      type: component.type,
      parameters: component.parameters.map((parameter) => {
        if (
          !parameter ||
          typeof parameter !== "object" ||
          Array.isArray(parameter) ||
          !TEMPLATE_PARAMETER_TYPES.has(parameter.type)
        ) {
          throw createServiceError(
            "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
            "templateParameters contains an invalid parameter."
          );
        }

        if (parameter.type === "text") {
          const parameterName = parameter.parameter_name;

          if (
            parameterName !== undefined &&
            (typeof parameterName !== "string" ||
              !/^[A-Za-z0-9_]+$/.test(parameterName.trim()))
          ) {
            throw createServiceError(
              "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
              "templateParameters contains an invalid parameter name."
            );
          }

          if (typeof parameter.text !== "string" || !parameter.text.trim()) {
            throw createServiceError(
              "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
              "templateParameters contains an invalid text parameter."
            );
          }

          return {
            type: parameter.type,
            ...(parameterName !== undefined
              ? { parameter_name: parameterName.trim() }
              : {}),
            text: parameter.text,
          };
        }

        const parameterKey = parameter.type;
        const parameterValue = parameter[parameterKey];

        if (
          !parameterValue ||
          typeof parameterValue !== "object" ||
          Array.isArray(parameterValue)
        ) {
          throw createServiceError(
            "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
            "templateParameters contains an invalid media or structured parameter."
          );
        }

        try {
          return {
            type: parameter.type,
            [parameterKey]: JSON.parse(JSON.stringify(parameterValue)),
          };
        } catch {
          throw createServiceError(
            "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
            "templateParameters must contain JSON-safe values."
          );
        }
      }),
    };

    if (component.sub_type !== undefined) {
      if (typeof component.sub_type !== "string" || !component.sub_type.trim()) {
        throw createServiceError(
          "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
          "templateParameters contains an invalid button subtype."
        );
      }

      normalizedComponent.sub_type = component.sub_type.trim();
    }

    if (component.index !== undefined) {
      const index = String(component.index).trim();

      if (!index) {
        throw createServiceError(
          "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
          "templateParameters contains an invalid button index."
        );
      }

      normalizedComponent.index = index;
    }

    return normalizedComponent;
  });
}

function normalizeIdempotencyKey({ idempotencyKey, orderId, userId, notificationType }) {
  const hasExplicitKey = idempotencyKey !== undefined && idempotencyKey !== null;

  if (hasExplicitKey && typeof idempotencyKey !== "string") {
    throw createServiceError(
      "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
      "idempotencyKey is invalid."
    );
  }

  const explicitKey = hasExplicitKey ? idempotencyKey.trim() : "";
  const key = hasExplicitKey
    ? explicitKey
    : orderId
      ? `order:${orderId}:${notificationType}`
      : "";

  if (!key || key.length > 200 || !/^[A-Za-z0-9._:-]+$/.test(key)) {
    throw createServiceError(
      "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
      "A valid idempotencyKey or stable notification identifier is required."
    );
  }

  return key;
}

function normalizeNotificationInput(input = {}) {
  const notificationType = normalizeEnum(
    input.notificationType,
    NOTIFICATION_TYPES,
    "notificationType"
  );
  const messageType = normalizeEnum(input.messageType, MESSAGE_TYPES, "messageType");
  const userId = normalizeOptionalId(input.userId, "userId");
  const orderId = normalizeOptionalId(input.orderId, "orderId");
  const recipientPhone = normalizeRecipientPhone(input.recipientPhone);
  const idempotencyKey = normalizeIdempotencyKey({
    idempotencyKey: input.idempotencyKey,
    orderId,
    userId,
    notificationType,
  });

  if (messageType === "TEXT") {
    if (typeof input.textBody !== "string") {
      throw createServiceError(
        "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
        "textBody is required for TEXT notifications."
      );
    }

    const textBody = input.textBody.trim();

    if (!textBody) {
      throw createServiceError(
        "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
        "textBody is required for TEXT notifications."
      );
    }

    if (
      hasMeaningfulValue(input.templateName) ||
      hasMeaningfulValue(input.templateLanguageCode) ||
      input.templateParameters !== undefined && input.templateParameters !== null
    ) {
      throw createServiceError(
        "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
        "Template fields must be empty for TEXT notifications."
      );
    }

    return {
      userId,
      orderId,
      notificationType,
      messageType,
      status: "PENDING",
      recipientPhone,
      textBody,
      templateName: null,
      templateLanguageCode: null,
      templateParameters: null,
      idempotencyKey,
    };
  }

  if (typeof input.templateName !== "string") {
    throw createServiceError(
      "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
      "templateName is required for TEMPLATE notifications."
    );
  }

  if (typeof input.templateLanguageCode !== "string") {
    throw createServiceError(
      "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
      "templateLanguageCode is required for TEMPLATE notifications."
    );
  }

  const templateName = input.templateName.trim();
  const templateLanguageCode = input.templateLanguageCode.trim();

  if (!/^[a-z0-9_]+$/.test(templateName)) {
    throw createServiceError(
      "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
      "templateName is required and must use lowercase letters, numbers, and underscores."
    );
  }

  if (!templateLanguageCode) {
    throw createServiceError(
      "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
      "templateLanguageCode is required for TEMPLATE notifications."
    );
  }

  if (hasMeaningfulValue(input.textBody)) {
    throw createServiceError(
      "WHATSAPP_NOTIFICATION_VALIDATION_ERROR",
      "textBody must be empty for TEMPLATE notifications."
    );
  }

  return {
    userId,
    orderId,
    notificationType,
    messageType,
    status: "PENDING",
    recipientPhone,
    textBody: null,
    templateName,
    templateLanguageCode,
    templateParameters: normalizeTemplateParameters(input.templateParameters),
    idempotencyKey,
  };
}

async function findExistingNotification(idempotencyKey) {
  return prisma.whatsAppNotification.findUnique({
    where: { idempotencyKey },
    select: { id: true, idempotencyKey: true },
  });
}

export async function createWhatsAppNotification(input = {}) {
  const data = normalizeNotificationInput(input);
  let notification;
  let created = true;

  try {
    notification = await prisma.whatsAppNotification.create({ data });
  } catch (error) {
    const target = error?.meta?.target;
    const isIdempotencyKeyConflict =
      error?.code === "P2002" &&
      (target === "idempotencyKey" ||
        (Array.isArray(target) && target.includes("idempotencyKey")));

    if (!isIdempotencyKeyConflict) {
      throw createServiceError(
        "WHATSAPP_NOTIFICATION_CREATE_FAILED",
        "WhatsApp notification could not be created."
      );
    }

    try {
      notification = await findExistingNotification(data.idempotencyKey);
    } catch {
      throw createServiceError(
        "WHATSAPP_NOTIFICATION_LOOKUP_FAILED",
        "The existing WhatsApp notification could not be found."
      );
    }
    created = false;

    if (!notification) {
      throw createServiceError(
        "WHATSAPP_NOTIFICATION_IDEMPOTENCY_CONFLICT",
        "The WhatsApp notification idempotency key is already in use."
      );
    }
  }

  if (!created) {
    return {
      notificationId: notification.id,
      idempotencyKey: notification.idempotencyKey,
      created: false,
      dispatched: false,
    };
  }

  try {
    await inngest.send({
      name: WHATSAPP_NOTIFICATION_EVENT,
      data: {
        notificationId: notification.id,
      },
    });
  } catch {
    throw createServiceError(
      "WHATSAPP_NOTIFICATION_EVENT_FAILED",
      "WhatsApp notification dispatch could not be queued.",
      notification.id
    );
  }

  return {
    notificationId: notification.id,
    idempotencyKey: notification.idempotencyKey,
    created,
    dispatched: true,
  };
}
