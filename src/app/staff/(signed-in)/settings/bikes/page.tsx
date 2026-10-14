import { Suspense } from "react";
import { toIsoDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { requireOwner } from "@/server/staff-session";
import { addBikeAction, retireBikeAction, saveBikeAction } from "../actions";
import { Flash } from "../Flash";
import styles from "../../../staff.module.css";

export default function BikeSettingsPage(props: PageProps<"/staff/settings/bikes">) {
  return (
    <Suspense fallback={<p className={styles.muted}>Loading bikes…</p>}>
      <Flash searchParams={props.searchParams} />
      <BikeSettings />
    </Suspense>
  );
}

async function BikeSettings() {
  await requireOwner();
  const [bikes, models] = await Promise.all([
    db.bike.findMany({
      orderBy: [{ status: "asc" }, { model: { sortOrder: "asc" } }, { plate: "asc" }],
      include: { model: { select: { name: true } } },
    }),
    db.bikeModel.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  const placeholders = bikes.filter((b) => b.plate.startsWith("TEMP-")).length;

  return (
    <>
      <section className={styles.panel}>
        <h2>Bikes and plates</h2>
        {placeholders > 0 && (
          <p className={styles.error}>
            {placeholders === 1
              ? "1 bike still has a placeholder plate (TEMP-…)."
              : `${placeholders} bikes still have placeholder plates (TEMP-…).`}{" "}
            Enter the real plates below.
          </p>
        )}
        <p className={styles.muted}>
          Purchase price and date are used for your own records and profit. Retired bikes are never
          offered again but keep their history.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Model</th>
                <th>Plate</th>
                <th>Bought on</th>
                <th>Price paid (VND)</th>
                <th>Notes</th>
                <th />
                <th />
              </tr>
            </thead>
            <tbody>
              {bikes.map((bike) => {
                const formId = `bike-${bike.id}`;
                const retired = bike.status === "RETIRED";
                return (
                  <tr key={bike.id} style={{ opacity: retired ? 0.6 : 1 }}>
                    <td>
                      {bike.model.name}
                      {retired && <span className={styles.badge}> retired</span>}
                      <form id={formId} action={saveBikeAction}>
                        <input type="hidden" name="bikeId" value={bike.id} />
                      </form>
                    </td>
                    <td>
                      <input
                        form={formId}
                        name="plate"
                        defaultValue={bike.plate}
                        className={styles.cellInput}
                        style={{ width: 230 }}
                        required
                      />
                    </td>
                    <td>
                      <input
                        form={formId}
                        type="date"
                        name="acquiredOn"
                        defaultValue={bike.acquiredOn ? toIsoDate(bike.acquiredOn) : ""}
                        className={styles.cellInput}
                      />
                    </td>
                    <td>
                      <input
                        form={formId}
                        type="number"
                        name="purchaseVnd"
                        defaultValue={bike.purchaseVnd ?? ""}
                        min={0}
                        step={100000}
                        className={styles.cellInput}
                      />
                    </td>
                    <td>
                      <input
                        form={formId}
                        name="notes"
                        defaultValue={bike.notes ?? ""}
                        maxLength={500}
                        className={styles.cellInput}
                      />
                    </td>
                    <td>
                      <button form={formId} className={styles.secondary}>
                        Save
                      </button>
                    </td>
                    <td>
                      <form action={retireBikeAction}>
                        <input type="hidden" name="bikeId" value={bike.id} />
                        <input type="hidden" name="retire" value={retired ? "no" : "yes"} />
                        <button className={styles.linkButton}>
                          {retired ? "Bring back" : "Retire"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel}>
        <h2>Add a bike</h2>
        <form
          action={addBikeAction}
          className={`${styles.form} ${styles.row}`}
          style={{ alignItems: "end" }}
        >
          <label className={styles.field}>
            <span>Model</span>
            <select name="modelId" required defaultValue="">
              <option value="" disabled>
                Choose…
              </option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Plate</span>
            <input name="plate" required maxLength={20} />
          </label>
          <div>
            <button className={styles.primary}>Add bike</button>
          </div>
        </form>
      </section>
    </>
  );
}
