'use client'

import posthog from "posthog-js";
import {
  getPostHogIngestHost,
  getPostHogProjectKey,
  isPostHogClientConfigured,
} from "@/lib/posthog/config";

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === "undefined" || !isPostHogClientConfigured()) {
    return;
  }

  posthog.init(getPostHogProjectKey(), {
    api_host: getPostHogIngestHost(),
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
  });

  initialized = true;
}

export function capturePostHogEvent(event, properties = {}) {
  if (typeof window === "undefined" || !isPostHogClientConfigured()) {
    return;
  }

  initPostHog();
  posthog.capture(event, properties);
}

export function identifyPostHogUser(distinctId, properties = {}) {
  if (typeof window === "undefined" || !distinctId || !isPostHogClientConfigured()) {
    return;
  }

  initPostHog();
  posthog.identify(distinctId, properties);
}

export default posthog;
