import "server-only";

import { createWhatsAppNotification } from "@/lib/whatsapp/notifications";

const ORDER_CONFIRMATION_TEMPLATE_NAME = "order_confirmation";
const ORDER_CONFIRMATION_TEMPLATE_LANGUAGE_CODE = "en_US";

function skippedResult(reason) {
  return {
    sent: false,
    skipped: true,
    reason,
  };
}
function getInternationalPhone({ user, address }) {
  const candidates = [user?.phone, address?.phone];

  return (
    candidates
      .filter((value) => typeof value === "string")
      .map((value) => value.trim())
      .find((value) => /^\+[1-9]\d{7,14}$/.test(value)) || null
  );
}

function getOrderIds(orderIds) {
  if (!Array.isArray(orderIds)) {
    return [];
  }

  return [...new Set(
    orderIds
      .filter((orderId) => typeof orderId === "string")
      .map((orderId) => orderId.trim())
      .filter(Boolean)
  )];
}

export async function sendOrderConfirmationWhatsApp({
  orderIds,
  user,
  address,
  paymentMethod,
} = {}) {
  if (paymentMethod !== "COD") {
    return skippedResult("NON_COD_ORDER");
  }

  const recipientPhone = getInternationalPhone({ user, address });

  if (!recipientPhone) {
    return skippedResult("WHATSAPP_RECIPIENT_NOT_INTERNATIONAL");
  }

  const customerId = typeof user?.id === "string" ? user.id.trim() : "";
  const notificationOrderIds = getOrderIds(orderIds);

  if (!customerId || !notificationOrderIds.length) {
    return skippedResult("WHATSAPP_ORDER_CONTEXT_INVALID");
  }

  const customerName = typeof user?.name === "string" ? user.name.trim() : "";

  if (!customerName) {
    return skippedResult("WHATSAPP_CUSTOMER_NAME_MISSING");
  }

  const notificationIds = [];
  let created = 0;
  let dispatched = 0;

  for (const orderId of notificationOrderIds) {
    try {
      const result = await createWhatsAppNotification({
        userId: customerId,
        orderId,
        notificationType: "ORDER_CONFIRMATION",
        messageType: "TEMPLATE",
        recipientPhone,
        templateName: ORDER_CONFIRMATION_TEMPLATE_NAME,
        templateLanguageCode: ORDER_CONFIRMATION_TEMPLATE_LANGUAGE_CODE,
        templateParameters: [
          {
            type: "body",
            parameters: [
              { type: "text", parameter_name: "customer_name", text: customerName },
              { type: "text", parameter_name: "order_id", text: orderId },
              {
                type: "text",
                parameter_name: "payment_method",
                text: "Cash on Delivery",
              },
            ],
          },
        ],
        idempotencyKey: `order:${orderId}:ORDER_CONFIRMATION`,
      });

      notificationIds.push(result.notificationId);

      if (result.created) {
        created += 1;
      }

      if (result.dispatched) {
        dispatched += 1;
      }
    } catch {
      // WhatsApp notification failures must not fail the order request.
    }
  }

  if (!notificationIds.length) {
    return skippedResult("WHATSAPP_NOTIFICATION_UNAVAILABLE");
  }

  return {
    sent: false,
    skipped: false,
    queued: dispatched > 0,
    notificationIds,
    created,
    dispatched,
  };
}
