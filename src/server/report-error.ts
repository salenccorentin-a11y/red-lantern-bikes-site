// For errors the code catches and carries on from (e.g. a booking email that
// failed to send): logs it, and sends it to Sentry when SENTRY_DSN is set, so
// someone hears about it. Also works in scripts like the hourly job.

export async function reportError(message: string, error: unknown): Promise<void> {
  console.error(message, error);
  if (!process.env.SENTRY_DSN) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    if (!Sentry.getClient()) {
      const { sentryOptions } = await import("@/lib/sentry-options");
      Sentry.init(sentryOptions(process.env.SENTRY_DSN));
    }
    Sentry.captureException(error, { extra: { message } });
    await Sentry.flush(2000);
  } catch (sentryError) {
    console.error("Could not report the error to Sentry", sentryError);
  }
}
