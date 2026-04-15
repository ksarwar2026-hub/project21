import BestSelling from "@/components/BestSelling";
import Hero from "@/components/Hero";
import Newsletter from "@/components/Newsletter";
import OurSpecs from "@/components/OurSpec";
import LatestProducts from "@/components/LatestProducts";
import { getPublicProducts } from "@/lib/data/storefront";

export default async function Home() {
  const products = await getPublicProducts({ limit: 16 });

  return (
    <div>
      <Hero />
      <LatestProducts products={products} />
      <BestSelling products={products} />
      <OurSpecs />
      <Newsletter />
    </div>
  );
}
