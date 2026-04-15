import { getSitemapEntries } from "@/lib/data/storefront";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap() {
  const { products, stores } = await getSitemapEntries();
  const now = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/shop"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...products.map((product) => ({
      url: absoluteUrl(`/product/${product.id}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    })),
    ...stores.map((store) => ({
      url: absoluteUrl(`/shop/${store.username}`),
      lastModified: store.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    })),
  ];
}
