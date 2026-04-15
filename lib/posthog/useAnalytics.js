'use client'

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { capturePostHogEvent } from "@/lib/posthog/client";

export function useAnalytics() {
  const pathname = usePathname();
  const { user } = useUser();

  return useMemo(
    () => ({
      capture: (event, properties = {}) =>
        capturePostHogEvent(event, {
          path_name: pathname,
          is_logged_in: Boolean(user),
          user_id: user?.id || "",
          user_email: user?.primaryEmailAddress?.emailAddress || "",
          user_name: user?.fullName || user?.username || "",
          ...properties,
        }),
    }),
    [pathname, user]
  );
}
