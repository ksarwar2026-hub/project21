const DEFAULT_SITE_URL = "https://ksarwar.in";

export const siteConfig = {
  name: "K-SARWAR",
  title: "K-SARWAR Homeopathic Medicines",
  description:
    "Shop authentic homeopathic medicines, wellness products, and research-backed remedies from K-SARWAR.",
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
