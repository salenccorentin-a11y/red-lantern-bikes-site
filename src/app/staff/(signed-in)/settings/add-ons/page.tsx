import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireOwner } from "@/server/staff-session";
import { formatVnd } from "@/lib/money";
import { saveAddOnAction, saveAddOnPricesAction } from "../actions";
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
  const [addOns, models] = await Promise.all([
    db.addOn.findMany({ orderBy: { sortOrder: "asc" }, include: { modelPrices: true } }),
    db.bikeModel.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <section className={styles.panel}>
        <h2>Add-ons</h2>
        <p className={styles.muted}>
          Per day: charged for every rental day. One-off: charged once per item. Max: how many one
          booking can take (2 for rider and passenger). The note shows under the name on the booking
          page. Untick &quot;On sale&quot; to hide an add-on from new bookings.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Charged</th>
                <th>Price (VND)</th>
                <th>Max</th>
                <th>Note for customers</th>
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

      <section className={styles.panel}>
        <h2>Prices by bike</h2>
        <p className={styles.muted}>
          For add-ons that cost more on some bikes, like insurance. Leave a box empty to use the
          add-on&apos;s usual price.
        </p>
        {addOns
          .filter((a) => a.active)
          .map((a) => {
            const formId = `prices-${a.id}`;
            return (
              <div key={a.id} className={styles.tableWrap}>
                <form id={formId} action={saveAddOnPricesAction}>
                  <input type="hidden" name="addOnId" value={a.id} />
                  <input type="hidden" name="addOnName" value={a.name} />
                </form>
                <h3>
                  {a.name}{" "}
                  <span className={styles.muted}>
                    (usual price {formatVnd(a.price)}
                    {a.pricing === "PER_DAY" ? " a day" : ""})
                  </span>
                </h3>
                <table className={styles.table}>
                  <tbody>
                    {models.map((m) => (
                      <tr key={m.id}>
                        <td>{m.name}</td>
                        <td>
                          <input
                            form={formId}
                            type="number"
                            name={`price:${m.id}`}
                            defaultValue={
                              a.modelPrices.find((p) => p.bikeModelId === m.id)?.price ?? ""
                            }
                            placeholder={String(a.price)}
                            min={0}
                            step={1000}
                            className={styles.cellInput}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button form={formId} className={styles.secondary}>
                  Save {a.name} prices
                </button>
              </div>
            );
          })}
      </section>
    </>
  );
}

function AddOnRow({
  addOn,
}: {
  addOn?: {
    id: string;
    name: string;
    pricing: string;
    price: number;
    maxQuantity: number;
    description: string | null;
    active: boolean;
  };
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
        <input
          form={formId}
          type="number"
          name="maxQuantity"
          defaultValue={addOn?.maxQuantity ?? 1}
          min={1}
          max={5}
          className={styles.cellInput}
          style={{ width: 64 }}
          required
        />
      </td>
      <td>
        <input
          form={formId}
          name="description"
          defaultValue={addOn?.description ?? ""}
          maxLength={200}
          className={styles.cellInput}
          style={{ width: 280 }}
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
