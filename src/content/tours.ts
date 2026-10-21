// Guided and self-guided tours. No online booking: each tour page has an
// enquiry form that lands in the staff area.
//
// Only The Coco Loop has full details on the old site. Fields left null are
// hidden on the page until they're filled in.

export type Tour = {
  slug: string;
  name: string;
  summary: string;
  description: string[];
  route: string | null;
  duration: string | null;
  groupSize: string | null;
  /** e.g. "From $500" or "$100 a day" */
  priceFrom: string | null;
  highlights: string[];
};

export const TOURS: Tour[] = [
  {
    slug: "the-coco-loop",
    name: "The Coco Loop",
    summary: "Mountains, beaches and coffee country in one big loop from Saigon.",
    description: [
      "Coco's favourite ride: a loop out of Saigon into the cool highlands of Da Lat, down to the beaches of Nha Trang and back along the coast through Phan Thiet.",
      "Expect pine forests and coffee farms, mountain passes with sea views, fresh seafood and quiet coastal roads. We plan the route around your pace and how long you have.",
    ],
    route: "Saigon – Da Lat – Nha Trang – Phan Thiet – Saigon",
    duration: "6 to 10 days",
    groupSize: "1 to 6 riders",
    priceFrom: "From $500",
    highlights: [
      "Da Lat highlands",
      "Mountain passes to the coast",
      "Nha Trang beaches",
      "Phan Thiet sand dunes",
    ],
  },
  {
    slug: "mekong-delta",
    name: "Mekong Delta",
    summary: "Rivers, rice fields and floating markets, a short ride from Saigon.",
    description: [
      "Ride south into the Mekong Delta: small roads between rice paddies and coconut groves, ferry crossings, fruit orchards and early-morning floating markets.",
      "A gentle introduction to riding in Vietnam, with plenty of stops to eat.",
    ],
    route: null,
    duration: "3 to 7 days",
    groupSize: "1 to 6 riders",
    priceFrom: "$100 a day",
    highlights: ["Floating markets", "River ferries", "Village back roads"],
  },
  {
    slug: "ho-chi-minh-loop",
    name: "Hồ Chí Minh Loop",
    summary: "A short loop out of Saigon for riders with a few days.",
    description: [
      "A few days on the road without going far: we'll suggest a loop out of Saigon that matches your time and riding experience, and bring you back to the shop.",
    ],
    route: null,
    duration: null,
    groupSize: "1 to 6 riders",
    priceFrom: null,
    highlights: [],
  },
  {
    slug: "saigon-to-hanoi",
    name: "Hồ Chí Minh to Hà Nội",
    summary: "The big one: the length of Vietnam, from Saigon to Hanoi.",
    description: [
      "Around 2,500 km through the highlands, along the central coast, over the Hai Van Pass and up the Ho Chi Minh Road into the karst country of the north. Most riders take three to four weeks.",
      "Ride it guided, or self-guided on a one-way rental with our route notes and roadside assistance the whole way.",
    ],
    route: "Saigon – Da Lat – Nha Trang – Hoi An – Hue – Phong Nha – Ninh Binh – Hanoi",
    duration: "21 to 30 days",
    groupSize: "1 to 6 riders",
    priceFrom: "$120 a day",
    highlights: ["Da Lat", "Hai Van Pass", "Hoi An and Hue", "Phong Nha caves", "Ninh Binh"],
  },
];

export function findTour(slug: string): Tour | undefined {
  return TOURS.find((t) => t.slug === slug);
}
