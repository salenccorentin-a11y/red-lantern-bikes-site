"use client";

// The booking page: where, when, which bike, extras, contact details, reserve.
// Prices shown here use the same calculator as the server (src/lib/pricing.ts)
// so they update instantly, but the server recalculates them when the customer
// reserves; nothing price-related is sent from the browser.

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { dropoffLabel } from "@/lib/cities";
import { formatDisplayDate } from "@/lib/dates";
import { formatUsdApprox, formatVnd } from "@/lib/money";
import { addOnUnitPrice, quote, type AddOnChoice } from "@/lib/pricing";
import type { Catalog, CatalogAddOn, CatalogModel, OneWayCity } from "@/server/catalog";
import { createOnlineBooking, type BookingFormState } from "./actions";
import styles from "./book.module.css";

type Dropoff = "SAIGON" | OneWayCity;

type Availability =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ready"; counts: Record<string, number> }
  | { state: "error" };

export function BookingForm(props: {
  catalog: Catalog;
  today: string;
  initialModelId?: string | null;
  initialDropoff?: Dropoff;
}) {
  const { catalog, today } = props;
  const [dropoff, setDropoff] = useState<Dropoff>(props.initialDropoff ?? "SAIGON");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [modelId, setModelId] = useState<string | null>(props.initialModelId ?? null);
  // How many of each extra, by id. Extras not chosen are left out.
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState("");
  const [acceptDeposit, setAcceptDeposit] = useState(false);
  // Last availability answer from the server, tagged with the trip it was for.
  const [fetched, setFetched] = useState<{ key: string; counts: Record<string, number> | null }>();
  // Bumped to re-check availability, e.g. after someone else took the bike.
  const [availabilityCheck, setAvailabilityCheck] = useState(0);
  const [result, setResult] = useState<BookingFormState>({});
  const [submitting, startSubmit] = useTransition();

  const usd = (vnd: number) => formatUsdApprox(vnd, catalog.usdToVndRate);
  const route = dropoff === "SAIGON" ? null : catalog.routes.find((r) => r.toCity === dropoff);

  // ── Dates ────────────────────────────────────────────────────────────────
  const dateProblem = useMemo(() => {
    if (!startDate || !endDate) return null;
    if (startDate < today) return "Pick-up can't be in the past.";
    if (endDate < startDate) return "Drop-off must be on or after the pick-up day.";
    return null;
  }, [startDate, endDate, today]);
  const datesReady = Boolean(startDate && endDate) && !dateProblem;

  // Live availability for the chosen trip. While the answer for the current
  // trip hasn't arrived yet, the list shows as loading.
  const availabilityKey = datesReady
    ? `${dropoff}|${startDate}|${endDate}|${availabilityCheck}`
    : null;
  const availability: Availability = !availabilityKey
    ? { state: "idle" }
    : fetched?.key !== availabilityKey
      ? { state: "loading" }
      : fetched.counts
        ? { state: "ready", counts: fetched.counts }
        : { state: "error" };

  useEffect(() => {
    if (!availabilityKey) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ dropoff, start: startDate, end: endDate });
    fetch(`/api/availability?${params}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((body: { counts: Record<string, number> }) =>
        setFetched({ key: availabilityKey, counts: body.counts }),
      )
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("Availability check failed", error);
          setFetched({ key: availabilityKey, counts: null });
        }
      });
    return () => controller.abort();
  }, [availabilityKey, dropoff, startDate, endDate]);

  function freeCount(m: CatalogModel): number | null {
    if (availability.state !== "ready") return null;
    return availability.counts[m.id] ?? 0;
  }

  // The chosen bike, unless it's booked for the dates now selected.
  const picked = catalog.models.find((m) => m.id === modelId) ?? null;
  const model = picked && freeCount(picked) !== 0 ? picked : null;

  // ── Prices ───────────────────────────────────────────────────────────────
  const chosenAddOns: AddOnChoice[] = model
    ? catalog.addOns
        .filter((a) => (quantities[a.id] ?? 0) > 0)
        .map((a) => ({
          addOnId: a.id,
          name: a.name,
          pricing: a.pricing,
          unitPrice: addOnUnitPrice(a, model.id),
          quantity: quantities[a.id],
        }))
    : [];

  function setQuantity(addOnId: string, quantity: number) {
    setQuantities((q) => ({ ...q, [addOnId]: quantity }));
  }

  // The price next to an extra: for the chosen bike, or "from" the cheapest.
  function extraPrice(a: CatalogAddOn): string {
    if (model) return formatVnd(addOnUnitPrice(a, model.id));
    const prices = catalog.models.map((m) => addOnUnitPrice(a, m.id));
    const low = Math.min(...prices);
    return low === Math.max(...prices) ? formatVnd(low) : `from ${formatVnd(low)}`;
  }

  const priceFor = (m: CatalogModel, addOns: AddOnChoice[] = []) =>
    datesReady
      ? quote({
          startDate,
          endDate,
          rates: m,
          oneWay: route
            ? { minDays: route.minDays, feeVnd: m.oneWayFees[route.toCity] ?? null }
            : null,
          addOns,
          depositVnd: catalog.depositVnd,
        })
      : null;

  const priced = model ? priceFor(model, chosenAddOns) : null;
  const tooShort = priced && !priced.ok && priced.error.code === "BELOW_MIN_DAYS";

  const canReserve =
    datesReady && model !== null && priced?.ok === true && availability.state !== "loading";

  // ── Submit ───────────────────────────────────────────────────────────────
  function reserve(event: React.FormEvent) {
    event.preventDefault();
    if (!canReserve || !model) return;
    startSubmit(async () => {
      // On success the server sends the customer to their booking page.
      const state = await createOnlineBooking({
        dropoffCity: dropoff,
        startDate,
        endDate,
        modelId: model.id,
        addOns: chosenAddOns.map((a) => ({ addOnId: a.addOnId, quantity: a.quantity })),
        name,
        email,
        phone: phone || undefined,
        note: note || undefined,
        acceptDeposit,
        website,
      });
      setResult(state ?? {});
      // The bike may have just gone: refresh the list.
      if (state?.error) setAvailabilityCheck((n) => n + 1);
    });
  }

  const fieldError = (field: string) => result.fieldErrors?.[field];

  return (
    <form className={styles.layout} onSubmit={reserve} noValidate>
      <div>
        {/* 1. Where */}
        <fieldset className={styles.section}>
          <legend className={styles.heading}>1. Where are you going?</legend>
          <div className={styles.options}>
            <Option
              checked={dropoff === "SAIGON"}
              onChange={() => setDropoff("SAIGON")}
              name="dropoff"
              label="Ride around and return to Saigon"
              note="No one-way fee"
            />
            {catalog.routes.map((r) => (
              <Option
                key={r.toCity}
                checked={dropoff === r.toCity}
                onChange={() => setDropoff(r.toCity)}
                name="dropoff"
                label={`One-way to ${dropoffLabel(r.toCity).replace(" (one-way)", "")}`}
                note={`From ${r.minDays} days · one-way fee by bike`}
              />
            ))}
          </div>
          <p className={styles.hint}>
            Starting in Hanoi or Da Nang? <a href="/contact?about=reverse">Contact us</a> and
            we&apos;ll arrange it.
          </p>
        </fieldset>

        {/* 2. Dates */}
        <fieldset className={styles.section}>
          <legend className={styles.heading}>2. Dates</legend>
          <div className={styles.dates}>
            <label className={styles.field}>
              <span>Pick up in Saigon</span>
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </label>
            <label className={styles.field}>
              <span>
                Drop off{route ? ` in ${dropoffLabel(route.toCity).replace(" (one-way)", "")}` : ""}
              </span>
              <input
                type="date"
                value={endDate}
                min={startDate || today}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </label>
          </div>
          <div aria-live="polite">
            {dateProblem && <p className={styles.warn}>{dateProblem}</p>}
            {tooShort && route && (
              <p className={styles.warn}>This trip needs at least {route.minDays} days.</p>
            )}
            {datesReady && priced?.ok && (
              <p className={styles.ok}>
                {priced.quote.days} day{priced.quote.days === 1 ? "" : "s"}, both pick-up and
                drop-off days included
              </p>
            )}
          </div>
        </fieldset>

        {/* 3. Bike */}
        <fieldset className={styles.section}>
          <legend className={styles.heading}>3. Choose your bike</legend>
          <div aria-live="polite" className={styles.hint}>
            {!datesReady && "Choose your dates to see which bikes are free."}
            {availability.state === "loading" && "Checking which bikes are free…"}
            {availability.state === "error" &&
              "We couldn't check availability just now. You can still choose a bike; we'll confirm when you reserve."}
          </div>
          <div className={styles.bikes}>
            {catalog.models.map((m) => {
              const free = freeCount(m);
              const price = priceFor(m);
              const noRoute =
                route !== null && route !== undefined && m.oneWayFees[route.toCity] === undefined;
              const soldOut = free === 0;
              const disabled = soldOut || noRoute;
              return (
                <label
                  key={m.id}
                  className={`${styles.bike} ${m.id === model?.id ? styles.bikeOn : ""} ${disabled ? styles.bikeOff : ""}`}
                >
                  <input
                    type="radio"
                    name="bike"
                    className={styles.visuallyHidden}
                    checked={m.id === model?.id}
                    disabled={disabled}
                    onChange={() => setModelId(m.id)}
                  />
                  <Image
                    src={`/bikes/${m.slug}.webp`}
                    alt=""
                    width={1200}
                    height={800}
                    sizes="(max-width: 600px) 45vw, 200px"
                    className={styles.bikeImage}
                  />
                  <span className={styles.bikeName}>{m.name}</span>
                  <span className={styles.small}>{m.kind}</span>
                  {price?.ok ? (
                    <span className={styles.price}>
                      {formatVnd(price.quote.rentalVnd + price.quote.oneWayFeeVnd)}
                      <span> for {price.quote.days} days</span>
                    </span>
                  ) : (
                    <span className={styles.price}>
                      {formatVnd(m.dailyRate)}
                      <span> / day</span>
                    </span>
                  )}
                  {route && m.oneWayFees[route.toCity] !== undefined && (
                    <span className={styles.small}>
                      incl. one-way fee {formatVnd(m.oneWayFees[route.toCity]!)}
                    </span>
                  )}
                  {!price?.ok && !route && (
                    <span className={styles.small}>
                      from {formatVnd(m.monthlyRate)} / day monthly
                    </span>
                  )}
                  {noRoute && <span className={styles.status}>Not available for this trip</span>}
                  {!noRoute && soldOut && (
                    <span className={styles.status}>Booked for these dates</span>
                  )}
                  {!noRoute && free !== null && free > 0 && free <= 2 && (
                    <span className={styles.statusLow}>Only {free} left</span>
                  )}
                </label>
              );
            })}
          </div>
          {fieldError("modelId") && <p className={styles.warn}>{fieldError("modelId")}</p>}
        </fieldset>

        {/* 4. Extras */}
        {catalog.addOns.length > 0 && (
          <fieldset className={styles.section}>
            <legend className={styles.heading}>4. Extras</legend>
            {catalog.addOns.map((a) => {
              const quantity = quantities[a.id] ?? 0;
              const label = (
                <span className={styles.grow}>
                  {a.name}
                  {a.description && <small className={styles.addonNote}>{a.description}</small>}
                </span>
              );
              const price = (
                <span className={styles.addonPrice}>
                  <b>{extraPrice(a)}</b>
                  <small>{a.pricing === "PER_DAY" ? "per day" : "one-off, each"}</small>
                </span>
              );
              // One allowed: a tick box. More (helmets, gloves): how many.
              return a.maxQuantity === 1 ? (
                <label key={a.id} className={styles.addon}>
                  <input
                    type="checkbox"
                    checked={quantity > 0}
                    onChange={(e) => setQuantity(a.id, e.target.checked ? 1 : 0)}
                  />
                  {label}
                  {price}
                </label>
              ) : (
                <div key={a.id} className={styles.addon}>
                  <select
                    aria-label={`How many: ${a.name}`}
                    value={quantity}
                    onChange={(e) => setQuantity(a.id, Number(e.target.value))}
                    className={styles.qty}
                  >
                    {Array.from({ length: a.maxQuantity + 1 }, (_, n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  {label}
                  {price}
                </div>
              );
            })}
            {!model && catalog.addOns.some((a) => Object.keys(a.modelPrices).length > 0) && (
              <p className={styles.small}>Choose a bike to see its insurance price.</p>
            )}
          </fieldset>
        )}

        {/* 5. Details */}
        <fieldset className={styles.section}>
          <legend className={styles.heading}>
            {catalog.addOns.length > 0 ? "5" : "4"}. Your details
          </legend>
          <div className={styles.details}>
            <TextField
              label="Full name"
              value={name}
              onChange={setName}
              error={fieldError("name")}
              autoComplete="name"
              required
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              error={fieldError("email")}
              autoComplete="email"
              hint="We send your booking and payment details here."
              required
            />
            <TextField
              label="Phone or WhatsApp (optional)"
              type="tel"
              value={phone}
              onChange={setPhone}
              error={fieldError("phone")}
              autoComplete="tel"
              hint="With country code, e.g. +44 7700 900123"
            />
            <label className={`${styles.field} ${styles.wide}`}>
              <span>Anything we should know? (optional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={1000}
              />
            </label>
            {/* Hidden from people; spam bots fill it in. */}
            <label className={styles.honeypot} aria-hidden="true">
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>
        </fieldset>
      </div>

      {/* Summary */}
      <aside className={styles.ticket} id="summary" aria-label="Your booking">
        <div className={styles.ticketLabel}>Your booking</div>
        <div className={styles.ticketBike}>{model?.name ?? "Choose a bike"}</div>
        <div className={styles.ticketMeta}>
          {startDate ? formatDisplayDate(startDate) : "—"} to{" "}
          {endDate ? formatDisplayDate(endDate) : "—"}
          <br />
          {dropoffLabel(dropoff)}
        </div>
        <div className={styles.perf} />
        {priced?.ok ? (
          <div aria-live="polite">
            <Line
              label={`Rental, ${priced.quote.days} day${priced.quote.days === 1 ? "" : "s"}`}
              value={formatVnd(priced.quote.rentalVnd)}
            />
            {priced.quote.oneWayFeeVnd > 0 && (
              <Line label="One-way fee" value={formatVnd(priced.quote.oneWayFeeVnd)} />
            )}
            {priced.quote.addOnLines.map((l) => (
              <Line
                key={l.addOnId}
                label={l.quantity > 1 ? `${l.name} × ${l.quantity}` : l.name}
                value={formatVnd(l.totalVnd)}
              />
            ))}
            <div className={`${styles.line} ${styles.total}`}>
              <span>Total</span>
              <span>
                {formatVnd(priced.quote.totalVnd)}
                <small className={styles.usd}>{usd(priced.quote.totalVnd)}</small>
              </span>
            </div>
            <Line
              label="Deposit now, non-refundable"
              value={formatVnd(priced.quote.depositVnd)}
              sub={usd(priced.quote.depositVnd)}
            />
            <Line label="Balance at pick-up" value={formatVnd(priced.quote.balanceVnd)} />
          </div>
        ) : (
          <p className={styles.ticketMeta}>Choose your trip, dates and bike to see the price.</p>
        )}

        <label className={styles.accept}>
          <input
            type="checkbox"
            checked={acceptDeposit}
            onChange={(e) => setAcceptDeposit(e.target.checked)}
          />
          <span>
            I understand the online deposit is non-refundable. The balance is paid at pick-up.
          </span>
        </label>
        {fieldError("acceptDeposit") && (
          <p className={styles.ticketWarn}>{fieldError("acceptDeposit")}</p>
        )}

        <button className={styles.reserve} type="submit" disabled={!canReserve || submitting}>
          {submitting ? "Reserving…" : "Reserve this bike"}
        </button>
        <div aria-live="assertive">
          {result.error && <p className={styles.ticketWarn}>{result.error}</p>}
        </div>
        <p className={styles.ticketFine}>
          You&apos;ll pay the deposit by bank transfer or e-wallet QR on the next page. We hold the
          bike for 24 hours while it arrives.
        </p>
      </aside>

      {/* Phones: keep the total and the way to the summary in view. */}
      {priced?.ok && (
        <a href="#summary" className={styles.mobileBar}>
          <span>
            Total <b>{formatVnd(priced.quote.totalVnd)}</b>
          </span>
          <span className={styles.mobileBarCta}>Review &amp; reserve</span>
        </a>
      )}
    </form>
  );
}

function Option(props: {
  checked: boolean;
  onChange: () => void;
  name: string;
  label: string;
  note: string;
}) {
  return (
    <label className={`${styles.opt} ${props.checked ? styles.optOn : ""}`}>
      <input type="radio" name={props.name} checked={props.checked} onChange={props.onChange} />
      <span className={styles.grow}>{props.label}</span>
      <span className={styles.small}>{props.note}</span>
    </label>
  );
}

function TextField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className={styles.field}>
      <span>{props.label}</span>
      <input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete}
        required={props.required}
        aria-invalid={props.error ? true : undefined}
      />
      {props.error ? (
        <small className={styles.fieldError}>{props.error}</small>
      ) : (
        props.hint && <small className={styles.fieldHint}>{props.hint}</small>
      )}
    </label>
  );
}

function Line({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className={styles.line}>
      <span>{label}</span>
      <span>
        {value}
        {sub && <small className={styles.usd}>{sub}</small>}
      </span>
    </div>
  );
}
