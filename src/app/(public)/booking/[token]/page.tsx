import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { dropoffLabel } from "@/lib/cities";
import { formatDisplayDate, formatSaigonDateTime, toIsoDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { formatUsdApprox, formatVnd } from "@/lib/money";
import { getSettings } from "@/server/availability";
import { releaseExpiredHolds } from "@/server/bookings";
import styles from "./booking.module.css";

export const metadata: Metadata = {
  title: "Your booking | Red Lantern Bikes",
  // Private page: keep it out of search engines.
  robots: { index: false, follow: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function BookingPage(props: PageProps<"/booking/[token]">) {
  return (
    <>
      <main className={styles.page}>
        <Suspense fallback={<p className={styles.muted}>Loading your booking…</p>}>
          <BookingDetails params={props.params} />
        </Suspense>
      </main>
    </>
  );
}

async function BookingDetails({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!UUID.test(token)) notFound();
  await connection();

  // Make sure an unpaid hold that has run out shows as expired.
  await releaseExpiredHolds(db);

  const booking = await db.booking.findUnique({
    where: { viewToken: token },
    include: { bikeModel: true, addOns: true },
  });
  if (!booking) notFound();
  const settings = await getSettings(db);
  const usd = (vnd: number) => formatUsdApprox(vnd, settings.usdToVndRate);

  return (
    <article className={styles.card}>
      <p className={styles.reference}>Booking {booking.reference}</p>
      <StatusBanner status={booking.status} holdExpiresAt={booking.holdExpiresAt} />

      <dl className={styles.grid}>
        <Item label="Bike" value={booking.bikeModel.name} />
        <Item label="Drop-off" value={dropoffLabel(booking.dropoffCity)} />
        <Item label="Pick up in Saigon" value={formatDisplayDate(toIsoDate(booking.startDate))} />
        <Item label="Drop off" value={formatDisplayDate(toIsoDate(booking.endDate))} />
      </dl>

      <div className={styles.lines}>
        <Line
          label={`Rental, ${booking.days} day${booking.days === 1 ? "" : "s"}`}
          value={formatVnd(booking.rentalVnd)}
        />
        {booking.oneWayFeeVnd > 0 && (
          <Line label="One-way fee" value={formatVnd(booking.oneWayFeeVnd)} />
        )}
        {booking.addOns.map((a) => (
          <Line key={a.id} label={a.name} value={formatVnd(a.totalVnd)} />
        ))}
        <Line
          label="Total"
          value={formatVnd(booking.totalVnd)}
          sub={usd(booking.totalVnd)}
          strong
        />
        <Line
          label="Deposit, non-refundable"
          value={formatVnd(booking.depositVnd)}
          sub={usd(booking.depositVnd)}
        />
        <Line label="Balance at pick-up" value={formatVnd(booking.balanceVnd)} />
      </div>

      {booking.status === "PENDING_PAYMENT" && (
        <section className={styles.payment} aria-labelledby="pay-heading">
          <h2 id="pay-heading">Pay your deposit: {formatVnd(booking.depositVnd)}</h2>
          <p>
            Use reference <strong>{booking.reference}</strong> with your payment.
          </p>
          {/* Placeholder until the payment step: Vietcombank and e-wallet details aren't set up yet. */}
          <p className={styles.placeholder}>
            Bank transfer and e-wallet QR codes will appear here. (Placeholder: payment details not
            set up yet.)
          </p>
        </section>
      )}

      {(booking.status === "EXPIRED" || booking.status === "CANCELLED") && (
        <p>
          <Link href="/book" className={styles.button}>
            Make a new booking
          </Link>
        </p>
      )}
    </article>
  );
}

function StatusBanner({ status, holdExpiresAt }: { status: string; holdExpiresAt: Date | null }) {
  switch (status) {
    case "PENDING_PAYMENT":
      return (
        <div className={styles.banner}>
          <h1>Your bike is held</h1>
          <p>
            We&apos;ll keep it for you until{" "}
            <strong>{holdExpiresAt ? formatSaigonDateTime(holdExpiresAt) : "tomorrow"}</strong>{" "}
            (Saigon time) while your deposit arrives. We&apos;ve emailed you these details.
          </p>
        </div>
      );
    case "CONFIRMED":
    case "CHECKED_OUT":
    case "COMPLETED":
      return (
        <div className={`${styles.banner} ${styles.bannerOk}`}>
          <h1>Your booking is confirmed</h1>
          <p>We&apos;ve received your deposit. See you at the shop in District 1.</p>
        </div>
      );
    case "EXPIRED":
      return (
        <div className={`${styles.banner} ${styles.bannerOff}`}>
          <h1>This hold has expired</h1>
          <p>The deposit didn&apos;t arrive in time, so the bike was released.</p>
        </div>
      );
    default:
      return (
        <div className={`${styles.banner} ${styles.bannerOff}`}>
          <h1>This booking was cancelled</h1>
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
