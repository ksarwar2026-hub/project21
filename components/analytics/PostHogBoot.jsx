'use client'

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  identifyPostHogUser,
  initPostHog,
  capturePostHogEvent,
} from "@/lib/posthog/client";
import { POSTHOG_EVENTS } from "@/lib/posthog/config";

const PostHogBoot = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const loginTrackedRef = useRef("");

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    capturePostHogEvent("$pageview", {
      $current_url: window.location.href,
      path_name: pathname,
      query_string: searchParams.toString(),
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    identifyPostHogUser(user.id, {
      email: user.primaryEmailAddress?.emailAddress || "",
      name: user.fullName || user.username || "",
    });

    const sessionKey = `posthog-login-seen-${user.id}`;

    if (
      loginTrackedRef.current === user.id ||
      (typeof window !== "undefined" && window.sessionStorage.getItem(sessionKey))
    ) {
      return;
    }

    loginTrackedRef.current = user.id;
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(sessionKey, "1");
    }
    capturePostHogEvent(POSTHOG_EVENTS.USER_LOGGED_IN, {
      user_id: user.id,
      user_email: user.primaryEmailAddress?.emailAddress || "",
      user_name: user.fullName || user.username || "",
    });
  }, [isLoaded, user]);

  return null;
};

export default PostHogBoot;
