import type { RouteStop } from "@/components/RouteLine";

// The one-way route shown on the home and one-way pages. Each note is how long
// the trip usually takes, not the minimum rental (7 days to Da Nang, 12 to
// Hanoi), which is set per route in the staff settings.
export const ONE_WAY_ROUTE: RouteStop[] = [
  {
    city: "Saigon",
    note: "Pick up in District 1",
    detail: "We set the bike up for the long ride, go through the route with you and wave you off.",
  },
  {
    city: "Da Nang",
    note: "10 to 14 days",
    detail:
      "Highlands, Nha Trang's beaches and the coast road. Leave the bike at our drop-off point and fly home or carry on by train.",
    href: "/book?dropoff=DA_NANG",
  },
  {
    city: "Hanoi",
    note: "21 to 30 days",
    detail:
      "The whole country: the Hai Van Pass, Hue, Phong Nha and the karst of the north. Most riders take three to four weeks.",
    href: "/book?dropoff=HANOI",
  },
];
