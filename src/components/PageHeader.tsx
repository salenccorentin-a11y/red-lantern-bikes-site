import Image, { type StaticImageData } from "next/image";
import styles from "./PageHeader.module.css";

/**
 * The night band that opens content pages: title, one line of intro, and
 * optionally one of our riding photos behind it.
 */
export function PageHeader(props: {
  title: string;
  intro?: React.ReactNode;
  photo?: { src: string | StaticImageData; alt: string; position?: string };
  children?: React.ReactNode;
}) {
  return (
    <header className={`${styles.band} ${props.photo ? styles.withPhoto : ""}`}>
      {props.photo && (
        <Image
          src={props.photo.src}
          alt={props.photo.alt}
          fill
          priority
          sizes="100vw"
          className={styles.photo}
          style={{ objectPosition: props.photo.position ?? "center" }}
        />
      )}
      <div className={styles.inner}>
        <h1 className={styles.title}>{props.title}</h1>
        {props.intro && <p className={styles.intro}>{props.intro}</p>}
        {props.children}
      </div>
    </header>
  );
}
