import { notFound } from "next/navigation";
import { MailIcon, MapPinIcon } from "lucide-react";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import { getPublicStoreByUsername } from "@/lib/data/storefront";
import { absoluteUrl, siteConfig } from "@/lib/site";

export async function generateMetadata({ params }) {
  const { username } = await params;
  const store = await getPublicStoreByUsername(username);

  if (!store) {
    return {
      title: `Store Not Found | ${siteConfig.name}`,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonical = absoluteUrl(`/shop/${store.username}`);
  const description =
    store.description?.slice(0, 160) ||
    `Browse products from ${store.name} on ${siteConfig.name}.`;

  return {
    title: store.name,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title: store.name,
      description,
      images: store.logo
        ? [
            {
              url: store.logo,
              alt: store.name,
            },
          ]
        : [],
    },
  };
}

export default async function StoreShop({ params }) {
  const { username } = await params;
  const storeInfo = await getPublicStoreByUsername(username);

  if (!storeInfo) {
    notFound();
  }

  const products = storeInfo.Product;

  return (
    <div className="min-h-[70vh] mx-6">
      <div className="max-w-7xl mx-auto bg-slate-50 rounded-xl p-6 md:p-10 mt-6 flex flex-col md:flex-row items-center gap-6 shadow-xs">
        <Image
          src={storeInfo.logo}
          alt={storeInfo.name}
          className="size-32 sm:size-38 object-cover border-2 border-slate-100 rounded-md"
          width={200}
          height={200}
        />
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-semibold text-slate-800">{storeInfo.name}</h1>
          <p className="text-sm text-slate-600 mt-2 max-w-lg">{storeInfo.description}</p>
          <div className="space-y-2 text-sm text-slate-500 mt-4">
            <div className="flex items-center">
              <MapPinIcon className="w-4 h-4 text-gray-500 mr-2" />
              <span>{storeInfo.address}</span>
            </div>
            <div className="flex items-center">
              <MailIcon className="w-4 h-4 text-gray-500 mr-2" />
              <span>{storeInfo.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-40">
        <h2 className="text-2xl mt-12">
          Shop <span className="text-slate-800 font-medium">Products</span>
        </h2>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 xl:gap-8 mx-auto">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {products.length === 0 && (
          <p className="mt-5 text-sm text-slate-500">
            No public products available in this store yet.
          </p>
        )}
      </div>
    </div>
  );
}
