// Starting data, copied from docs/pricing.md (10 and 11 October 2026).
// oneWayFee is per model and the same on both online routes (Saigon to Hanoi
// and Saigon to Da Nang).
// After launch, staff edit these values in the settings page; the seed never
// overwrites rows that already exist.

import type { AddOnPricing, City } from "@/generated/prisma/client";

export const BIKE_MODELS = [
  {
    slug: "wave-alpha-110",
    name: "Honda Wave Alpha 110cc",
    kind: "Semi-automatic",
    units: 4,
    dailyRate: 240_000,
    weeklyRate: 205_000,
    monthlyRate: 185_000,
    oneWayFee: 1_300_000,
  },
  {
    slug: "suzuki-gd110",
    name: "Suzuki GD110",
    kind: "Manual",
    units: 1,
    dailyRate: 240_000,
    weeklyRate: 205_000,
    monthlyRate: 185_000,
    oneWayFee: 1_300_000,
  },
  {
    slug: "suzuki-en125",
    name: "Suzuki EN125",
    kind: "Manual",
    units: 1,
    dailyRate: 300_000,
    weeklyRate: 280_000,
    monthlyRate: 250_000,
    oneWayFee: 1_600_000,
  },
  {
    slug: "honda-cb125",
    name: "Honda CB125",
    kind: "Manual",
    units: 1,
    dailyRate: 300_000,
    weeklyRate: 280_000,
    monthlyRate: 250_000,
    oneWayFee: 1_600_000,
  },
  {
    slug: "yamaha-nvx125",
    name: "Yamaha NVX125",
    kind: "Automatic scooter",
    units: 1,
    dailyRate: 300_000,
    weeklyRate: 280_000,
    monthlyRate: 250_000,
    oneWayFee: 1_600_000,
  },
  {
    slug: "honda-winner-x-150",
    name: "Honda Winner X 150",
    kind: "Manual",
    units: 3,
    dailyRate: 360_000,
    weeklyRate: 330_000,
    monthlyRate: 280_000,
    oneWayFee: 1_600_000,
  },
  {
    slug: "suzuki-gsx-r150",
    name: "Suzuki GSX-R150",
    kind: "Manual sport",
    units: 2,
    dailyRate: 360_000,
    weeklyRate: 310_000,
    monthlyRate: 280_000,
    oneWayFee: 1_600_000,
  },
  {
    slug: "honda-xr150",
    name: "Honda XR150",
    kind: "Manual dual-sport",
    units: 8,
    dailyRate: 400_000,
    weeklyRate: 350_000,
    monthlyRate: 300_000,
    oneWayFee: 1_600_000,
  },
  {
    slug: "honda-cb150x",
    name: "Honda CB150X",
    kind: "Manual adventure",
    units: 2,
    dailyRate: 650_000,
    weeklyRate: 560_000,
    monthlyRate: 400_000,
    oneWayFee: 2_100_000,
  },
  {
    slug: "honda-crf150",
    name: "Honda CRF150",
    kind: "Manual dirt",
    units: 1,
    dailyRate: 650_000,
    weeklyRate: 560_000,
    monthlyRate: 400_000,
    oneWayFee: 1_600_000,
  },
  {
    slug: "yamaha-wr155r",
    name: "Yamaha WR155R",
    kind: "Manual dual-sport",
    units: 1,
    dailyRate: 900_000,
    weeklyRate: 770_000,
    monthlyRate: 500_000,
    oneWayFee: 1_600_000,
  },
  {
    slug: "kawasaki-versys-x300",
    name: "Kawasaki Versys X300",
    kind: "Manual adventure",
    units: 1,
    dailyRate: 1_200_000,
    weeklyRate: 1_100_000,
    monthlyRate: 900_000,
    oneWayFee: 2_100_000,
  },
] as const;

// One-way routes. Bikes return to Saigon by train in 3 days. The reverse routes
// are enquiries; their transit days don't apply (the bike ends in Saigon).
export const ROUTES: {
  fromCity: City;
  toCity: City;
  minDays: number;
  transitDays: number | null;
  bookableOnline: boolean;
}[] = [
  { fromCity: "SAIGON", toCity: "HANOI", minDays: 12, transitDays: 3, bookableOnline: true },
  { fromCity: "SAIGON", toCity: "DA_NANG", minDays: 7, transitDays: 3, bookableOnline: true },
  // Reverse directions: enquiry only at launch.
  { fromCity: "HANOI", toCity: "SAIGON", minDays: 12, transitDays: null, bookableOnline: false },
  { fromCity: "DA_NANG", toCity: "SAIGON", minDays: 7, transitDays: null, bookableOnline: false },
];

// Placeholders from the prototype until the real list arrives.
export const ADD_ONS: {
  slug: string;
  name: string;
  description: string;
  pricing: AddOnPricing;
  price: number;
}[] = [
  {
    slug: "second-helmet",
    name: "Second helmet",
    description: "Placeholder price",
    pricing: "PER_DAY",
    price: 20_000,
  },
  {
    slug: "phone-mount",
    name: "Phone mount",
    description: "Placeholder price",
    pricing: "FLAT",
    price: 50_000,
  },
  {
    slug: "luggage-rack",
    name: "Luggage rack and straps",
    description: "Placeholder price",
    pricing: "FLAT",
    price: 150_000,
  },
];

/** Placeholder plate until the real plates are entered, e.g. "TEMP-HONDA-XR150-03". */
export function placeholderPlate(modelSlug: string, n: number) {
  return `TEMP-${modelSlug.toUpperCase()}-${String(n).padStart(2, "0")}`;
}
