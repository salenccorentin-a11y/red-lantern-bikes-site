import Link from "next/link";
import { ADDRESS_LINE, BUSINESS, mapsLink, whatsappLink } from "@/content/business";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  const whatsapp = whatsappLink();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <p className={styles.brand}>{BUSINESS.name}</p>
          <p>{ADDRESS_LINE}</p>
          <p>{BUSINESS.hours}</p>
          <p>
            <a href={mapsLink()} target="_blank" rel="noopener">
              Open in Google Maps
            </a>
          </p>
        </div>

        <div>
          <p className={styles.heading}>Get in touch</p>
          {whatsapp && (
            <p>
              <a href={whatsapp}>WhatsApp</a>
            </p>
          )}
          {BUSINESS.phone && (
            <p>
              <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`}>{BUSINESS.phone}</a>
            </p>
          )}
          {BUSINESS.email && (
            <p>
              <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
            </p>
          )}
          <p>
            <Link href="/contact">Send us a message</Link>
          </p>
          <p className={styles.social}>
            {Object.entries(BUSINESS.social).map(([name, url]) =>
              url ? (
                <a key={name} href={url} target="_blank" rel="noopener">
                  {name[0].toUpperCase() + name.slice(1)}
                </a>
              ) : null,
            )}
          </p>
        </div>

        <div>
          <p className={styles.heading}>Ride with us</p>
          <p>
            <Link href="/bikes">Our bikes</Link>
          </p>
          <p>
            <Link href="/one-way">One-way to Hanoi and Da Nang</Link>
          </p>
          <p>
            <Link href="/tours">Tours</Link>
          </p>
          <p>
            <Link href="/about">About us</Link>
          </p>
          <p>
            <Link href="/faq">FAQ</Link>
          </p>
          <p>
            <Link href="/blog">Travel guides</Link>
          </p>
        </div>
      </div>
      <div className={styles.legal}>
        <span>© {BUSINESS.name}</span>
        <Link href="/terms">Rental terms</Link>
        <Link href="/privacy">Privacy</Link>
      </div>
    </footer>
  );
}
