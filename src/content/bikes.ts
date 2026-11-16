// Customer-facing text for each bike model, keyed by the model's slug in the
// database. Prices, names and "kind" come from the database (staff settings);
// this file only holds the descriptions. Draft text: please check it.

export type BikeContent = {
  /** One line for cards. */
  summary: string;
  /** A short paragraph for the bike's own page. */
  description: string;
  bestFor: string[];
  /** Which licence the rider needs (see the FAQ). */
  licence: "IDP_OR_A1" | "A2";
  /** Page title and meta description, from the old site's product pages where
   * there was one. No prices: they must be known when the page is built. */
  seoTitle: string;
  seoDescription: string;
};

export const BIKE_CONTENT: Record<string, BikeContent> = {
  "wave-alpha-110": {
    summary: "Light, frugal and easy: the bike most of Vietnam rides.",
    description:
      "The Wave Alpha is Vietnam's everyday workhorse. Four gears and no clutch lever make it easy to learn, it sips fuel, and any mechanic in the country can fix it. Ideal for getting around Saigon or a do the whole country without any issues.",
    bestFor: ["First-time riders", "City riding", "Budget trips"],
    licence: "IDP_OR_A1",
    seoTitle: "Honda Wave Rental Saigon | Red Lantern Bikes",
    seoDescription:
      "Rent a Honda Wave 110cc from Ho Chi Minh City to Ha Noi by the day, week or month. Easy to ride, fuel-efficient and reliable. Perfect for touring Vietnam.",
  },
  "suzuki-gd110": {
    summary: "A simple, classic manual for riders who want a clutch.",
    description:
      "The GD110 is a small, light manual bike with a proper clutch and a comfortable upright seat. Cheap to run and easy to handle, it's a good first manual for a longer trip.",
    bestFor: ["Learning a manual", "Budget trips", "Light luggage"],
    licence: "IDP_OR_A1",
    seoTitle: "Suzuki GD110 Rental Saigon | Red Lantern Bikes",
    seoDescription:
      "Rent a Suzuki GD110cc from Ho Chi Minh City to Ha Noi by the day, week or month. Easy to ride, fuel-efficient and reliable. Helmet included.",
  },
  "suzuki-en125": {
    summary: "A comfortable little manual with a bit more pull.",
    description:
      "The EN125 adds a little more power and a roomier riding position to a simple, reliable manual. A sensible choice for one rider with a backpack heading out of the city.",
    bestFor: ["Solo touring", "Mixed city and highway"],
    licence: "IDP_OR_A1",
    seoTitle: "Suzuki EN125 Rental Ho Chi Minh City | Red Lantern Bikes",
    seoDescription:
      "Rent a Suzuki EN125 classic street bike in Saigon by the day, week or month. Comfortable, reliable, and easy to ride. Great for city touring and day trips outside HCMC.",
  },
  "honda-cb125": {
    summary: "Honda's light, easy-going naked bike.",
    description:
      "A friendly, light manual with Honda reliability. Comfortable enough for long days and nimble enough for traffic.",
    bestFor: ["Solo touring", "Riders new to manual bikes"],
    licence: "IDP_OR_A1",
    seoTitle: "Honda CB125 Rental Saigon | Red Lantern Bikes",
    seoDescription:
      "Rent a Honda CB125 in Ho Chi Minh City by the day, week or month. Light, reliable and easy to ride. One-way to Hanoi or Da Nang available. Helmet included.",
  },
  "yamaha-nvx125": {
    summary: "An automatic scooter: twist and go.",
    description:
      "No gears at all. The NVX is comfortable, has storage under the seat, and is the easiest ride for long and confortable road-trip if you don't want to think about shifting.",
    bestFor: ["City riding", "No gears", "Day trips"],
    licence: "IDP_OR_A1",
    seoTitle: "Yamaha NVX Rental Saigon | Red Lantern Bikes",
    seoDescription:
      "Rent a Yamaha NVX125 in Ho Chi Minh City by the day, week or month. Easy to ride, fuel-efficient and reliable. Perfect for touring Vietnam. Helmet included.",
  },
  "honda-winner-x-150": {
    summary: "Sporty, quick and light, with a six-speed gearbox.",
    description:
      "The Winner X is light like a scooter but rides like a small sports bike. Plenty of power for highways and passes, while staying easy to park and cheap to run.",
    bestFor: ["Coastal highways", "Riders with some experience"],
    licence: "IDP_OR_A1",
    seoTitle: "Honda WinnerX150 Rental Ho Chi Minh City | Red Lantern Bikes",
    seoDescription:
      "Rent a Honda Winner X 150 in Ho Chi Minh City by the day, week or month. 150cc, lightweight and thrilling. Ideal for experienced riders exploring Vietnam.",
  },
  "suzuki-gsx-r150": {
    summary: "A sporty 150cc for riders who like twisty roads.",
    description:
      "A sporty 150cc with a lively engine and sharp handling. Best on good roads and mountain passes, for riders already comfortable with a manual.",
    bestFor: ["Mountain passes", "Experienced riders"],
    licence: "IDP_OR_A1",
    seoTitle: "Suzuki GSX-R150 Rental Saigon | Red Lantern Bikes",
    seoDescription:
      "Rent a Suzuki GSX-R150 sport bike in Ho Chi Minh City by the day, week or month. 150cc, lightweight and thrilling. Ideal for experienced riders exploring Vietnam.",
  },
  "honda-xr150": {
    summary: "The go-anywhere favourite for the trip up Vietnam.",
    description:
      "Tall suspension, a tough single-cylinder engine and simple mechanics: the XR150 shrugs off potholes, gravel and rain. It's our most-rented bike for the long ride to Hanoi or Da Nang.",
    bestFor: ["Saigon to Hanoi", "Rough roads", "Long trips"],
    licence: "IDP_OR_A1",
    seoTitle: "Honda XR150 Rental Ho Chi Minh City | Red Lantern Bikes",
    seoDescription:
      "Rent a Honda XR150 in Saigon by the day, week or month. Ideal for city riding and off-road adventures. 150cc trail bike. One-way to Hanoi available.",
  },
  "honda-cb150x": {
    summary: "A light adventure bike with a windscreen and comfortable seat.",
    description:
      "The CB150X brings adventure-bike comfort to a 150cc: a screen to keep the wind off, an upright position and room for luggage. A comfortable choice for the long north–south ride.",
    bestFor: ["Long-distance comfort", "Riding with luggage"],
    licence: "IDP_OR_A1",
    seoTitle: "Honda CB150X Rental Saigon | Red Lantern Bikes",
    seoDescription:
      "Rent a Honda CB150X adventure bike in Ho Chi Minh City by the day, week or month. Versatile, upright riding position, perfect for city and touring in Vietnam.",
  },
  "honda-crf150": {
    summary: "A proper trail bike for dirt roads and the countryside.",
    description:
      "Long-travel suspension and knobbly tyres made for off-road riding. Choose it if your route has dirt tracks, river crossings or mountain trails.",
    bestFor: ["Off-road", "Mountain trails", "Experienced riders"],
    licence: "IDP_OR_A1",
    seoTitle: "Honda CRF150 Rental Saigon | Red Lantern Bikes",
    seoDescription:
      "Rent a Honda CRF150 trail bike in Ho Chi Minh City by the day, week or month. Built for dirt roads and mountain trails. One-way to Hanoi or Da Nang available.",
  },
  "yamaha-wr155r": {
    summary: "A lively dual-sport for riders who want more performance.",
    description:
      "A modern dual-sport with a strong, rev-happy engine. Quick on the road and capable off it, for experienced riders who want a bit more.",
    bestFor: ["Mixed on and off-road", "Experienced riders"],
    licence: "IDP_OR_A1",
    seoTitle: "Yamaha WR155R Rental Saigon | Red Lantern Bikes",
    seoDescription:
      "Rent a Yamaha WR155R dual-sport in Ho Chi Minh City by the day, week or month. Quick on the road and capable off it. One-way to Hanoi or Da Nang available.",
  },
  "kawasaki-versys-x300": {
    summary: "Our biggest bike: a twin-cylinder tourer for the long haul.",
    description:
      "The Versys X300 has the power to cruise highways all day, two-up or loaded with luggage, and it comes with a top box. Our top pick for Saigon to Hanoi in comfort.",
    bestFor: ["Saigon to Hanoi", "Riding two-up", "Highway touring"],
    licence: "A2",
    seoTitle: "Kawasaki Versys X300 Rental Saigon | Red Lantern Bikes",
    seoDescription:
      "Rent a Kawasaki Versys X300 in Ho Chi Minh City by the day, week or month. Perfect for one-way trips to Hanoi or Da Nang. 300cc adventure tourer. Helmet & rack included.",
  },
};

// ─── Facts and specifications on each bike's page ─────────────────────────
// Never guess a specification: a value left out here is simply not shown.
// The quick facts under the name are the engine, gearbox, fuel tank and the
// first "best for" tag; the rest is listed lower on the page.
//
// Sources (November 2026):
// - Engine sizes: the shop.
// - Gearbox type: each model's "kind" in the fleet list.
// - Gears, power, weight, tank, range, brakes, ground clearance: the spec
//   sheets of Style Motorbikes (stylemotorbikes.com: Wave Alpha, GD110,
//   XR150L, CB150X, Versys-X 300) and Tigit Motorbikes' fleet table
//   (tigitmotorbikes.com/bookmotorbike: CRF150, Winner 150, WR155R).
// - EN125, CB125, NVX125, GSX-R150: no reliable source yet (other markets and
//   years disagree), so only the engine size and gearbox type.

export type Gearbox =
  | { type: "automatic" }
  | { type: "semi-automatic"; speeds?: number }
  | { type: "manual"; speeds?: number };

export type Brakes = { front: "disc" | "drum"; rear: "disc" | "drum"; abs?: boolean };

export type BikeFacts = {
  /** Engine size in cc. */
  engineCc?: number;
  gearbox?: Gearbox;
  powerHp?: number;
  /** Ready to ride (curb) weight. */
  weightKg?: number;
  fuelTankL?: number;
  /** Roughly how far a full tank goes. */
  rangeKm?: number;
  brakes?: Brakes;
  groundClearanceMm?: number;
};

export const BIKE_FACTS: Record<string, BikeFacts> = {
  // Style Motorbikes
  "wave-alpha-110": {
    engineCc: 110,
    gearbox: { type: "semi-automatic", speeds: 4 },
    powerHp: 8.3,
    weightKg: 97,
    fuelTankL: 3.7,
    rangeKm: 150,
    brakes: { front: "drum", rear: "drum" },
    groundClearanceMm: 134,
  },
  // Style Motorbikes
  "suzuki-gd110": {
    engineCc: 110,
    gearbox: { type: "manual", speeds: 4 },
    powerHp: 8,
    weightKg: 108,
    fuelTankL: 9.2,
    rangeKm: 300,
    brakes: { front: "drum", rear: "drum" },
    groundClearanceMm: 140,
  },
  "suzuki-en125": { engineCc: 125, gearbox: { type: "manual" } },
  "honda-cb125": { engineCc: 125, gearbox: { type: "manual" } },
  "yamaha-nvx125": { engineCc: 125, gearbox: { type: "automatic" } },
  // Tigit Motorbikes ("Honda Winner 150cc")
  "honda-winner-x-150": {
    engineCc: 150,
    gearbox: { type: "manual", speeds: 6 },
    powerHp: 16.1,
    weightKg: 119,
    fuelTankL: 4.5,
  },
  "suzuki-gsx-r150": { engineCc: 150, gearbox: { type: "manual" } },
  // Style Motorbikes ("Honda XR150L")
  "honda-xr150": {
    engineCc: 150,
    gearbox: { type: "manual", speeds: 5 },
    powerHp: 12.1,
    weightKg: 123,
    fuelTankL: 12,
    rangeKm: 300,
    brakes: { front: "disc", rear: "drum" },
    groundClearanceMm: 245,
  },
  // Style Motorbikes
  "honda-cb150x": {
    engineCc: 150,
    gearbox: { type: "manual", speeds: 6 },
    powerHp: 15.5,
    weightKg: 139,
    fuelTankL: 12,
    rangeKm: 300,
    brakes: { front: "disc", rear: "disc" },
    groundClearanceMm: 181,
  },
  // Tigit Motorbikes ("Honda CRF 150cc")
  "honda-crf150": {
    engineCc: 150,
    gearbox: { type: "manual", speeds: 5 },
    powerHp: 12.75,
    weightKg: 122,
    fuelTankL: 7.2,
  },
  // Tigit Motorbikes ("Yamaha WR 155R")
  "yamaha-wr155r": {
    engineCc: 155,
    gearbox: { type: "manual", speeds: 6 },
    powerHp: 16.5,
    weightKg: 134,
    fuelTankL: 8.1,
  },
  // Style Motorbikes ("Kawasaki Versys-X 300")
  "kawasaki-versys-x300": {
    engineCc: 300,
    gearbox: { type: "manual", speeds: 6 },
    powerHp: 40,
    weightKg: 175,
    fuelTankL: 17,
    rangeKm: 300,
    brakes: { front: "disc", rear: "disc", abs: true },
    groundClearanceMm: 180,
  },
};

// ─── The first photo on each bike's page ──────────────────────────────────
// The best riding photo of the model, from src/content/bike-gallery.json. It
// comes first, then the studio photo, then the others. Models without one
// (or without any photos yet) start with the studio photo.
export const LEAD_PHOTO: Record<string, string> = {
  "wave-alpha-110": "/bikes/gallery/wave-alpha-110-3.webp",
  "suzuki-gd110": "/bikes/gallery/suzuki-gd110-1.webp",
  "suzuki-en125": "/bikes/gallery/suzuki-en125-1.webp",
  "yamaha-nvx125": "/bikes/gallery/yamaha-nvx125-1.webp",
  "honda-winner-x-150": "/bikes/gallery/honda-winner-x-150-1.webp",
  "suzuki-gsx-r150": "/bikes/gallery/suzuki-gsx-r150-2.webp",
  "honda-xr150": "/bikes/gallery/honda-xr150-1.webp",
  "honda-cb150x": "/bikes/gallery/honda-cb150x-1.webp",
  "yamaha-wr155r": "/bikes/gallery/yamaha-wr155r-3.webp",
  "kawasaki-versys-x300": "/bikes/gallery/kawasaki-versys-x300-1.webp",
};

export const LICENCE_TEXT: Record<BikeContent["licence"], string> = {
  IDP_OR_A1:
    "Needs a Vietnamese motorcycle licence, or an International Driving Permit (1949 Geneva Convention) that covers motorbikes.",
  A2: "Over 175cc: Needs a Vietnamese motorcycle licence, or an International Driving Permit (1949 Geneva Convention) that covers motorbikes.",
};
