import {
  getPostHogAppHost,
  getPostHogIngestHost,
  getPostHogPersonalApiKey,
  getPostHogProjectId,
  getPostHogProjectKey,
  isPostHogClientConfigured,
  isPostHogQueryConfigured,
} from "@/lib/posthog/config";

export async function captureServerEvents(events = []) {
  if (!isPostHogClientConfigured() || events.length === 0) {
    return;
  }

  try {
    const payload = {
      api_key: getPostHogProjectKey(),
      historical_migration: false,
      batch: events.map((event) => ({
        event: event.event,
        properties: {
          distinct_id: event.distinctId,
          ...event.properties,
        },
        timestamp: event.timestamp || new Date().toISOString(),
      })),
    };

    await fetch(`${getPostHogIngestHost()}/batch/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (error) {
    console.error("POSTHOG_CAPTURE_ERROR", error);
  }
}

function parseQueryResults(payload) {
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.results?.results)) {
    return payload.results.results;
  }

  if (Array.isArray(payload?.result)) {
    return payload.result;
  }

  return [];
}

export async function runPostHogQuery(query, name) {
  if (!isPostHogQueryConfigured()) {
    return [];
  }

  const response = await fetch(
    `${getPostHogAppHost()}/api/projects/${getPostHogProjectId()}/query/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getPostHogPersonalApiKey()}`,
      },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query,
        },
        name,
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to query PostHog");
  }

  const payload = await response.json();
  return parseQueryResults(payload);
}
