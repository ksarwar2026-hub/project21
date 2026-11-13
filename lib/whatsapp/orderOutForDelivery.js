import "server-only";

import prisma from "@/lib/prisma";
import { createWhatsAppNotification } from "@/lib/whatsapp/notifications";

const OUT_FOR_DELIVERY_TEMPLATE_CONFIG = {
  name: "out_for_delivery",
  languageCode: "en_US",
};

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

export async function sendOrderOutForDeliveryWhatsApp({
  orderId,
  userId,
  user,
  address,
} = {}) {
  if (typeof orderId !== "string" || !orderId.trim()) {
    return skippedResult("WHATSAPP_ORDER_CONTEXT_INVALID");
  }

  if (typeof userId !== "string" || !userId.trim()) {
    return skippedResult("WHATSAPP_ORDER_CONTEXT_INVALID");
  }

  const recipientPhone = getInternationalPhone({ user, address });

  if (!recipientPhone) {
    return skippedResult("WHATSAPP_RECIPIENT_NOT_INTERNATIONAL");
  }

  try {
    const customerName =
      typeof user?.name === "string" ? user.name.trim() : "";
    const storedUser = customerName
      ? null
      : await prisma.user.findUnique({
          where: { id: userId.trim() },
          select: { name: true },
        });
    const resolvedCustomerName = customerName || storedUser?.name?.trim() || "";

    if (!resolvedCustomerName) {
      return skippedResult("WHATSAPP_CUSTOMER_NAME_MISSING");
    }

    const result = await createWhatsAppNotification({
      userId: userId.trim(),
      orderId: orderId.trim(),
      notificationType: "ORDER_OUT_FOR_DELIVERY",
      messageType: "TEMPLATE",
      recipientPhone,
      templateName: OUT_FOR_DELIVERY_TEMPLATE_CONFIG.name,
      templateLanguageCode: OUT_FOR_DELIVERY_TEMPLATE_CONFIG.languageCode,
      templateParameters: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              parameter_name: "customer_name",
              text: resolvedCustomerName,
            },
            {
              type: "text",
              parameter_name: "order_id",
              text: orderId.trim(),
            },
          ],
        },
      ],
      idempotencyKey: `order:${orderId.trim()}:OUT_FOR_DELIVERY`,
    });

    return {
      sent: false,
      skipped: false,
      ...result,
    };
  } catch {
    return skippedResult("WHATSAPP_NOTIFICATION_UNAVAILABLE");
  }
}
