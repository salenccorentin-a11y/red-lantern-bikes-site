import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatDisplayDate, parseIsoDate, toIsoDate, todayInSaigon } from "@/lib/dates";
import { db } from "@/lib/db";
import { formatVnd } from "@/lib/money";
import { netCost } from "@/server/incidents";
import { requireStaff } from "@/server/staff-session";
import { blockAction, incidentAction, liftAction } from "./actions";
import styles from "../../../staff.module.css";

const KINDS: [string, string][] = [
  ["SERVICE", "Service (oil, tyres, chain…)"],
  ["REPAIR", "Repair"],
  ["DAMAGE", "Damage"],
  ["ACCIDENT", "Accident"],
  ["THEFT", "Theft"],
  ["OTHER", "Other"],
];

export default function BikePage(props: PageProps<"/staff/bikes/[id]">) {
  return (
    <Suspense fallback={<p className={styles.muted}>Loading bike…</p>}>
      <Bike params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Bike(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const [{ id }, query] = await Promise.all([props.params, props.searchParams]);
  const today = parseIsoDate(todayInSaigon())!;
  const todayIso = toIsoDate(today);

  const bike = await db.bike.findUnique({
    where: { id },
    include: {
      model: true,
      occupancies: {
        where: { kind: "MAINTENANCE", releasedAt: null, endDate: { gte: today } },
        orderBy: { startDate: "asc" },
      },
      incidents: {
        orderBy: { occurredOn: "desc" },
        take: 50,
        include: { booking: { select: { id: true, reference: true } } },
      },
      bookings: {
        where: { status: { in: ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_OUT", "COMPLETED"] } },
        orderBy: { startDate: "desc" },
        take: 10,
        select: {
          id: true,
          reference: true,
          customerName: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      },
    },
  });
  if (!bike) notFound();

  const linkedBooking = typeof query.booking === "string" ? query.booking : "";
  const totalCost = bike.incidents.reduce((sum, i) => sum + netCost(i), 0);

  return (
    <>
      <p>
        <Link href="/staff/bikes">← Bikes</Link>
      </p>
      <h1>
        {bike.plate} · {bike.model.name}
      </h1>
      {bike.status === "RETIRED" && <p className={styles.badge}>Retired</p>}
      {typeof query.done === "string" && <p className={styles.success}>{query.done}</p>}
      {typeof query.error === "string" && <p className={styles.error}>{query.error}</p>}

      <section className={styles.panel} id="maintenance">
        <h2>Maintenance blocks</h2>
        <p className={styles.muted}>
          A block takes the bike off the booking page and the walk-in form straight away.
        </p>
        {bike.occupancies.length > 0 && (
          <ul>
            {bike.occupancies.map((o) => (
              <li key={o.id}>
                {formatDisplayDate(toIsoDate(o.startDate))} to{" "}
                {formatDisplayDate(toIsoDate(o.endDate))}
                {o.note && ` · ${o.note}`}{" "}
                <form action={liftAction} style={{ display: "inline" }}>
                  <input type="hidden" name="bikeId" value={bike.id} />
                  <input type="hidden" name="occupancyId" value={o.id} />
                  <button className={styles.linkButton}>Lift now</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={blockAction} className={styles.form}>
          <input type="hidden" name="bikeId" value={bike.id} />
          <div className={styles.row}>
            <label className={styles.field}>
              <span>From</span>
              <input type="date" name="startDate" defaultValue={todayIso} required />
            </label>
            <label className={styles.field}>
              <span>Until (included)</span>
              <input type="date" name="endDate" defaultValue={todayIso} required />
            </label>
            <label className={styles.field}>
              <span>Reason</span>
              <input name="note" placeholder="e.g. New chain and sprockets" maxLength={200} />
            </label>
          </div>
          <div>
            <button className={styles.primary}>Block for maintenance</button>
          </div>
        </form>
      </section>

      <section className={styles.panel} id="incident">
        <h2>Incident and repair log</h2>
        <form action={incidentAction} className={styles.form}>
          <input type="hidden" name="bikeId" value={bike.id} />
          <div className={styles.row}>
            <label className={styles.field}>
              <span>What</span>
              <select name="kind" defaultValue={linkedBooking ? "DAMAGE" : "REPAIR"}>
                {KINDS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Date</span>
              <input type="date" name="occurredOn" defaultValue={todayIso} required />
            </label>
            <label className={styles.field}>
              <span>Rental (optional)</span>
              <select name="bookingId" defaultValue={linkedBooking}>
                <option value="">Not during a rental</option>
                {bike.bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.reference} · {b.customerName}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Odometer (km, optional)</span>
              <input type="number" name="odometerKm" min={0} inputMode="numeric" />
            </label>
          </div>
          <label className={styles.field}>
            <span>Description</span>
            <textarea name="description" rows={2} required maxLength={2000} />
          </label>
          <div className={styles.row}>
            <MoneyField name="partsVnd" label="Parts (VND)" />
            <MoneyField name="labourVnd" label="Labour (VND)" />
            <MoneyField name="otherVnd" label="Other costs (VND)" />
            <MoneyField name="recoveredVnd" label="Charged to customer / insurer (VND)" />
          </div>
          <div>
            <button className={styles.primary}>Add to the log</button>
          </div>
        </form>

        {bike.incidents.length > 0 && (
          <div className={styles.tableWrap} style={{ marginTop: 16 }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>What</th>
                  <th>Description</th>
                  <th>Rental</th>
                  <th className={styles.num}>Km</th>
                  <th className={styles.num}>Parts</th>
                  <th className={styles.num}>Labour</th>
                  <th className={styles.num}>Other</th>
                  <th className={styles.num}>Recovered</th>
                  <th className={styles.num}>Net cost</th>
                </tr>
              </thead>
              <tbody>
                {bike.incidents.map((i) => (
                  <tr key={i.id}>
                    <td>{toIsoDate(i.occurredOn)}</td>
                    <td>{i.kind.toLowerCase()}</td>
                    <td style={{ whiteSpace: "normal", minWidth: 200 }}>{i.description}</td>
                    <td>
                      {i.booking && (
                        <Link href={`/staff/bookings/${i.booking.id}`}>{i.booking.reference}</Link>
                      )}
                    </td>
                    <td className={styles.num}>{i.odometerKm?.toLocaleString("en-US") ?? ""}</td>
                    <td className={styles.num}>{formatVnd(i.partsVnd)}</td>
                    <td className={styles.num}>{formatVnd(i.labourVnd)}</td>
                    <td className={styles.num}>{formatVnd(i.otherVnd)}</td>
                    <td className={styles.num}>{formatVnd(i.recoveredVnd)}</td>
                    <td className={styles.num}>{formatVnd(netCost(i))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={9}>Total (last {bike.incidents.length} entries)</th>
                  <th className={styles.num}>{formatVnd(totalCost)}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <section className={styles.panel}>
        <h2>Recent bookings</h2>
        {bike.bookings.length === 0 ? (
          <p className={styles.muted}>None yet.</p>
        ) : (
          <ul>
            {bike.bookings.map((b) => (
              <li key={b.id}>
                <Link href={`/staff/bookings/${b.id}`}>{b.reference}</Link> · {b.customerName} ·{" "}
                {toIsoDate(b.startDate)} to {toIsoDate(b.endDate)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function MoneyField({ name, label }: { name: string; label: string }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input type="number" name={name} min={0} step={1000} inputMode="numeric" placeholder="0" />
    </label>
  );
}
