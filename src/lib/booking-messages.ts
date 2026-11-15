// What the customer sees when a booking can't go ahead. Codes come from
// reserveBike() and quote(); the wording is in src/i18n/messages.

import { getMessages } from "@/i18n";
import { fill, type Locale } from "@/i18n/config";
import type { ReserveError } from "@/server/bookings";

export function bookingErrorMessage(error: ReserveError, lang: Locale = "en"): string {
  const t = getMessages(lang).bookingErrors;
  switch (error.code) {
    case "INVALID_DATE":
      return t.INVALID_DATE;
    case "END_BEFORE_START":
      return t.END_BEFORE_START;
    case "START_IN_PAST":
      return t.START_IN_PAST;
    case "BELOW_MIN_DAYS":
      return fill(t.BELOW_MIN_DAYS, { days: error.minDays });
    case "NO_BIKE_AVAILABLE":
      return t.NO_BIKE_AVAILABLE;
    case "ROUTE_NOT_BOOKABLE_ONLINE":
      return t.ROUTE_NOT_BOOKABLE_ONLINE;
    case "ROUTE_NOT_FOUND":
    case "ROUTE_NOT_READY":
    case "NO_ONE_WAY_FEE":
      return t.ROUTE_UNAVAILABLE;
    case "MODEL_NOT_FOUND":
      return t.MODEL_NOT_FOUND;
    case "ADD_ON_NOT_FOUND":
    case "INVALID_ADD_ON":
      return t.ADD_ON_UNAVAILABLE;
    case "TOO_MANY_ADD_ON":
      return t.TOO_MANY_ADD_ON;
  }
}
