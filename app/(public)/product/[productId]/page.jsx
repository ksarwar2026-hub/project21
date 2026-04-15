import { notFound } from "next/navigation";
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import { getPublicProductById } from "@/lib/data/storefront";
import { generateProductSchema } from "@/lib/seo/productSchema";
import { absoluteUrl, siteConfig } from "@/lib/site";

export async function generateMetadata({ params }) {
  const { productId } = await params;
  const product = await getPublicProductById(productId);

  if (!product) {
    return {
      title: `Product Not Found | ${siteConfig.name}`,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = product.description?.slice(0, 160) || siteConfig.description;
  const canonical = absoluteUrl(`/product/${product.id}`);

  return {
    title: product.name,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title: product.name,
      description,
      images: product.images?.length
        ? [
            {
              url: product.images[0],
              alt: product.name,
            },
          ]
        : [],
    },
  };
}

export default async function Product({ params }) {
  const { productId } = await params;
  const product = await getPublicProductById(productId);

  if (!product) {
    notFound();
  }

  const schema = generateProductSchema(product);

  return (
    <div className="mx-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />

      <div className="max-w-7xl mx-auto">
        <div className="text-gray-600 text-sm mt-8 mb-5">
          Home / Products / {product.category}
        </div>

        <ProductDetails product={product} />
        <ProductDescription product={product} />
      </div>
    </div>
  );
}
