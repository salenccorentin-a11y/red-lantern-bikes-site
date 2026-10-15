import type { StaticImageData } from "next/image";
import beach from "../../public/photos/beach.webp";
import karstRoad from "../../public/photos/karst-road.webp";
import riverCrossing from "../../public/photos/river-crossing.webp";
import saigonCity from "../../public/photos/saigon-city.webp";

/** A photo for each tour (by slug), with a description of what it shows. */
export const TOUR_PHOTOS: Record<string, { src: StaticImageData; alt: string; position?: string }> =
  {
    "the-coco-loop": {
      src: beach,
      alt: "A loaded motorbike on a beach by the sea",
      position: "50% 60%",
    },
    // Placeholder until there's a photo from the Mekong Delta itself.
    "mekong-delta": {
      src: riverCrossing,
      alt: "A rider and bike crossing a river on a small boat",
      position: "50% 45%",
    },
    "ho-chi-minh-loop": {
      src: saigonCity,
      alt: "A rider on a scooter in the streets of Saigon",
      position: "50% 40%",
    },
    "saigon-to-hanoi": {
      src: karstRoad,
      alt: "A motorbike on an empty road through the karst mountains",
      position: "50% 70%",
    },
  };
