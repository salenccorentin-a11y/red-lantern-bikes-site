import type { City } from "@/generated/prisma/enums";

export const CITY_NAME: Record<City, string> = {
  SAIGON: "Saigon",
  HANOI: "Hanoi",
  DA_NANG: "Da Nang",
};

/** How a drop-off is described to customers. */
export function dropoffLabel(city: City): string {
  return city === "SAIGON" ? "Saigon (return to the shop)" : `${CITY_NAME[city]} (one-way)`;
}
