import Link from "next/link";
import { ADDRESS_LINE, BUSINESS, mapsLink, whatsappLink } from "@/content/business";
import { getMessages, hoursFor } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { localize } from "@/i18n/paths";
import { Logo } from "./Logo";
import styles from "./SiteFooter.module.css";

export function SiteFooter({ lang = "en" }: { lang?: Locale }) {
  const t = getMessages(lang).footer;
  const to = (href: string) => localize(lang, href);
  const whatsapp = whatsappLink();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.shop}>
          <Logo size="lg" href={to("/")} />
          <p className={styles.address}>
            {ADDRESS_LINE}
            <br />
            {hoursFor(lang)}
          </p>
          <a href={mapsLink()} target="_blank" rel="noopener" className={styles.mapLink}>
            {t.openMaps}
          </a>
        </div>

        <nav aria-label={t.rideWithUs}>
          <p className={styles.heading}>{t.rideWithUs}</p>
          <ul>
            <li>
              <Link href={to("/bikes")}>{t.ourBikes}</Link>
            </li>
            <li>
              <Link href={to("/one-way")}>{t.oneWay}</Link>
            </li>
            <li>
              <Link href="/blog">{t.guides}</Link>
            </li>
            <li>
              <Link href={to("/faq")}>{t.faq}</Link>
            </li>
            <li>
              <Link href="/about">{t.about}</Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className={styles.heading}>{t.getInTouch}</p>
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
              <Link href={to("/contact")}>{t.sendMessage}</Link>
            </li>
          </ul>
          <ul className={styles.social} aria-label={t.social}>
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
        <Link href="/terms">{t.terms}</Link>
        <Link href="/privacy">{t.privacy}</Link>
      </div>
    </footer>
  );
}
