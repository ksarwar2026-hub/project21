import { Suspense } from "react";
import HomepageExperience from "@/components/HomepageExperience";
import HomepageSkeleton from "@/components/HomepageSkeleton";
import {
  getHomepageCampaignBanners,
  getHomepageLimitedTimeOffers,
  getPublicProducts,
} from "@/lib/data/storefront";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function HomepageContent() {
  const [products, campaignOffers, campaignBanners] = await Promise.all([
    getPublicProducts({ limit: 16 }),
    getHomepageLimitedTimeOffers({ limit: 8 }),
    getHomepageCampaignBanners({ limit: 3 }),
  ]);

  return (
    <HomepageExperience
      products={products}
      campaignOffers={campaignOffers}
      campaignBanners={campaignBanners}
    />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomepageSkeleton />}>
      <HomepageContent />
    </Suspense>
  );
}
