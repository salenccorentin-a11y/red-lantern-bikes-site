// Booking flow prototype for Red Lantern Bikes.
// Shows the flow and layout only. Real prices live in docs/pricing.md and,
// once built, in the database. Add-on prices below are placeholders.
// Assumptions to confirm (see docs/pricing.md, open questions):
//   - weekly rate from 7 days, monthly rate from 30 days
//   - one-way fee shown at the low end of its range
//   - the deposit is part of the total; the balance is paid at pickup

import React, { useState, useMemo } from 'react';

const BIKES = [
  { id: 'wave', name: 'Honda Wave Alpha 110cc', kind: 'Semi-automatic', daily: 240000, weekly: 205000, monthly: 185000, units: 4 },
  { id: 'gd110', name: 'Suzuki GD110', kind: 'Manual', daily: 240000, weekly: 205000, monthly: 185000, units: 1 },
  { id: 'en125', name: 'Suzuki EN125', kind: 'Manual', daily: 300000, weekly: 280000, monthly: 250000, units: 1 },
  { id: 'cb125', name: 'Honda CB125', kind: 'Manual', daily: 300000, weekly: 280000, monthly: 250000, units: 1 },
  { id: 'nvx', name: 'Yamaha NVX125', kind: 'Automatic scooter', daily: 300000, weekly: 280000, monthly: 250000, units: 1 },
  { id: 'winner', name: 'Honda Winner X 150', kind: 'Manual', daily: 360000, weekly: 330000, monthly: 280000, units: 3 },
  { id: 'gsxr', name: 'Suzuki GSX-R150', kind: 'Manual sport', daily: 360000, weekly: 310000, monthly: 280000, units: 2 },
  { id: 'xr150', name: 'Honda XR150', kind: 'Manual dual-sport', daily: 400000, weekly: 350000, monthly: 300000, units: 8 },
  { id: 'cb150x', name: 'Honda CB150X', kind: 'Manual adventure', daily: 650000, weekly: 560000, monthly: 400000, units: 2 },
  { id: 'crf150', name: 'Honda CRF150', kind: 'Manual dirt', daily: 650000, weekly: 560000, monthly: 400000, units: 1 },
  { id: 'wr155', name: 'Yamaha WR155R', kind: 'Manual dual-sport', daily: 900000, weekly: 770000, monthly: 500000, units: 1 },
  { id: 'versys', name: 'Kawasaki Versys X300', kind: 'Manual adventure', daily: 1200000, weekly: 1100000, monthly: 900000, units: 1 },
];

const DROPOFFS = [
  { id: 'saigon', name: 'Saigon (return to shop)', fee: 0, feeMax: 0, minDays: 1 },
  { id: 'danang', name: 'Da Nang (one-way)', fee: 1000000, feeMax: 1600000, minDays: 7 },
  { id: 'hanoi', name: 'Hanoi (one-way)', fee: 1200000, feeMax: 1800000, minDays: 12 },
];

// Placeholder add-ons until real ones are confirmed.
const ADDONS = [
  { id: 'helmet', name: 'Second helmet', note: 'per day, placeholder price', perDay: 20000 },
  { id: 'phone', name: 'Phone mount', note: 'one-time, placeholder price', flat: 50000 },
  { id: 'rack', name: 'Luggage rack and straps', note: 'one-time, placeholder price', flat: 150000 },
];

const PAYMENTS = [
  { id: 'cash', label: 'Cash on pickup', note: 'The deposit is collected when you pick up the bike, together with the balance.' },
  { id: 'bank', label: 'Bank transfer (Vietcombank QR)', note: 'Scan the QR code with the amount and your booking reference. The booking confirms when the transfer arrives.' },
  { id: 'ewallet', label: 'Momo / ZaloPay / VNPay', note: 'Scan the e-wallet QR code. Staff confirm the payment.' },
];

const DEPOSIT = 1500000;

const vnd = (n) => n.toLocaleString('vi-VN') + '₫';

export default function BookingPrototype() {
  const [bikeId, setBikeId] = useState('xr150');
  const [dropoffId, setDropoffId] = useState('saigon');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [addOns, setAddOns] = useState([]);
  const [payment, setPayment] = useState('bank');
  const [ref, setRef] = useState('');

  const bike = BIKES.find((b) => b.id === bikeId);
  const dropoff = DROPOFFS.find((d) => d.id === dropoffId);

  const days = useMemo(() => {
    if (!start || !end) return 0;
    const diff = Math.round((new Date(end) - new Date(start)) / 86400000);
    return diff > 0 ? diff : 0;
  }, [start, end]);

  const tier = days >= 30 ? 'monthly' : days >= 7 ? 'weekly' : 'daily';
  const rate = bike[tier];
  const billedDays = Math.max(days, 1);
  const rental = rate * billedDays;
  const addOnLines = ADDONS.filter((a) => addOns.includes(a.id)).map((a) => ({
    ...a,
    cost: a.perDay ? a.perDay * billedDays : a.flat,
  }));
  const total = rental + dropoff.fee + addOnLines.reduce((s, a) => s + a.cost, 0);
  const balance = Math.max(total - DEPOSIT, 0);
  const tooShort = days > 0 && days < dropoff.minDays;
  const canReserve = days > 0 && !tooShort;
  const pay = PAYMENTS.find((p) => p.id === payment);

  const toggle = (id) => setAddOns((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  if (ref) {
    return (
      <div className="wrap">
        <style>{STYLES}</style>
        <div className="confirm">
          <div className="small">Booking {ref}</div>
          <h2>Your bike is reserved</h2>
          <div className="grid">
            <div><span>Bike</span><strong>{bike.name}</strong></div>
            <div><span>Dates</span><strong>{start} to {end}</strong></div>
            <div><span>Drop-off</span><strong>{dropoff.name}</strong></div>
            <div><span>Total</span><strong>{vnd(total)}</strong></div>
            <div><span>Deposit now</span><strong>{vnd(DEPOSIT)} (non-refundable)</strong></div>
            <div><span>Balance at pickup</span><strong>{vnd(balance)}</strong></div>
          </div>
          <p className="note">{pay.note} Use reference <b>{ref}</b>.</p>
          <button className="ghost" onClick={() => setRef('')}>Make another booking</button>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <style>{STYLES}</style>
      <header className="head">
        <div className="lantern" aria-hidden="true" />
        <div>
          <div className="brand">RED LANTERN BIKES</div>
          <div className="small">Motorbike rentals and one-way trips from District 1, Saigon</div>
        </div>
      </header>

      <div className="layout">
        <div>
          <section>
            <h3>1. Where are you going?</h3>
            <div className="options">
              {DROPOFFS.map((d) => (
                <label key={d.id} className={'opt' + (d.id === dropoffId ? ' on' : '')}>
                  <input type="radio" name="dropoff" checked={d.id === dropoffId} onChange={() => setDropoffId(d.id)} />
                  <span className="grow">{d.name}</span>
                  <span className="small">
                    {d.fee ? `fee ${vnd(d.fee)} to ${vnd(d.feeMax)}, min ${d.minDays} days` : 'no one-way fee'}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <h3>2. Dates</h3>
            <div className="dates">
              <label><span>Pick up in Saigon</span><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
              <label><span>Drop off</span><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
            </div>
            {start && end && days === 0 && <div className="warn">Drop-off must be after pick-up.</div>}
            {tooShort && <div className="warn">This route needs at least {dropoff.minDays} days.</div>}
            {days > 0 && !tooShort && <div className="ok">{days} day{days > 1 ? 's' : ''} at the {tier} rate</div>}
          </section>

          <section>
            <h3>3. Choose your bike</h3>
            <div className="bikes">
              {BIKES.map((b) => (
                <button key={b.id} className={'bike' + (b.id === bikeId ? ' on' : '')} onClick={() => setBikeId(b.id)}>
                  <div className="bname">{b.name}</div>
                  <div className="small">{b.kind}</div>
                  <div className="price">{vnd(b.daily)}<span> / day</span></div>
                  <div className="small">from {vnd(b.monthly)} / day monthly</div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3>4. Extras</h3>
            {ADDONS.map((a) => (
              <label key={a.id} className="addon">
                <input type="checkbox" checked={addOns.includes(a.id)} onChange={() => toggle(a.id)} />
                <span className="grow">{a.name}</span>
                <span className="small">{a.note}</span>
                <b>{vnd(a.perDay || a.flat)}</b>
              </label>
            ))}
          </section>

          <section>
            <h3>5. How will you pay the deposit?</h3>
            <div className="options">
              {PAYMENTS.map((p) => (
                <label key={p.id} className={'opt' + (p.id === payment ? ' on' : '')}>
                  <input type="radio" name="pay" checked={p.id === payment} onChange={() => setPayment(p.id)} />
                  <span className="grow">{p.label}</span>
                </label>
              ))}
            </div>
            <p className="small">{pay.note}</p>
          </section>
        </div>

        <aside className="ticket">
          <div className="tlabel">Your booking</div>
          <div className="tbike">{bike.name}</div>
          <div className="small light">{start || '—'} to {end || '—'} · {dropoff.name}</div>
          <div className="perf" />
          <div className="line"><span>{tier} rate × {billedDays}</span><span>{vnd(rental)}</span></div>
          {dropoff.fee > 0 && <div className="line"><span>One-way fee (from)</span><span>{vnd(dropoff.fee)}</span></div>}
          {addOnLines.map((a) => <div className="line" key={a.id}><span>{a.name}</span><span>{vnd(a.cost)}</span></div>)}
          <div className="line total"><span>Total</span><span>{vnd(total)}</span></div>
          <div className="line"><span>Deposit now, non-refundable</span><span>{vnd(DEPOSIT)}</span></div>
          <div className="line"><span>Balance at pickup</span><span>{vnd(balance)}</span></div>
          <button className="reserve" disabled={!canReserve} onClick={() => setRef('RLB-' + Math.floor(100000 + Math.random() * 900000))}>
            Reserve this bike
          </button>
        </aside>
      </div>
    </div>
  );
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&family=Inter:wght@400;500;600&display=swap');
* { box-sizing: border-box; }
.wrap { font-family: Inter, system-ui, sans-serif; background: #F3EDE2; color: #1B1512; padding: 28px 20px; max-width: 1000px; margin: 0 auto; border-radius: 6px; }
.head { display: flex; gap: 14px; align-items: center; margin-bottom: 28px; }
.lantern { width: 22px; height: 30px; border-radius: 10px 10px 8px 8px; background: #B3261E; box-shadow: 0 0 0 3px #F3EDE2, 0 0 0 4px #B3261E; }
.brand { font-family: Oswald, sans-serif; font-size: 22px; font-weight: 600; letter-spacing: .03em; }
.small { font-size: 12px; color: #6E625A; }
.layout { display: grid; grid-template-columns: 1fr 320px; gap: 32px; align-items: start; }
@media (max-width: 760px) { .layout { grid-template-columns: 1fr; } }
section { margin-bottom: 28px; }
h3 { font-family: Oswald, sans-serif; font-weight: 500; font-size: 15px; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #DDD3C4; }
.options { display: flex; flex-direction: column; gap: 8px; }
.opt, .addon { display: flex; align-items: center; gap: 10px; padding: 11px 12px; border: 1.5px solid #DDD3C4; border-radius: 4px; background: #FBF8F3; font-size: 14px; cursor: pointer; }
.addon { border: none; border-bottom: 1px solid #E5DCCF; border-radius: 0; background: none; padding: 10px 0; }
.opt.on { border-color: #1B1512; background: #fff; }
.grow { flex: 1; }
input[type=radio], input[type=checkbox] { accent-color: #B3261E; }
.dates { display: flex; gap: 16px; flex-wrap: wrap; }
.dates label { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #6E625A; }
.dates input { padding: 9px 10px; border: 1.5px solid #DDD3C4; border-radius: 4px; background: #FBF8F3; font: inherit; color: #1B1512; }
.warn { margin-top: 10px; font-size: 13px; color: #B3261E; }
.ok { margin-top: 10px; font-size: 13px; color: #3F6B44; }
.bikes { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; }
.bike { text-align: left; padding: 12px; border: 1.5px solid #DDD3C4; border-radius: 4px; background: #FBF8F3; cursor: pointer; font: inherit; color: inherit; }
.bike.on { border-color: #B3261E; background: #fff; box-shadow: inset 0 0 0 1px #B3261E; }
.bname { font-family: Oswald, sans-serif; font-weight: 600; font-size: 15px; }
.price { font-weight: 600; margin-top: 8px; }
.price span { font-weight: 400; font-size: 12px; color: #6E625A; }
.ticket { position: sticky; top: 20px; background: #1B1512; color: #F3EDE2; border-radius: 6px; padding: 20px; }
.tlabel { font-family: Oswald, sans-serif; font-size: 12px; color: #E8A33D; letter-spacing: .05em; text-transform: uppercase; }
.tbike { font-family: Oswald, sans-serif; font-size: 19px; font-weight: 600; margin: 6px 0 2px; }
.light { color: #A99C90; }
.perf { border-top: 2px dashed #3B302A; margin: 16px 0 8px; }
.line { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; padding: 6px 0; color: #D8CDBF; }
.line span:first-child { text-transform: none; }
.line.total { border-top: 1px solid #3B302A; margin-top: 6px; padding-top: 12px; font-weight: 600; font-size: 15px; color: #fff; }
.reserve { width: 100%; margin-top: 14px; padding: 14px; border: none; border-radius: 4px; background: #B3261E; color: #fff; font-family: Oswald, sans-serif; font-size: 15px; font-weight: 600; cursor: pointer; }
.reserve:disabled { background: #3B302A; color: #8A7D72; cursor: not-allowed; }
.confirm { max-width: 460px; margin: 0 auto; background: #fff; border: 1.5px solid #DDD3C4; border-radius: 6px; padding: 32px 26px; text-align: center; }
.confirm h2 { font-family: Oswald, sans-serif; margin: 6px 0 20px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; text-align: left; margin-bottom: 18px; }
.grid span { display: block; font-size: 11px; color: #6E625A; }
.grid strong { font-size: 14px; }
.note { font-size: 13px; background: #F3EDE2; padding: 12px; border-radius: 4px; }
.ghost { background: none; border: 1.5px solid #DDD3C4; border-radius: 4px; padding: 10px 16px; cursor: pointer; font: inherit; }
`;
