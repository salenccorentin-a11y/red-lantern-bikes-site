// Customer reviews for the home and bike pages.
//
// 1. From Google (Places API), when GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID
//    are set: the shop's live rating, review count and the reviews Google
//    selects (up to 5). Refreshed at most once a day, so visitors don't each
//    cost an API call.
// 2. Otherwise, reviews pasted into src/content/reviews.json (copied from
//    Google by the owner).
// 3. Otherwise nothing, and the reviews section is hidden.
//
// Reviews are shown as written: never edited or rewritten.

import { cacheLife } from "next/cache";
import manualReviews from "@/content/reviews.json";
import { reportError } from "@/server/report-error";

export type Review = {
  author: string;
  /** The reviewer's Google profile, for attribution. */
  authorUrl: string | null;
  rating: number;
  text: string;
  /** e.g. "2 months ago" or "March 2026". */
  when: string;
};

export type Reviews = {
  rating: number | null;
  count: number | null;
  /** All reviews on Google Maps. */
  url: string | null;
  reviews: Review[];
  fromGoogle: boolean;
};

type PlaceDetails = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: {
    rating?: number;
    text?: { text?: string };
    originalText?: { text?: string };
    relativePublishTimeDescription?: string;
    authorAttribution?: { displayName?: string; uri?: string };
  }[];
};

export async function loadReviews(language = "en"): Promise<Reviews | null> {
  "use cache";
  cacheLife("days");

  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (key && placeId) {
    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=${language}`,
        {
          headers: {
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews",
          },
        },
      );
      if (!response.ok) throw new Error(`Places API ${response.status}: ${await response.text()}`);
      const place = (await response.json()) as PlaceDetails;
      const reviews = (place.reviews ?? [])
        .map((r): Review => ({
          author: r.authorAttribution?.displayName ?? "Google user",
          authorUrl: r.authorAttribution?.uri ?? null,
          rating: r.rating ?? 0,
          text: r.text?.text ?? r.originalText?.text ?? "",
          when: r.relativePublishTimeDescription ?? "",
        }))
        // Only good reviews with something to read; Google returns up to 5.
        .filter((r) => r.rating >= 4 && r.text.trim().length > 0);
      return {
        rating: place.rating ?? null,
        count: place.userRatingCount ?? null,
        url: place.googleMapsUri ?? null,
        reviews,
        fromGoogle: true,
      };
    } catch (error) {
      await reportError("Google reviews could not be loaded", error);
    }
  }

  if (manualReviews.reviews.length > 0) {
    return {
      rating: manualReviews.rating,
      count: manualReviews.count,
      url: manualReviews.url as string | null,
      reviews: manualReviews.reviews as Review[],
      fromGoogle: false,
    };
  }
  return null;
}
