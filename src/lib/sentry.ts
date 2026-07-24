import * as Sentry from "@sentry/react";

// Sentry DSN for the "toy-marketplace" project (org: tzuchi-foudation).
// A DSN is safe to embed in client-side code (it only allows sending events,
// not reading them). An env var override is supported for other environments.
const SENTRY_DSN =
  import.meta.env.VITE_SENTRY_DSN ??
  "https://341a1beb7aed6b09c273d9de0ae28ad3@o4511787775950848.ingest.us.sentry.io/4511787831656448";

export function initSentry() {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance monitoring: capture 100% of transactions in dev.
    tracesSampleRate: 1.0,
    // Session Replay sampling.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Send events even in local development so we can verify the integration.
    enabled: true,
  });
}
