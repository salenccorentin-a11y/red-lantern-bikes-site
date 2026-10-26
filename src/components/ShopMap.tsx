import { BUSINESS } from "@/content/business";
import styles from "./ShopMap.module.css";

// A Google map pinned on the shop's address. Loads only when scrolled near,
// so it doesn't slow the page down. No API key needed for this embed.
export function ShopMap() {
  // Searching the name with the address finds the shop's own Google listing.
  const query = `${BUSINESS.name}, ${BUSINESS.mapsQuery}`;
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
  return (
    <iframe
      src={src}
      title={`Map: ${BUSINESS.name}, ${BUSINESS.mapsQuery}`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={styles.map}
    />
  );
}
