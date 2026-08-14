import { notFound } from "next/navigation";
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import { getPublicProductById } from "@/lib/data/storefront";
import { generateProductSchema } from "@/lib/seo/productSchema";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    <main className="bg-[#FCF9F8] px-4 pb-12 text-[#1B1B1C] sm:px-6 lg:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />

      <div className="mx-auto max-w-7xl">
        <div className="mb-6 pt-8 text-sm font-medium text-[#6E776F]">
          <span>Home</span>
          <span className="mx-2 text-[#B4B0A7]">/</span>
          <span>Products</span>
          <span className="mx-2 text-[#B4B0A7]">/</span>
          <span className="text-[#344E41]">{product.category}</span>
        </div>

        <ProductDetails product={product} />
        <ProductDescription product={product} />
      </div>
    </main>
  );
}
