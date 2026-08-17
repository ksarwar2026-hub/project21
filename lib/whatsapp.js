export const WHATSAPP_PHONE_NUMBER = "919229872643";

export const DEFAULT_WHATSAPP_MESSAGE =
  "Hello K-SARWAR, I would like to know more about your products.";

export function getWhatsAppUrl(message = DEFAULT_WHATSAPP_MESSAGE) {
  return `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function getProductWhatsAppMessage(productName) {
  const name = productName?.trim();

  if (!name) {
    return DEFAULT_WHATSAPP_MESSAGE;
  }

  return `Hello K-SARWAR, I would like to know more about the ${name}.`;
}
