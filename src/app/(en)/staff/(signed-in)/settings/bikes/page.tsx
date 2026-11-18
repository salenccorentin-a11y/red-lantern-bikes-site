import Link from "next/link";
import { Suspense } from "react";
import { toIsoDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { requireOwner } from "@/server/staff-session";
import { addBikesAction, deleteBikeAction, retireBikeAction, saveBikeAction } from "../actions";
import { ConfirmButton } from "../ConfirmButton";
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
      orderBy: [{ status: "asc" }, { plate: "asc" }],
      include: {
        _count: { select: { bookings: true, occupancies: true, incidents: true } },
      },
    }),
    db.bikeModel.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, active: true },
    }),
  ]);
  const placeholders = bikes.filter((b) => b.plate.startsWith("TEMP-")).length;
  const inFleet = bikes.filter((b) => b.status === "ACTIVE").length;

  return (
    <>
      <section className={styles.panel}>
        <h2>Add bikes</h2>
        <p className={styles.muted}>
          Choose the model, then type the plates: one per line to add several bikes at once. A new
          kind of bike? <Link href="/staff/settings/models">Add the model first</Link>.
        </p>
        <form action={addBikesAction} className={styles.form}>
          <div className={styles.row} style={{ alignItems: "start" }}>
            <label className={styles.field}>
              <span>Model</span>
              <select name="modelId" required defaultValue="">
                <option value="" disabled>
                  Choose…
                </option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.active ? "" : " (not on sale)"}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Plates, one per line</span>
              <textarea
                name="plates"
                required
                rows={3}
                placeholder={"59-X1 123.45\n59-X1 678.90"}
              />
            </label>
            <label className={styles.field}>
              <span>Bought on (optional)</span>
              <input type="date" name="acquiredOn" />
            </label>
            <label className={styles.field}>
              <span>Price paid per bike, VND (optional)</span>
              <input type="number" name="purchaseVnd" min={0} step={100000} />
            </label>
          </div>
          <div>
            <button className={styles.primary}>Add bikes</button>
          </div>
        </form>
      </section>

      <section className={styles.panel}>
        <h2>
          The fleet: {inFleet} {inFleet === 1 ? "bike" : "bikes"}
        </h2>
        {placeholders > 0 && (
          <p className={styles.error}>
            {placeholders === 1
              ? "1 bike still has a placeholder plate (TEMP-…)."
              : `${placeholders} bikes still have placeholder plates (TEMP-…).`}{" "}
            Enter the real plates below.
          </p>
        )}
        <p className={styles.muted}>
          To take a bike out of the fleet, <b>Retire</b> it: it&apos;s never offered again and keeps
          its bookings and repair history. <b>Delete</b> only shows for a bike with no history, e.g.
          one added by mistake. Purchase price and date are for your profit page.
        </p>
        {models.map((model) => {
          const ofModel = bikes.filter((b) => b.modelId === model.id);
          if (ofModel.length === 0) return null;
          const active = ofModel.filter((b) => b.status === "ACTIVE").length;
          return (
            <div key={model.id} style={{ marginTop: 24 }}>
              <h3 style={{ margin: "0 0 8px" }}>
                {model.name}{" "}
                <span className={styles.muted} style={{ fontWeight: 400 }}>
                  · {active} in the fleet
                  {model.active ? "" : " · model not on sale"}
                </span>
              </h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Plate</th>
                      <th>Bought on</th>
                      <th>Price paid (VND)</th>
                      <th>Notes</th>
                      <th />
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {ofModel.map((bike) => {
                      const formId = `bike-${bike.id}`;
                      const retired = bike.status === "RETIRED";
                      const { bookings, occupancies, incidents } = bike._count;
                      const noHistory = bookings + occupancies + incidents === 0;
                      return (
                        <tr key={bike.id} style={{ opacity: retired ? 0.6 : 1 }}>
                          <td>
                            <form id={formId} action={saveBikeAction}>
                              <input type="hidden" name="bikeId" value={bike.id} />
                            </form>
                            <input
                              form={formId}
                              name="plate"
                              defaultValue={bike.plate}
                              className={styles.cellInput}
                              style={{ width: 200 }}
                              aria-label="Plate"
                              required
                            />
                            {retired && <span className={styles.badge}> retired</span>}
                          </td>
                          <td>
                            <input
                              form={formId}
                              type="date"
                              name="acquiredOn"
                              defaultValue={bike.acquiredOn ? toIsoDate(bike.acquiredOn) : ""}
                              className={styles.cellInput}
                              aria-label="Bought on"
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
                              aria-label="Price paid"
                            />
                          </td>
                          <td>
                            <input
                              form={formId}
                              name="notes"
                              defaultValue={bike.notes ?? ""}
                              maxLength={500}
                              className={styles.cellInput}
                              aria-label="Notes"
                            />
                          </td>
                          <td>
                            <button form={formId} className={styles.secondary}>
                              Save
                            </button>
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            <form action={retireBikeAction} style={{ display: "inline" }}>
                              <input type="hidden" name="bikeId" value={bike.id} />
                              <input type="hidden" name="retire" value={retired ? "no" : "yes"} />
                              <button className={styles.linkButton}>
                                {retired ? "Bring back" : "Retire"}
                              </button>
                            </form>
                            {noHistory && (
                              <form action={deleteBikeAction} style={{ display: "inline" }}>
                                <input type="hidden" name="bikeId" value={bike.id} />
                                <input type="hidden" name="plate" value={bike.plate} />
                                {" · "}
                                <ConfirmButton
                                  className={styles.linkButton}
                                  message={`Delete ${bike.plate} for good? This can't be undone.`}
                                >
                                  Delete
                                </ConfirmButton>
                              </form>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
