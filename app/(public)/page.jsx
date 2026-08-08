import { Suspense } from "react";
import HomepageExperience from "@/components/HomepageExperience";
import HomepageSkeleton from "@/components/HomepageSkeleton";
import { getPublicProducts } from "@/lib/data/storefront";

async function HomepageContent() {
  const products = await getPublicProducts({ limit: 16 });

  return <HomepageExperience products={products} />;
}

export default function Home() {
  return (
    <Suspense fallback={<HomepageSkeleton />}>
      <HomepageContent />
    </Suspense>
  );
}
