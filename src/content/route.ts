import type { RouteStop } from "@/components/RouteLine";

// The one-way route shown on the home and one-way pages. Minimum days match
// the routes in the database (staff settings); update both together.
export const ONE_WAY_ROUTE: RouteStop[] = [
  {
    city: "Saigon",
    note: "Pick up in District 1",
    detail: "We set the bike up for the long ride, go through the route with you and wave you off.",
  },
  {
    city: "Da Nang",
    note: "7 days or more",
    detail:
      "Highlands, Nha Trang's beaches and the coast road. Leave the bike at our drop-off point and fly home or carry on by train.",
    href: "/book?dropoff=DA_NANG",
  },
  {
    city: "Hanoi",
    note: "12 days or more",
    detail:
      "The whole country: the Hai Van Pass, Hue, Phong Nha and the karst of the north. Most riders take three to four weeks.",
    href: "/book?dropoff=HANOI",
  },
];
