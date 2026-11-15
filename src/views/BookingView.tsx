// A customer's own booking page, in any language (/booking/<code>,
// /fr/booking/<code>, /ko/booking/<code>). Private: reached only through the
// link in their email, and kept out of search engines.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import styles from "@/app/(booking)/booking/[token]/booking.module.css";
import ui from "@/components/ui.module.css";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import {
  addOnText,
  daysLabel,
  dropoffLabelFor,
  formatDate,
  formatDateTime,
  getMessages,
} from "@/i18n";
import { fill, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";
import { localize } from "@/i18n/paths";
import { toIsoDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { formatUsdApprox, formatVnd } from "@/lib/money";
import { getSettings } from "@/server/availability";
import { releaseExpiredHolds } from "@/server/bookings";

export function bookingMetadata(lang: Locale): Metadata {
  return {
    title: getMessages(lang).booking.metaTitle,
    // Private page: keep it out of search engines.
    robots: { index: false, follow: false },
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function BookingView({ lang, token }: { lang: Locale; token: Promise<string> }) {
  const t = getMessages(lang).booking;
  return (
    <main className={styles.page}>
      <Suspense fallback={<p className={styles.muted}>{t.loading}</p>}>
        <BookingDetails lang={lang} token={token} />
      </Suspense>
    </main>
  );
}

async function BookingDetails(props: { lang: Locale; token: Promise<string> }) {
  const { lang } = props;
  const token = await props.token;
  if (!UUID.test(token)) notFound();
  await connection();

  // Make sure a request that ran out unanswered shows as such.
  await releaseExpiredHolds(db);

  const booking = await db.booking.findUnique({
    where: { viewToken: token },
    include: { bikeModel: true, addOns: { include: { addOn: { select: { slug: true } } } } },
  });
  if (!booking) notFound();
  const settings = await getSettings(db);
  const usd = (vnd: number) => formatUsdApprox(vnd, settings.usdToVndRate);
  const t = getMessages(lang).booking;
  const date = (day: Date) => formatDate(lang, toIsoDate(day));

  return (
    <article className={styles.card}>
      <p className={styles.reference}>{fill(t.reference, { reference: booking.reference })}</p>
      <StatusBanner
        t={t}
        status={booking.status}
        until={booking.holdExpiresAt ? formatDateTime(lang, booking.holdExpiresAt) : null}
      />

      <dl className={styles.grid}>
        <Item label={t.bike} value={booking.bikeModel.name} />
        <Item label={t.dropoff} value={dropoffLabelFor(lang, booking.dropoffCity)} />
        <Item label={t.pickUp} value={date(booking.startDate)} />
        <Item label={t.dropOff} value={date(booking.endDate)} />
      </dl>

      <div className={styles.lines}>
        <Line
          label={fill(t.rental, { days: daysLabel(lang, booking.days) })}
          value={formatVnd(booking.rentalVnd)}
        />
        {booking.oneWayFeeVnd > 0 && (
          <Line label={t.oneWayFee} value={formatVnd(booking.oneWayFeeVnd)} />
        )}
        {booking.addOns.map((a) => (
          <Line
            key={a.id}
            label={addOnText(lang, a.addOn.slug, { name: a.name, description: null }).name}
            value={formatVnd(a.totalVnd)}
          />
        ))}
        <Line
          label={t.total}
          value={formatVnd(booking.totalVnd)}
          sub={usd(booking.totalVnd)}
          strong
        />
        <Line
          label={t.deposit}
          value={formatVnd(booking.depositVnd)}
          sub={usd(booking.depositVnd)}
        />
        <Line label={t.balance} value={formatVnd(booking.balanceVnd)} />
      </div>

      {/* No payment on the site yet: the shop accepts the request, then
          arranges the deposit with the customer directly. */}
      {(booking.status === "EXPIRED" || booking.status === "CANCELLED") && (
        <div className={ui.actions}>
          <Link href={localize(lang, "/book")} className={styles.button}>
            {t.newBooking}
          </Link>
          <WhatsAppLink
            label={getMessages(lang).common.askWhatsApp}
            message={`Hi Red Lantern Bikes! About my booking request ${booking.reference}.`}
          />
        </div>
      )}
    </article>
  );
}

function StatusBanner(props: { t: Messages["booking"]; status: string; until: string | null }) {
  const { t } = props;
  switch (props.status) {
    case "PENDING_PAYMENT":
      return (
        <div className={styles.banner}>
          <h1>{t.heldTitle}</h1>
          <p>{fill(t.heldText, { until: props.until ?? t.heldTomorrow })}</p>
        </div>
      );
    case "CONFIRMED":
    case "CHECKED_OUT":
    case "COMPLETED":
      return (
        <div className={`${styles.banner} ${styles.bannerOk}`}>
          <h1>{t.confirmedTitle}</h1>
          <p>{t.confirmedText}</p>
        </div>
      );
    case "EXPIRED":
      return (
        <div className={`${styles.banner} ${styles.bannerOff}`}>
          <h1>{t.expiredTitle}</h1>
          <p>{t.expiredText}</p>
        </div>
      );
    default:
      return (
        <div className={`${styles.banner} ${styles.bannerOff}`}>
          <h1>{t.cancelledTitle}</h1>
          <p>{t.cancelledText}</p>
        </div>
      );
  }
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Line(props: { label: string; value: string; sub?: string; strong?: boolean }) {
  return (
    <div className={`${styles.line} ${props.strong ? styles.lineStrong : ""}`}>
      <span>{props.label}</span>
      <span>
        {props.value}
        {props.sub && <small>{props.sub}</small>}
      </span>
    </div>
  );
}
