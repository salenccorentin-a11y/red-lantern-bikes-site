import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireOwner } from "@/server/staff-session";
import { saveAddOnAction } from "../actions";
import { Flash } from "../Flash";
import styles from "../../../staff.module.css";

export default function AddOnsPage(props: PageProps<"/staff/settings/add-ons">) {
  return (
    <Suspense fallback={<p className={styles.muted}>Loading add-ons…</p>}>
      <Flash searchParams={props.searchParams} />
      <AddOns />
    </Suspense>
  );
}

async function AddOns() {
  await requireOwner();
  const addOns = await db.addOn.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <>
      <section className={styles.panel}>
        <h2>Add-ons</h2>
        <p className={styles.muted}>
          Per day: charged for every rental day. One-off: charged once. Untick &quot;On sale&quot;
          to hide an add-on from new bookings.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Charged</th>
                <th>Price (VND)</th>
                <th>On sale</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {addOns.map((a) => (
                <AddOnRow key={a.id} addOn={a} />
              ))}
              <AddOnRow />
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function AddOnRow({
  addOn,
}: {
  addOn?: { id: string; name: string; pricing: string; price: number; active: boolean };
}) {
  const formId = `addon-${addOn?.id ?? "new"}`;
  return (
    <tr>
      <td>
        <form id={formId} action={saveAddOnAction}>
          {addOn && <input type="hidden" name="id" value={addOn.id} />}
        </form>
        <input
          form={formId}
          name="name"
          defaultValue={addOn?.name}
          placeholder={addOn ? undefined : "New add-on, e.g. Rain poncho"}
          className={styles.cellInput}
          style={{ width: 220 }}
          required
        />
      </td>
      <td>
        <select
          form={formId}
          name="pricing"
          defaultValue={addOn?.pricing ?? "FLAT"}
          className={styles.cellInput}
        >
          <option value="PER_DAY">Per day</option>
          <option value="FLAT">One-off</option>
        </select>
      </td>
      <td>
        <input
          form={formId}
          type="number"
          name="price"
          defaultValue={addOn?.price}
          min={0}
          step={1000}
          className={styles.cellInput}
          required
        />
      </td>
      <td>
        <input form={formId} type="checkbox" name="active" defaultChecked={addOn?.active ?? true} />
      </td>
      <td>
        <button form={formId} className={addOn ? styles.secondary : styles.primary}>
          {addOn ? "Save" : "Add"}
        </button>
      </td>
    </tr>
  );
}
