// What the customer sees when a booking can't go ahead. Codes come from
// reserveBike() and quote(); the wording lives here, in one place.

import type { ReserveError } from "@/server/bookings";

export function bookingErrorMessage(error: ReserveError): string {
  switch (error.code) {
    case "INVALID_DATE":
      return "Please choose valid pick-up and drop-off dates.";
    case "END_BEFORE_START":
      return "Drop-off must be on or after the pick-up day.";
    case "START_IN_PAST":
      return "Pick-up can't be in the past. Please choose today or a later date.";
    case "BELOW_MIN_DAYS":
      return `This trip needs at least ${error.minDays} days.`;
    case "NO_BIKE_AVAILABLE":
      return "Sorry, that bike has just been booked for these dates. Please pick another bike or change your dates.";
    case "ROUTE_NOT_BOOKABLE_ONLINE":
      return "This route can't be booked online yet. Send us a message and we'll arrange it.";
    case "ROUTE_NOT_FOUND":
    case "ROUTE_NOT_READY":
    case "NO_ONE_WAY_FEE":
      return "This trip isn't available online right now. Send us a message and we'll arrange it.";
    case "MODEL_NOT_FOUND":
      return "That bike is no longer available. Please choose another.";
    case "ADD_ON_NOT_FOUND":
    case "INVALID_ADD_ON":
      return "One of the extras is no longer available. Please check your extras and try again.";
  }
}
