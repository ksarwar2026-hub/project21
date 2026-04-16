export const POSTHOG_EVENTS = {
  USER_LOGGED_IN: "user_logged_in",
  SIGN_IN_CTA_CLICKED: "sign_in_cta_clicked",
  SEARCH_SUBMITTED: "search_submitted",
  SEARCH_SUGGESTION_CLICKED: "search_suggestion_clicked",
  PRODUCT_CARD_CLICKED: "product_card_clicked",
  PRODUCT_VIEWED: "product_viewed",
  ADD_TO_CART_CLICKED: "add_to_cart_clicked",
  CART_QUANTITY_INCREASED: "cart_quantity_increased",
  CART_QUANTITY_DECREASED: "cart_quantity_decreased",
  COUPON_APPLIED: "coupon_applied",
  CHECKOUT_STARTED: "checkout_started",
  ORDER_PLACED: "order_placed",
  PRODUCT_ORDERED: "product_ordered",
};

export function getPostHogProjectKey() {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_KEY ||
    process.env.NEXT_PUBLIC_POSTHOG_TOKEN ||
    process.env.POSTHOG_PROJECT_KEY ||
    ""
  );
}

export function getPostHogIngestHost() {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_HOST ||
    process.env.POSTHOG_HOST ||
    "https://us.i.posthog.com"
  );
}

export function getPostHogAppHost() {
  const explicitHost =
    process.env.POSTHOG_APP_HOST || process.env.POSTHOG_API_HOST || "";

  if (explicitHost) {
    return explicitHost;
  }

  const ingestHost = getPostHogIngestHost();
  return ingestHost.replace(".i.posthog.com", ".posthog.com");
}

export function getPostHogProjectId() {
  return process.env.POSTHOG_PROJECT_ID || "";
}

export function getPostHogPersonalApiKey() {
  return process.env.POSTHOG_PERSONAL_API_KEY || "";
}

export function getMissingPostHogQueryEnvVars() {
  const missing = [];

  if (!getPostHogPersonalApiKey()) {
    missing.push("POSTHOG_PERSONAL_API_KEY");
  }

  if (!getPostHogProjectId()) {
    missing.push("POSTHOG_PROJECT_ID");
  }

  return missing;
}

export function getMissingPostHogClientEnvVars() {
  const missing = [];

  if (!getPostHogProjectKey()) {
    missing.push("NEXT_PUBLIC_POSTHOG_KEY");
  }

  return missing;
}

export function isPostHogClientConfigured() {
  return Boolean(getPostHogProjectKey() && getPostHogIngestHost());
}

export function isPostHogQueryConfigured() {
  return Boolean(getMissingPostHogQueryEnvVars().length === 0 && getPostHogAppHost());
}
