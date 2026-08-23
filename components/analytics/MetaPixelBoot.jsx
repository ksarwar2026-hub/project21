'use client'

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initMetaPixel, trackMetaPageView } from "@/lib/meta/client";

const MetaPixelBoot = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initMetaPixel();
  }, []);

  useEffect(() => {
    trackMetaPageView();
  }, [pathname, searchParams]);

  return null;
};

export default MetaPixelBoot;
