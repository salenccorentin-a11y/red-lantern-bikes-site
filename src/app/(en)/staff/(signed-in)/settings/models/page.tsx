import Link from "next/link";
import { Suspense } from "react";
import { BIKE_CONTENT } from "@/content/bikes";
import { db } from "@/lib/db";
import { requireOwner } from "@/server/staff-session";
import { createModelAction, deleteModelAction } from "../actions";
import { ConfirmButton } from "../ConfirmButton";
import { Flash } from "../Flash";
import styles from "../../../staff.module.css";

export default function ModelSettingsPage(props: PageProps<"/staff/settings/models">) {
  return (
    <Suspense fallback={<p className={styles.muted}>Loading models…</p>}>
      <Flash searchParams={props.searchParams} />
      <ModelSettings />
    </Suspense>
  );
}

async function ModelSettings() {
  await requireOwner();
  const models = await db.bikeModel.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { bookings: true } },
      bikes: { where: { status: "ACTIVE" }, select: { id: true } },
    },
  });
  const allBikes = await db.bike.groupBy({ by: ["modelId"], _count: true });
  const bikeCount = (modelId: string) => allBikes.find((b) => b.modelId === modelId)?._count ?? 0;

  return (
    <>
      <section className={styles.panel}>
        <h2>Bike models</h2>
        <p className={styles.muted}>
          A model is a kind of bike customers can choose (e.g. Honda XR150). Change prices and
          whether it&apos;s on sale under <Link href="/staff/settings">Business and prices</Link>;
          add or retire its bikes under <Link href="/staff/settings/bikes">Bikes and plates</Link>.
          Delete is only offered for a model with no bikes and no bookings.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Model</th>
                <th>Type</th>
                <th>Bikes in the fleet</th>
                <th>On sale</th>
                <th>Page</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {models.map((m) => {
                const canDelete = bikeCount(m.id) === 0 && m._count.bookings === 0;
                return (
                  <tr key={m.id}>
                    <td>
                      {m.name}
                      {!BIKE_CONTENT[m.slug] && !m.summary && (
                        <span className={styles.badge}> no text</span>
                      )}
                    </td>
                    <td>{m.kind}</td>
                    <td>{m.bikes.length}</td>
                    <td>{m.active ? "Yes" : "No"}</td>
                    <td>
                      {m.active ? (
                        <Link href={`/bikes/${m.slug}`} target="_blank">
                          /bikes/{m.slug}
                        </Link>
                      ) : (
                        <span className={styles.muted}>hidden</span>
                      )}
                    </td>
                    <td>
                      {canDelete && (
                        <form action={deleteModelAction}>
                          <input type="hidden" name="modelId" value={m.id} />
                          <input type="hidden" name="modelName" value={m.name} />
                          <ConfirmButton
                            className={styles.linkButton}
                            message={`Delete ${m.name} for good? This can't be undone.`}
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
      </section>

      <section className={styles.panel}>
        <h2>Add a model</h2>
        <p className={styles.muted}>
          Prices are per day in VND. The 3-week and 45-day prices can wait: until you fill them in,
          the weekly and monthly prices carry on. Leave a one-way fee empty if this model can&apos;t
          do that trip. The model&apos;s page shows the Red Lantern logo until we add its photos,
          and its text in English on the French and Korean pages too.
        </p>
        <form action={createModelAction} className={styles.form}>
          <div className={styles.row}>
            <Field name="name" label="Name, e.g. Honda Wave RSX 110" required maxLength={60} />
            <Field
              name="kind"
              label="Type, e.g. Semi-automatic, Manual dual-sport"
              required
              maxLength={40}
            />
            <label className={styles.field}>
              <span>Licence needed</span>
              <select name="licence" required defaultValue="IDP_OR_A1">
                <option value="IDP_OR_A1">IDP or A1 (most bikes)</option>
                <option value="A2">A2 (bigger bikes)</option>
              </select>
            </label>
          </div>
          <div className={styles.row}>
            <Price name="dailyRate" label="Daily" required />
            <Price name="weeklyRate" label="Weekly (7+ days)" required />
            <Price name="threeWeekRate" label="3 weeks (21+ days)" />
            <Price name="monthlyRate" label="Monthly (30+ days)" required />
            <Price name="fortyFiveDayRate" label="45 days (45+ days)" />
          </div>
          <div className={styles.row}>
            <Price name="hanoiFee" label="One-way fee to Hanoi" />
            <Price name="daNangFee" label="One-way fee to Da Nang" />
          </div>
          <Field
            name="summary"
            label="One line for the bike card, e.g. Light and easy, the bike most of Vietnam rides."
            required
            maxLength={140}
          />
          <label className={styles.field}>
            <span>A short paragraph for the bike&apos;s page</span>
            <textarea name="description" required rows={4} maxLength={800} />
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" name="active" defaultChecked /> On sale straight away
          </label>
          <div>
            <button className={styles.primary}>Add model</button>
          </div>
        </form>
      </section>
    </>
  );
}

function Field(props: { name: string; label: string; required?: boolean; maxLength?: number }) {
  return (
    <label className={styles.field}>
      <span>{props.label}</span>
      <input name={props.name} required={props.required} maxLength={props.maxLength} />
    </label>
  );
}

function Price(props: { name: string; label: string; required?: boolean }) {
  return (
    <label className={styles.field}>
      <span>
        {props.label}
        {!props.required && " (optional)"}
      </span>
      <input type="number" name={props.name} min={0} step={1000} required={props.required} />
    </label>
  );
}
