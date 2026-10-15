import Link from "next/link";
import { ADDRESS_LINE, BUSINESS, mapsLink, whatsappLink } from "@/content/business";
import { Logo } from "./Logo";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  const whatsapp = whatsappLink();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.shop}>
          <Logo size="lg" />
          <p className={styles.address}>
            {ADDRESS_LINE}
            <br />
            {BUSINESS.hours}
          </p>
          <a href={mapsLink()} target="_blank" rel="noopener" className={styles.mapLink}>
            Open in Google Maps
          </a>
        </div>

        <nav aria-label="Ride with us">
          <p className={styles.heading}>Ride with us</p>
          <ul>
            <li>
              <Link href="/bikes">Our bikes</Link>
            </li>
            <li>
              <Link href="/one-way">One-way to Hanoi and Da Nang</Link>
            </li>
            <li>
              <Link href="/tours">Tours</Link>
            </li>
            <li>
              <Link href="/blog">Travel guides</Link>
            </li>
            <li>
              <Link href="/faq">FAQ</Link>
            </li>
            <li>
              <Link href="/about">About us</Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className={styles.heading}>Get in touch</p>
          <ul>
            {whatsapp && (
              <li>
                <a href={whatsapp}>WhatsApp</a>
              </li>
            )}
            {BUSINESS.phone && (
              <li>
                <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`}>{BUSINESS.phone}</a>
              </li>
            )}
            {BUSINESS.email && (
              <li>
                <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
              </li>
            )}
            <li>
              <Link href="/contact">Send us a message</Link>
            </li>
          </ul>
          <ul className={styles.social} aria-label="Social media">
            {Object.entries(BUSINESS.social).map(([name, url]) =>
              url ? (
                <li key={name}>
                  <a href={url} target="_blank" rel="noopener">
                    {name[0].toUpperCase() + name.slice(1)}
                  </a>
                </li>
              ) : null,
            )}
          </ul>
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
