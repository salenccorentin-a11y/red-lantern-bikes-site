// Sentry settings shared by the server, the browser and scripts. Errors only:
// no performance tracing, and no personal data. Sentry's defaults would send
// cookies, headers, form contents (customers' names and emails) and query
// strings, so all of that is switched off, and the private code in booking
// page addresses is hidden.

import type { ErrorEvent } from "@sentry/nextjs";

const hideBookingCodes = (url?: string) => url?.replace(/\/booking\/[^/?#]+/, "/booking/[token]");

export function sentryOptions(dsn: string) {
  return {
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    tracesSampleRate: 0,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    beforeSend(event: ErrorEvent) {
      if (event.request?.url) event.request.url = hideBookingCodes(event.request.url);
      if (event.transaction) event.transaction = hideBookingCodes(event.transaction);
      return event;
    },
  };
}
