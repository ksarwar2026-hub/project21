import { absoluteUrl, siteConfig } from "@/lib/site";

export function generateProductSchema(product) {
  const totalRatings = product.rating?.length || 0;
  const avgRating =
    totalRatings > 0
      ? product.rating.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings
      : null;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    brand: {
      "@type": "Brand",
      name: siteConfig.name,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: "https://schema.org/InStock",
      url: absoluteUrl(`/product/${product.id}`),
    },
    ...(avgRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        reviewCount: totalRatings,
      },
    }),
  };
}
