const DEFAULT_SITE_URL = "https://ksarwar.in";

export const siteConfig = {
  name: "K-SARWAR",
  title: "India's Best Cheapest Shampoo Online | K-SARWAR",
  description:
    "Buy India's best and Affordable shampoo online at K-SARWAR. Authentic, research-backed hair care and homeopathic wellness products with fast delivery across India.",
};

export function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    DEFAULT_SITE_URL
  );
}

export function absoluteUrl(path = "/") {
  return new URL(path, getBaseUrl()).toString();
}
