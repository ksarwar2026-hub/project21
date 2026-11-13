import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const ENV_FILE = ".env.local";
const KNOWN_PRODUCTION_DB_HOSTS = new Set([
  "ep-holy-heart-ah66ayhg-pooler.c-3.us-east-1.aws.neon.tech",
  "ep-holy-heart-ah66ayhg.c-3.us-east-1.aws.neon.tech",
]);

const PROTECTED_ENV_KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "NEXT_PUBLIC_RAZORPAY_KEY_ID",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "NEXT_PUBLIC_POSTHOG_HOST",
  "POSTHOG_PERSONAL_API_KEY",
  "POSTHOG_PROJECT_ID",
  "POSTHOG_APP_HOST",
  "NEXT_PUBLIC_META_PIXEL_ID",
  "META_CAPI_EVENT_SOURCE_ID",
  "META_CAPI_ACCESS_TOKEN",
  "META_TEST_EVENT_CODE",
  "INNGEST_EVENT_KEY",
  "INNGEST_SIGNING_KEY",
  "IMAGEKIT_PUBLIC_KEY",
  "IMAGEKIT_PRIVATE_KEY",
  "IMAGEKIT_URL_ENDPOINT",
  "NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY",
  "NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT",
  "ADMIN_EMAIL",
  "NEXTAUTH_SECRET",
  "SITE_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
  "WHATSAPP_PHONE_NUMBER",
  "WHATSAPP_CLOUD_API_VERSION",
  "WHATSAPP_CLOUD_API_TOKEN",
  "WHATSAPP_CLOUD_PHONE_NUMBER_ID",
  "WHATSAPP_CLOUD_TEMPLATE_NAME",
  "WHATSAPP_DEV_TEST_RECIPIENT",
  "WHATSAPP_WEBHOOK_VERIFY_TOKEN",
  "WHATSAPP_WEBHOOK_APP_SECRET",
];

const REQUIRED_DEV_KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "NEXT_PUBLIC_RAZORPAY_KEY_ID",
];

const REPORT_ONLY_DEV_KEYS = [
  "NEXT_PUBLIC_POSTHOG_KEY",
  "NEXT_PUBLIC_POSTHOG_HOST",
  "POSTHOG_PERSONAL_API_KEY",
  "POSTHOG_PROJECT_ID",
  "POSTHOG_APP_HOST",
  "NEXT_PUBLIC_META_PIXEL_ID",
  "META_CAPI_EVENT_SOURCE_ID",
  "META_CAPI_ACCESS_TOKEN",
  "INNGEST_EVENT_KEY",
  "INNGEST_SIGNING_KEY",
  "IMAGEKIT_PUBLIC_KEY",
  "IMAGEKIT_PRIVATE_KEY",
  "IMAGEKIT_URL_ENDPOINT",
  "WHATSAPP_PHONE_NUMBER",
  "WHATSAPP_CLOUD_API_VERSION",
  "WHATSAPP_CLOUD_API_TOKEN",
  "WHATSAPP_CLOUD_PHONE_NUMBER_ID",
  "WHATSAPP_CLOUD_TEMPLATE_NAME",
  "WHATSAPP_DEV_TEST_RECIPIENT",
  "WHATSAPP_WEBHOOK_VERIFY_TOKEN",
  "WHATSAPP_WEBHOOK_APP_SECRET",
];

function parseEnvFile(path) {
  if (!existsSync(path)) {
    throw new Error(`${path} was not found. Create it from .env.example with development-only values.`);
  }

  const values = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }

  return values;
}

function describeDatabaseUrl(value, key) {
  if (!value) return null;

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${key} in .env.local is not a valid database URL.`);
  }

  const description = {
    host: parsed.host,
    database: parsed.pathname.replace(/^\//, ""),
  };

  if (KNOWN_PRODUCTION_DB_HOSTS.has(description.host)) {
    throw new Error(`${key} points to a known production Neon host. Local development is blocked.`);
  }

  return description;
}

function validateLocalEnvironment(values, { allowMissing = false } = {}) {
  if ((values.DB_ENVIRONMENT || "").toLowerCase() !== "development") {
    throw new Error("DB_ENVIRONMENT must be set to development in .env.local.");
  }

  const database = describeDatabaseUrl(values.DATABASE_URL, "DATABASE_URL");
  const direct = describeDatabaseUrl(values.DIRECT_URL, "DIRECT_URL");
  const missing = REQUIRED_DEV_KEYS.filter((key) => !String(values[key] || "").trim());
  const reportOnlyMissing = REPORT_ONLY_DEV_KEYS.filter((key) => !String(values[key] || "").trim());

  console.log("Local environment check: DB_ENVIRONMENT=development");
  if (database) console.log(`Local DATABASE_URL host=${database.host} database=${database.database}`);
  if (direct) console.log(`Local DIRECT_URL host=${direct.host} database=${direct.database}`);

  if (missing.length) {
    console.error(`Missing DEV environment variables: ${missing.join(", ")}`);
    if (!allowMissing) {
      throw new Error("Local development is blocked until DEV credentials are configured in .env.local.");
    }
  }

  if (reportOnlyMissing.length) {
    console.warn(`Missing optional/integration DEV environment variables: ${reportOnlyMissing.join(", ")}`);
  }
}

try {
  const rawArgs = process.argv.slice(2);
  const allowMissing = rawArgs.includes("--allow-missing");
  const args = rawArgs.filter((arg) => arg !== "--allow-missing");
  const envLocal = parseEnvFile(ENV_FILE);
  validateLocalEnvironment(envLocal, { allowMissing });

  if (args[0] === "--check") {
    process.exit(0);
  }

  const childEnv = { ...process.env };
  for (const key of PROTECTED_ENV_KEYS) {
    childEnv[key] = envLocal[key] || "";
  }
  childEnv.DB_ENVIRONMENT = "development";
  childEnv.NEXT_PUBLIC_APP_ENV = "development";

  const result = spawnSync("npx", ["next", ...(args.length ? args : ["dev"])], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: childEnv,
  });

  process.exit(result.status ?? 1);
} catch (error) {
  console.error(`SAFE_NEXT_LOCAL_ERROR: ${error.message}`);
  process.exit(1);
}
