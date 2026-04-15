import { absoluteUrl, getBaseUrl } from "@/lib/site";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/store/", "/api/", "/cart", "/orders"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: new URL(getBaseUrl()).host,
  };
}
