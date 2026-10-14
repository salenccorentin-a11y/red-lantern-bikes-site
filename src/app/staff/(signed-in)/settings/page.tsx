import { Suspense } from "react";
import { db } from "@/lib/db";
import { getSettings } from "@/server/availability";
import { requireOwner } from "@/server/staff-session";
import { saveModelAction, saveSiteSettingsAction } from "./actions";
import { Flash } from "./Flash";
import styles from "../../staff.module.css";

export default function BusinessSettingsPage(props: PageProps<"/staff/settings">) {
  return (
    <Suspense fallback={<p className={styles.muted}>Loading settings…</p>}>
      <Flash searchParams={props.searchParams} />
      <BusinessSettings />
    </Suspense>
  );
}

async function BusinessSettings() {
  await requireOwner();
  const [settings, models, routes] = await Promise.all([
    getSettings(db),
    db.bikeModel.findMany({ orderBy: { sortOrder: "asc" }, include: { routeFees: true } }),
    db.route.findMany({
      where: { fromCity: "SAIGON", bookableOnline: true },
      orderBy: { minDays: "desc" },
    }),
  ]);

  return (
    <>
      <section className={styles.panel}>
        <h2>Business settings</h2>
        <form action={saveSiteSettingsAction} className={styles.form}>
          <div className={styles.row}>
            <Num
              name="depositVnd"
              label="Online deposit (VND)"
              value={settings.depositVnd}
              step={10000}
            />
            <Num
              name="cleaningGapDays"
              label="Days between rentals for cleaning"
              value={settings.cleaningGapDays}
            />
            <Num
              name="holdHours"
              label="Hours to hold an unpaid booking"
              value={settings.holdHours}
            />
            <Num
              name="usdToVndRate"
              label="VND per US dollar (for the ≈ $ hint)"
              value={settings.usdToVndRate}
              step={100}
            />
          </div>
          <div>
            <button className={styles.primary}>Save settings</button>
          </div>
        </form>
      </section>

      <section className={styles.panel}>
        <h2>Prices per model</h2>
        <p className={styles.muted}>
          Prices per day in VND. Weekly applies from 7 days, monthly from 30. Leave a one-way fee
          empty to stop offering that model on that route. Changes apply to new bookings only.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Model</th>
                <th>Daily</th>
                <th>Weekly</th>
                <th>Monthly</th>
                {routes.map((r) => (
                  <th key={r.id}>One-way to {r.toCity === "HANOI" ? "Hanoi" : "Da Nang"}</th>
                ))}
                <th>On sale</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {models.map((m) => {
                const formId = `model-${m.id}`;
                return (
                  <tr key={m.id}>
                    <td>
                      {m.name}
                      <form id={formId} action={saveModelAction}>
                        <input type="hidden" name="modelId" value={m.id} />
                        <input type="hidden" name="modelName" value={m.name} />
                      </form>
                    </td>
                    <td>
                      <CellNum form={formId} name="dailyRate" value={m.dailyRate} />
                    </td>
                    <td>
                      <CellNum form={formId} name="weeklyRate" value={m.weeklyRate} />
                    </td>
                    <td>
                      <CellNum form={formId} name="monthlyRate" value={m.monthlyRate} />
                    </td>
                    {routes.map((r) => (
                      <td key={r.id}>
                        <CellNum
                          form={formId}
                          name={`fee:${r.id}`}
                          value={m.routeFees.find((f) => f.routeId === r.id)?.fee}
                        />
                      </td>
                    ))}
                    <td>
                      <input
                        form={formId}
                        type="checkbox"
                        name="active"
                        defaultChecked={m.active}
                      />
                    </td>
                    <td>
                      <button form={formId} className={styles.secondary}>
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Num(props: { name: string; label: string; value: number; step?: number }) {
  return (
    <label className={styles.field}>
      <span>{props.label}</span>
      <input
        type="number"
        name={props.name}
        defaultValue={props.value}
        min={0}
        step={props.step ?? 1}
        required
      />
    </label>
  );
}

function CellNum(props: { form: string; name: string; value?: number }) {
  return (
    <input
      form={props.form}
      type="number"
      name={props.name}
      defaultValue={props.value}
      min={0}
      step={1000}
      className={styles.cellInput}
      aria-label={props.name}
    />
  );
}
