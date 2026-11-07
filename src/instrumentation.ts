// Error alerts (Sentry), server side. Next.js runs register() once when the
// server starts and onRequestError() when a page, server action or route
// fails, e.g. a booking that can't be saved. Off until SENTRY_DSN is set.
//
// Only errors, never personal data: see src/lib/sentry-options.ts.

import type { Instrumentation } from "next";

export async function register() {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  const { sentryOptions } = await import("@/lib/sentry-options");
  Sentry.init(sentryOptions(process.env.SENTRY_DSN));
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
};
