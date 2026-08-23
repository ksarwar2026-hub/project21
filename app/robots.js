import { absoluteUrl, getBaseUrl } from "@/lib/site";
import { ADMIN_DASHBOARD_PATH, STORE_DASHBOARD_PATH } from "@/lib/privateRoutes";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/store/",
          `${ADMIN_DASHBOARD_PATH}/`,
          `${STORE_DASHBOARD_PATH}/`,
          "/api/",
          "/cart",
          "/orders",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: new URL(getBaseUrl()).host,
  };
}
