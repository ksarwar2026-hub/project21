import ProductCard from "@/components/ProductCard";
import { getPublicProducts } from "@/lib/data/storefront";
import { absoluteUrl, siteConfig } from "@/lib/site";

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const search = params?.search?.trim();

  if (search) {
    return {
      title: `Search results for ${search}`,
      description: `Browse products matching ${search} on ${siteConfig.name}.`,
      alternates: {
        canonical: absoluteUrl("/shop"),
      },
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  return {
    title: "Shop",
    description: `Browse all products available on ${siteConfig.name}.`,
    alternates: {
      canonical: absoluteUrl("/shop"),
    },
  };
}

export default async function Shop({ searchParams }) {
  const params = await searchParams;
  const search = params?.search?.trim() || "";
  const products = await getPublicProducts({ search });

  return (
    <div className="min-h-[70vh] mx-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl text-slate-500 my-6">
          {search ? (
            <>
              Search results for{" "}
              <span className="text-slate-700 font-medium">{search}</span>
            </>
          ) : (
            <>
              All <span className="text-slate-700 font-medium">Products</span>
            </>
          )}
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 xl:gap-8 mx-auto mb-32">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {products.length === 0 && (
          <p className="mb-32 text-sm text-slate-500">
            No products found for this search yet.
          </p>
        )}
      </div>
    </div>
  );
}
