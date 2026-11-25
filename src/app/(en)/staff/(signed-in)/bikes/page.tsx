import Link from "next/link";
import { Suspense } from "react";
import { parseIsoDate, todayInSaigon } from "@/lib/dates";
import { db } from "@/lib/db";
import { overlapping } from "@/server/availability";
import { requireStaff } from "@/server/staff-session";
import styles from "../../staff.module.css";

export default function BikesPage() {
  return (
    <>
      <h1>Bikes</h1>
      <Suspense fallback={<p className={styles.muted}>Loading bikes…</p>}>
        <BikeList />
      </Suspense>
    </>
  );
}

const NOW_LABEL: Record<string, string> = {
  BOOKING: "Booked",
  MAINTENANCE: "Maintenance",
  TRANSIT: "On the train back",
};

async function BikeList() {
  await requireStaff();
  const today = parseIsoDate(todayInSaigon())!;
  const bikes = await db.bike.findMany({
    orderBy: [{ status: "asc" }, { model: { sortOrder: "asc" } }, { plate: "asc" }],
    include: {
      model: { select: { name: true } },
      occupancies: { where: overlapping(today, today), include: { booking: true } },
    },
  });

  return (
    <div className={`${styles.panel} ${styles.tableWrap}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Model</th>
            <th>Today</th>
            <th>Plate</th>
          </tr>
        </thead>
        <tbody>
          {bikes.map((bike) => {
            const now = bike.occupancies[0];
            return (
              <tr key={bike.id}>
                <td>
                  <Link href={`/staff/bikes/${bike.id}`}>
                    <b>{bike.model.name}</b>
                  </Link>
                </td>
                <td>
                  {bike.status === "RETIRED" ? (
                    <span className={styles.badge}>Retired</span>
                  ) : now ? (
                    <>
                      {now.kind === "BOOKING" && now.booking?.status === "CHECKED_OUT"
                        ? "Out with customer"
                        : NOW_LABEL[now.kind]}
                      {now.booking && ` · ${now.booking.customerName}`}
                    </>
                  ) : (
                    <span className={styles.success}>In the shop</span>
                  )}
                </td>
                <td className={styles.muted}>{bike.plate}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
