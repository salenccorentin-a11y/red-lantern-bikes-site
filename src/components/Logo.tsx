import Image from "next/image";
import Link from "next/link";
import lantern from "../../public/brand/lantern.png";
import styles from "./Logo.module.css";

/** The lantern from the Red Lantern logo, with the name set beside it. */
export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <Link href="/" className={`${styles.logo} ${size === "lg" ? styles.lg : ""}`}>
      <Image src={lantern} alt="" className={styles.mark} priority sizes="40px" />
      <span className={styles.name}>Red Lantern Bikes</span>
    </Link>
  );
}
