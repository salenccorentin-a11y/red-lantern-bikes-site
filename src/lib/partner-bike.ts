// The extra "partner" bike each model has (see Bike.partner in the schema):
// bookable when all the shop's own bikes of the model are taken, so a customer
// isn't turned away while the owner can still find one from a partner.
// The migration 20261120090000_partner_bikes uses the same plate format.

export const PARTNER_NOTE =
  "Not one of ours: booked only when all our own bikes of this model are taken. Find one from a partner.";

/** "honda-xr150" → "PARTNER-HONDA-XR150". */
export function partnerPlate(modelSlug: string): string {
  return `PARTNER-${modelSlug.toUpperCase()}`;
}
