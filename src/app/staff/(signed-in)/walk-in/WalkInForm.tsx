"use client";

import { useActionState, useState } from "react";
import { formatVnd } from "@/lib/money";
import { addOnUnitPrice, quote } from "@/lib/pricing";
import type { Catalog } from "@/server/catalog";
import { createWalkIn, type WalkInState } from "./actions";
import styles from "../../staff.module.css";

type Props = {
  catalog: Catalog;
  bikes: { id: string; plate: string; modelId: string }[];
  today: string;
};

export function WalkInForm({ catalog, bikes, today }: Props) {
  const [state, action, pending] = useActionState<WalkInState, FormData>(createWalkIn, {});
  const [modelId, setModelId] = useState("");
  const [dropoff, setDropoff] = useState<"SAIGON" | "HANOI" | "DA_NANG">("SAIGON");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const model = catalog.models.find((m) => m.id === modelId);
  const route = dropoff === "SAIGON" ? null : catalog.routes.find((r) => r.toCity === dropoff);
  const priced =
    model && startDate && endDate
      ? quote({
          startDate,
          endDate,
          rates: model,
          oneWay:
            dropoff === "SAIGON"
              ? null
              : { minDays: route?.minDays ?? 1, feeVnd: model.oneWayFees[dropoff] ?? null },
          addOns: catalog.addOns
            .filter((a) => (quantities[a.id] ?? 0) > 0)
            .map((a) => ({
              addOnId: a.id,
              name: a.name,
              pricing: a.pricing,
              unitPrice: addOnUnitPrice(a, model.id),
              quantity: quantities[a.id],
            })),
          depositVnd: catalog.depositVnd,
        })
      : null;

  return (
    <form action={action} className={`${styles.form} ${styles.panel}`}>
      <div className={styles.row}>
        <label className={styles.field}>
          <span>Bike model</span>
          <select
            name="modelId"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            required
          >
            <option value="">Choose…</option>
            {catalog.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Bike</span>
          <select name="bikeId" key={modelId} defaultValue="">
            <option value="">Any free bike</option>
            {bikes
              .filter((b) => b.modelId === modelId)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.plate}
                </option>
              ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Drop-off</span>
          <select
            name="dropoffCity"
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value as typeof dropoff)}
          >
            <option value="SAIGON">Back to the shop</option>
            {catalog.routes.map((r) => (
              <option key={r.toCity} value={r.toCity}>
                One-way to {r.toCity === "HANOI" ? "Hanoi" : "Da Nang"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Pick-up</span>
          <input
            type="date"
            name="startDate"
            value={startDate}
            min={today}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </label>
        <label className={styles.field}>
          <span>Drop-off date</span>
          <input
            type="date"
            name="endDate"
            value={endDate}
            min={startDate || today}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </label>
      </div>

      {catalog.addOns.length > 0 && (
        <fieldset className={styles.row} style={{ border: 0, padding: 0, margin: 0 }}>
          {catalog.addOns.map((a) => (
            <label key={a.id}>
              <select
                name={`addOn:${a.id}`}
                value={quantities[a.id] ?? 0}
                onChange={(e) => setQuantities((q) => ({ ...q, [a.id]: Number(e.target.value) }))}
              >
                {Array.from({ length: a.maxQuantity + 1 }, (_, n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>{" "}
              {a.name} ({formatVnd(model ? addOnUnitPrice(a, model.id) : a.price)}
              {a.pricing === "PER_DAY" ? "/day" : " each"}
              {!model && Object.keys(a.modelPrices).length > 0 ? ", depends on bike" : ""})
            </label>
          ))}
        </fieldset>
      )}

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Customer name</span>
          <input name="name" autoComplete="off" required />
        </label>
        <label className={styles.field}>
          <span>Phone or WhatsApp</span>
          <input name="phone" type="tel" autoComplete="off" />
        </label>
        <label className={styles.field}>
          <span>Email (optional)</span>
          <input name="email" type="email" autoComplete="off" />
        </label>
      </div>
      <label className={styles.field}>
        <span>Note (optional)</span>
        <textarea name="note" rows={2} maxLength={1000} />
      </label>

      <div aria-live="polite">
        {priced?.ok && (
          <p>
            <b>{formatVnd(priced.quote.totalVnd)}</b> for {priced.quote.days} days
            {priced.quote.oneWayFeeVnd > 0 &&
              ` (incl. one-way fee ${formatVnd(priced.quote.oneWayFeeVnd)})`}
          </p>
        )}
        {priced && !priced.ok && priced.error.code === "BELOW_MIN_DAYS" && (
          <p className={styles.error}>This trip needs at least {priced.error.minDays} days.</p>
        )}
        {state.error && <p className={styles.error}>{state.error}</p>}
      </div>
      <div>
        <button className={styles.primary} disabled={pending}>
          {pending ? "Booking…" : "Create booking"}
        </button>
      </div>
    </form>
  );
}
