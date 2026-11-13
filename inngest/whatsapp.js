import prisma from "@/lib/prisma";
import {
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage,
} from "@/lib/whatsapp/cloud-api";
import { inngest } from "./client";

const TERMINAL_STATUSES = new Set(["SENT", "DELIVERED", "READ"]);
const RATE_LIMIT_RETRY_DELAY_MS = 15 * 60 * 1000;

const SAFE_ERROR_MESSAGES = {
  WHATSAPP_CONFIG_INVALID: "WhatsApp Cloud API configuration is invalid.",
  WHATSAPP_VALIDATION_ERROR: "WhatsApp notification validation failed.",
  WHATSAPP_API_ERROR: "WhatsApp Cloud API returned an error.",
  WHATSAPP_API_TIMEOUT: "WhatsApp Cloud API request timed out.",
  WHATSAPP_NETWORK_ERROR: "WhatsApp Cloud API request could not be completed.",
  WHATSAPP_INVALID_API_RESPONSE: "WhatsApp Cloud API returned an invalid response.",
  WHATSAPP_UNEXPECTED_SEND_ERROR: "WhatsApp notification sending failed unexpectedly.",
  WHATSAPP_MESSAGE_TYPE_UNSUPPORTED: "WhatsApp notification message type is unsupported.",
  WHATSAPP_RATE_LIMITED: "WhatsApp Cloud API rate limit was reached.",
  WHATSAPP_SEND_FAILED: "WhatsApp notification could not be sent.",
};

function safeError(code, diagnosticMessage) {
  const safeCode = SAFE_ERROR_MESSAGES[code] ? code : "WHATSAPP_SEND_FAILED";

  return {
    errorCode: safeCode,
    errorMessage: diagnosticMessage || SAFE_ERROR_MESSAGES[safeCode],
  };
}

function formatMetaDiagnostic(metaError) {
  if (!metaError || typeof metaError !== "object") {
    return undefined;
  }

  const code = typeof metaError.code === "string" ? metaError.code.trim() : "";
  const type = typeof metaError.type === "string" ? metaError.type.trim() : "";
  const message = typeof metaError.message === "string" ? metaError.message.trim() : "";

  if (!message) {
    return undefined;
  }

  const codePart = code ? ` [${code}]` : "";
  const typePart = type ? ` (${type})` : "";

  return `Meta WhatsApp error${codePart}${typePart} ${message}`.slice(0, 500);
}

function classifySendResult(result) {
  if (result?.success === true && typeof result.messageId === "string" && result.messageId) {
    return {
      kind: "sent",
      messageId: result.messageId,
    };
  }

  const code = result?.error?.code;
  const status = result?.error?.status;
  const metaDiagnostic = formatMetaDiagnostic(result?.error?.metaError);

  if (code === "WHATSAPP_API_ERROR" && status === 429) {
    return {
      kind: "rate_limited",
      ...safeError("WHATSAPP_RATE_LIMITED", metaDiagnostic),
    };
  }

  if (
    code === "WHATSAPP_CONFIG_INVALID" ||
    code === "WHATSAPP_VALIDATION_ERROR" ||
    (code === "WHATSAPP_API_ERROR" &&
      Number.isInteger(status) &&
      status >= 400 &&
      status < 500 &&
      status !== 408)
  ) {
    return {
      kind: "failed",
      ...safeError(
        code === "WHATSAPP_API_ERROR" ? "WHATSAPP_API_ERROR" : code,
        metaDiagnostic
      ),
    };
  }

  if (
    code === "WHATSAPP_API_TIMEOUT" ||
    code === "WHATSAPP_NETWORK_ERROR" ||
    code === "WHATSAPP_INVALID_API_RESPONSE" ||
    (code === "WHATSAPP_API_ERROR" &&
      Number.isInteger(status) &&
      (status === 408 || status >= 500))
  ) {
    return {
      kind: "ambiguous",
      ...safeError(code, metaDiagnostic),
    };
  }

  return {
    kind: "ambiguous",
    ...safeError("WHATSAPP_SEND_FAILED"),
  };
}

async function sendNotification(notification) {
  try {
    if (notification.messageType === "TEXT") {
      return await sendWhatsAppTextMessage({
        to: notification.recipientPhone,
        body: notification.textBody,
      });
    }

    if (notification.messageType === "TEMPLATE") {
      return await sendWhatsAppTemplateMessage({
        to: notification.recipientPhone,
        templateName: notification.templateName,
        languageCode: notification.templateLanguageCode,
        components: notification.templateParameters,
      });
    }

    return {
      success: false,
      error: { code: "WHATSAPP_MESSAGE_TYPE_UNSUPPORTED" },
    };
  } catch {
    return {
      success: false,
      error: { code: "WHATSAPP_UNEXPECTED_SEND_ERROR" },
    };
  }
}

export const dispatchWhatsAppNotification = inngest.createFunction(
  {
    id: "dispatch-whatsapp-notification",
    triggers: [{ event: "app/whatsapp.notification.dispatch" }],
    retries: 3,
    concurrency: {
      limit: 1,
      key: "event.data.notificationId",
      scope: "fn",
    },
  },
  async ({ event, step }) => {
    const notificationId = event?.data?.notificationId;

    if (typeof notificationId !== "string" || !notificationId.trim()) {
      return {
        status: "INVALID_EVENT",
      };
    }

    const notification = await prisma.whatsAppNotification.findUnique({
      where: { id: notificationId },
      select: {
        id: true,
        status: true,
        metaMessageId: true,
        messageType: true,
        recipientPhone: true,
        textBody: true,
        templateName: true,
        templateLanguageCode: true,
        templateParameters: true,
      },
    });

    if (!notification) {
      return {
        notificationId,
        status: "NOT_FOUND",
      };
    }

    if (notification.metaMessageId || TERMINAL_STATUSES.has(notification.status)) {
      return {
        notificationId,
        status: "ALREADY_PROCESSED",
      };
    }

    const claim = await step.run("claim-whatsapp", async () => {
      const now = new Date();
      const claimed = await prisma.whatsAppNotification.updateMany({
        where: {
          id: notificationId,
          metaMessageId: null,
          OR: [
            { status: "PENDING" },
            {
              status: "FAILED",
              nextAttemptAt: { lte: now },
            },
          ],
        },
        data: {
          status: "PROCESSING",
          retryCount: { increment: 1 },
          lastAttemptAt: now,
        },
      });

      return { claimed: claimed.count === 1 };
    });

    if (!claim.claimed) {
      return {
        notificationId,
        status: "NOT_ELIGIBLE",
      };
    }

    const sendResult = await step.run("send-whatsapp", async () =>
      sendNotification(notification)
    );
    const outcome = classifySendResult(sendResult);

    const finalized = await step.run("finalize-whatsapp", async () => {
      const now = new Date();
      const data =
        outcome.kind === "sent"
          ? {
              status: "SENT",
              metaMessageId: outcome.messageId,
              sentAt: now,
              errorCode: null,
              errorMessage: null,
              nextAttemptAt: null,
            }
          : {
              status: "FAILED",
              errorCode: outcome.errorCode,
              errorMessage: outcome.errorMessage,
              nextAttemptAt:
                outcome.kind === "rate_limited"
                  ? new Date(now.getTime() + RATE_LIMIT_RETRY_DELAY_MS)
                  : null,
            };

      const updated = await prisma.whatsAppNotification.updateMany({
        where: {
          id: notificationId,
          status: "PROCESSING",
          metaMessageId: null,
        },
        data,
      });

      return { updated: updated.count === 1 };
    });

    return {
      notificationId,
      status: outcome.kind === "sent" ? "SENT" : "FAILED",
      finalized: finalized.updated,
    };
  }
);
