import type { StaticImageData } from "next/image";
import beach from "../../public/photos/beach.webp";
import karstRoad from "../../public/photos/karst-road.webp";
import mekongCanal from "../../public/photos/mekong-canal.webp";
import saigonCity from "../../public/photos/saigon-city.webp";

/** A photo for each tour (by slug), with a description of what it shows. */
export const TOUR_PHOTOS: Record<string, { src: StaticImageData; alt: string; position?: string }> =
  {
    "the-coco-loop": {
      src: beach,
      alt: "A loaded motorbike on a beach by the sea",
      position: "50% 60%",
    },
    "mekong-delta": {
      src: mekongCanal,
      alt: "A rower in a conical hat taking a small boat down a Mekong Delta canal",
      position: "50% 55%",
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
