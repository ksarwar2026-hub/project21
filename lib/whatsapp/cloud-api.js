import "server-only";

const REQUEST_TIMEOUT_MS = 10000;
const GRAPH_API_ORIGIN = "https://graph.facebook.com";

function getConfiguration() {
  const graphApiVersion = String(process.env.WHATSAPP_CLOUD_API_VERSION || "").trim();
  const accessToken = String(process.env.WHATSAPP_CLOUD_API_TOKEN || "").trim();
  const phoneNumberId = String(process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID || "").trim();

  if (!graphApiVersion || !/^v\d+(?:\.\d+)?$/.test(graphApiVersion)) {
    return {
      error: {
        code: "WHATSAPP_CONFIG_INVALID",
        message: "WHATSAPP_CLOUD_API_VERSION is missing or invalid.",
        retryable: false,
      },
    };
  }

  if (!accessToken) {
    return {
      error: {
        code: "WHATSAPP_CONFIG_INVALID",
        message: "WHATSAPP_CLOUD_API_TOKEN is missing.",
        retryable: false,
      },
    };
  }

  if (!/^\d+$/.test(phoneNumberId)) {
    return {
      error: {
        code: "WHATSAPP_CONFIG_INVALID",
        message: "WHATSAPP_CLOUD_PHONE_NUMBER_ID is missing or invalid.",
        retryable: false,
      },
    };
  }

  return { graphApiVersion, accessToken, phoneNumberId };
}
function normalizeRecipient(value) {
  const recipient = String(value || "").trim();
  const digits = recipient.startsWith("+") ? recipient.slice(1) : recipient;

  if (!/^\d{8,15}$/.test(digits) || digits.startsWith("0")) {
    return null;
  }

  return digits;
}

function validationError(message) {
  return {
    success: false,
    error: {
      code: "WHATSAPP_VALIDATION_ERROR",
      message,
      retryable: false,
    },
  };
}

function isRetryableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

function sanitizeMetaErrorValue(value, maxLength, { redactPhone = false } = {}) {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  const sanitized = String(value)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

  const safeValue = redactPhone
    ? sanitized.replace(/\+?\d{8,15}/g, "[redacted-phone]")
    : sanitized;

  return safeValue || undefined;
}

function getSafeMetaError(responseBody) {
  const metaError = responseBody?.error;

  if (!metaError || typeof metaError !== "object" || Array.isArray(metaError)) {
    return undefined;
  }

  const safeMetaError = {
    code: sanitizeMetaErrorValue(metaError.code, 64),
    type: sanitizeMetaErrorValue(metaError.type, 64),
    message: sanitizeMetaErrorValue(metaError.message, 500, { redactPhone: true }),
  };

  const entries = Object.entries(safeMetaError).filter(([, value]) => value !== undefined);

  return entries.length ? Object.fromEntries(entries) : undefined;
}

async function sendMessage({ operation, payload }) {
  const configuration = getConfiguration();

  if (configuration.error) {
    return { success: false, error: configuration.error };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const url = `${GRAPH_API_ORIGIN}/${configuration.graphApiVersion}/${configuration.phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${configuration.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });

    let responseBody = {};

    try {
      responseBody = await response.json();
    } catch {
      responseBody = {};
    }

    if (!response.ok) {
      const metaError = getSafeMetaError(responseBody);
      const retryable = isRetryableStatus(response.status);

      console.error("WHATSAPP_CLOUD_API_ERROR", {
        operation,
        status: response.status,
        metaErrorCode: metaError?.code,
        metaErrorType: metaError?.type,
        retryable,
      });

      return {
        success: false,
        error: {
          code: "WHATSAPP_API_ERROR",
          message: "WhatsApp Cloud API request failed.",
          status: response.status,
          retryable,
          ...(metaError ? { metaError } : {}),
        },
      };
    }

    const messageId = responseBody?.messages?.[0]?.id;

    if (typeof messageId !== "string" || !messageId) {
      console.error("WHATSAPP_CLOUD_API_ERROR", {
        operation,
        status: response.status,
        metaErrorCode: "MISSING_MESSAGE_ID",
        retryable: false,
      });

      return {
        success: false,
        error: {
          code: "WHATSAPP_INVALID_API_RESPONSE",
          message: "WhatsApp Cloud API returned no message ID.",
          status: response.status,
          retryable: false,
        },
      };
    }

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const timedOut = error?.name === "AbortError";

    console.error("WHATSAPP_CLOUD_API_REQUEST_ERROR", {
      operation,
      code: timedOut ? "TIMEOUT" : "NETWORK_ERROR",
      retryable: true,
    });

    return {
      success: false,
      error: {
        code: timedOut ? "WHATSAPP_API_TIMEOUT" : "WHATSAPP_NETWORK_ERROR",
        message: timedOut
          ? "WhatsApp Cloud API request timed out."
          : "WhatsApp Cloud API request could not be completed.",
        retryable: true,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendWhatsAppTextMessage({ to, body, previewUrl = false } = {}) {
  const recipient = normalizeRecipient(to);

  if (!recipient) {
    return validationError("Recipient must be an international phone number with 8 to 15 digits.");
  }

  if (typeof body !== "string" || !body.trim()) {
    return validationError("Text message body is required.");
  }

  return sendMessage({
    operation: "text_message",
    payload: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient,
      type: "text",
      text: {
        preview_url: Boolean(previewUrl),
        body,
      },
    },
  });
}
export async function sendWhatsAppTemplateMessage({
  to,
  templateName,
  languageCode,
  components = [],
} = {}) {
  const recipient = normalizeRecipient(to);

  if (!recipient) {
    return validationError("Recipient must be an international phone number with 8 to 15 digits.");
  }

  if (typeof templateName !== "string" || !/^[a-z0-9_]+$/.test(templateName.trim())) {
    return validationError("Template name must contain only lowercase letters, numbers, and underscores.");
  }

  if (typeof languageCode !== "string" || !languageCode.trim()) {
    return validationError("Template language code is required.");
  }

  if (!Array.isArray(components)) {
    return validationError("Template components must be an array.");
  }

  return sendMessage({
    operation: "template_message",
    payload: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient,
      type: "template",
      template: {
        name: templateName.trim(),
        language: {
          code: languageCode.trim(),
        },
        ...(components.length ? { components } : {}),
      },
    },
  });
}
