import Image from "next/image";
import r1 from "../../public/photos/riders/rider-1.webp";
import r2 from "../../public/photos/riders/rider-2.webp";
import r3 from "../../public/photos/riders/rider-3.webp";
import r4 from "../../public/photos/riders/rider-4.webp";
import r5 from "../../public/photos/riders/rider-5.webp";
import r6 from "../../public/photos/riders/rider-6.webp";
import r7 from "../../public/photos/riders/rider-7.webp";
import r8 from "../../public/photos/riders/rider-8.webp";
import r9 from "../../public/photos/riders/rider-9.webp";
import styles from "./RiderWall.module.css";

// Customers who agreed to appear on the site (scripts/brand/prepare-photos.cjs).
// Nine photos: on wide screens the big first one plus eight fill three full rows.
const RIDERS = [r6, r1, r2, r3, r4, r5, r7, r8, r9];

export function RiderWall() {
  return (
    <ul className={styles.wall}>
      {RIDERS.map((photo, i) => (
        <li key={i} className={styles.tile}>
          <Image
            src={photo}
            alt="Riders with their Red Lantern bikes outside the shop in District 1"
            placeholder="blur"
            sizes={i === 0 ? "(max-width: 760px) 100vw, 50vw" : "(max-width: 760px) 50vw, 25vw"}
            className={styles.photo}
          />
        </li>
      ))}
    </ul>
  );
}
