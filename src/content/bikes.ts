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
};

export const BIKE_CONTENT: Record<string, BikeContent> = {
  "wave-alpha-110": {
    summary: "Light, frugal and easy: the bike most of Vietnam rides.",
    description:
      "The Wave Alpha is Vietnam's everyday workhorse. Four gears and no clutch lever make it easy to learn, it sips fuel, and any mechanic in the country can fix it. Ideal for getting around Saigon or a relaxed trip up the coast.",
    bestFor: ["First-time riders", "City riding", "Budget trips"],
    licence: "IDP_OR_A1",
  },
  "suzuki-gd110": {
    summary: "A simple, classic manual for riders who want a clutch.",
    description:
      "The GD110 is a small, light manual bike with a proper clutch and a comfortable upright seat. Cheap to run and easy to handle, it's a good first manual for a longer trip.",
    bestFor: ["Learning a manual", "Budget trips", "Light luggage"],
    licence: "IDP_OR_A1",
  },
  "suzuki-en125": {
    summary: "A comfortable little manual with a bit more pull.",
    description:
      "The EN125 adds a little more power and a roomier riding position to a simple, reliable manual. A sensible choice for one rider with a backpack heading out of the city.",
    bestFor: ["Solo touring", "Mixed city and highway"],
    licence: "IDP_OR_A1",
  },
  "honda-cb125": {
    summary: "Honda's light, easy-going naked bike.",
    description:
      "A friendly, light manual with Honda reliability. Comfortable enough for long days and nimble enough for traffic.",
    bestFor: ["Solo touring", "Riders new to manual bikes"],
    licence: "IDP_OR_A1",
  },
  "yamaha-nvx125": {
    summary: "An automatic scooter: twist and go.",
    description:
      "No gears at all. The NVX is comfortable, has storage under the seat, and is the easiest way to get around Saigon if you don't want to think about shifting.",
    bestFor: ["City riding", "No gears", "Day trips"],
    licence: "IDP_OR_A1",
  },
  "honda-winner-x-150": {
    summary: "Sporty, quick and light, with a six-speed gearbox.",
    description:
      "The Winner X is light like a scooter but rides like a small sports bike. Plenty of power for highways and passes, while staying easy to park and cheap to run.",
    bestFor: ["Coastal highways", "Riders with some experience"],
    licence: "IDP_OR_A1",
  },
  "suzuki-gsx-r150": {
    summary: "A small sports bike for riders who like to lean.",
    description:
      "Full fairing, a lively engine and sharp handling. Best on good roads and mountain passes, for riders already comfortable with a manual.",
    bestFor: ["Mountain passes", "Experienced riders"],
    licence: "IDP_OR_A1",
  },
  "honda-xr150": {
    summary: "The go-anywhere favourite for the trip up Vietnam.",
    description:
      "Tall suspension, a tough single-cylinder engine and simple mechanics: the XR150 shrugs off potholes, gravel and rain. It's our most-rented bike for the long ride to Hanoi or Da Nang.",
    bestFor: ["Saigon to Hanoi", "Rough roads", "Long trips"],
    licence: "IDP_OR_A1",
  },
  "honda-cb150x": {
    summary: "A light adventure bike with a windscreen and comfortable seat.",
    description:
      "The CB150X brings adventure-bike comfort to a 150cc: a screen to keep the wind off, an upright position and room for luggage. A comfortable choice for the long north–south ride.",
    bestFor: ["Long-distance comfort", "Riding with luggage"],
    licence: "IDP_OR_A1",
  },
  "honda-crf150": {
    summary: "A proper trail bike for dirt roads and the countryside.",
    description:
      "Long-travel suspension and knobbly tyres made for off-road riding. Choose it if your route has dirt tracks, river crossings or mountain trails.",
    bestFor: ["Off-road", "Mountain trails", "Experienced riders"],
    licence: "IDP_OR_A1",
  },
  "yamaha-wr155r": {
    summary: "A lively dual-sport for riders who want more performance.",
    description:
      "A modern dual-sport with a strong, rev-happy engine. Quick on the road and capable off it, for experienced riders who want a bit more.",
    bestFor: ["Mixed on and off-road", "Experienced riders"],
    licence: "IDP_OR_A1",
  },
  "kawasaki-versys-x300": {
    summary: "Our biggest bike: a twin-cylinder tourer for the long haul.",
    description:
      "The Versys X300 has the power to cruise highways all day, two-up or loaded with luggage, and it comes with a top box. Our top pick for Saigon to Hanoi in comfort. Over 175cc, so it needs a full Vietnamese motorcycle licence.",
    bestFor: ["Saigon to Hanoi", "Riding two-up", "Highway touring"],
    licence: "A2",
  },
};

export const LICENCE_TEXT: Record<BikeContent["licence"], string> = {
  IDP_OR_A1:
    "Needs a Vietnamese motorcycle licence, or an International Driving Permit (1949 Geneva Convention) that covers motorbikes.",
  A2: "Over 175cc: needs a full Vietnamese motorcycle licence.",
};
