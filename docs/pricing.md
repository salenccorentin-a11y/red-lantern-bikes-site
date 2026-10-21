# Red Lantern Bikes: fleet, rates and pricing rules

Source of truth for prices while the site is being built. Copied from the launch plan on 10 October 2026. All amounts are in VND.

Once the site is live, every value here is stored in the database and edited from the staff settings page; this file is only the starting data.

## Fleet and rates

The weekly and monthly columns are a price per day, not a total.

| Model | Units | Daily rate | Weekly rate, per day | Monthly rate, per day | Online deposit (non-refundable) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Honda Wave Alpha 110cc | 4 | 240,000 | 205,000 | 185,000 | 1,500,000 |
| Suzuki GD110 | 1 | 240,000 | 205,000 | 185,000 | 1,500,000 |
| Suzuki EN125 | 1 | 300,000 | 280,000 | 250,000 | 1,500,000 |
| Honda CB125 | 1 | 300,000 | 280,000 | 250,000 | 1,500,000 |
| Yamaha NVX125 | 1 | 300,000 | 280,000 | 250,000 | 1,500,000 |
| Honda Winner X 150 | 3 | 360,000 | 330,000 | 280,000 | 1,500,000 |
| Suzuki GSX-R150 | 2 | 360,000 | 310,000 | 280,000 | 1,500,000 |
| Honda XR150 | 8 | 400,000 | 350,000 | 300,000 | 1,500,000 |
| Honda CB150X | 2 | 650,000 | 560,000 | 400,000 | 1,500,000 |
| Honda CRF150 | 1 | 650,000 | 560,000 | 400,000 | 1,500,000 |
| Yamaha WR155R | 1 | 900,000 | 770,000 | 500,000 | 1,500,000 |
| Kawasaki Versys X300 | 1 | 1,200,000 | 1,100,000 | 900,000 | 1,500,000 |

Total fleet: 26 bikes across 12 models.

## One-way routes

| Route | Bikes allowed | Minimum days | Days to return the bike by train |
| --- | --- | ---: | ---: |
| Saigon to Hanoi | All | 12 | 3 |
| Saigon to Da Nang | All | 7 | 3 |

### One-way fee by model (decided 11 October 2026)

The same fee applies to both routes. It's set in US dollars and charged in VND at about 26,000 VND per dollar, rounded to the nearest 100,000.

| Models | Fee (USD) | Fee (VND) |
| --- | ---: | ---: |
| Honda Wave Alpha 110cc, Suzuki GD110 | $50 | 1,300,000 |
| Honda CB150X, Kawasaki Versys X300 | $80 | 2,100,000 |
| All other models | $60 | 1,600,000 |

These replace the earlier ranges (Hanoi 1,200,000 to 1,800,000; Da Nang 1,000,000 to 1,600,000). The $80 fee is above both old ranges.

## Deposit

A flat online deposit of 1,500,000 per booking, non-refundable. The rest is paid at pickup.

## Pricing rules (decided 10 October 2026)

1. **One-way fee.** Set by bike model, the same on both routes. See "One-way fee by model" above.
2. **Reverse directions and other cities.** Hanoi to Saigon and Da Nang to Saigon are offered, but as enquiries only: staff confirm by hand and create the booking. No other cities at launch.
3. **Tier thresholds.** The weekly rate applies from 7 days and the monthly rate from 30 days, to every day of the rental. Example: a 10-day XR150 rental is 10 × 350,000.
   **Price cap (decided 11 October 2026):** a rental never costs more than the next tier's minimum length. A 26-day XR150 would be 26 × 350,000 = 9,100,000, but 30 days at the monthly rate is 9,000,000, so it costs 9,000,000. A 6-day Wave Alpha costs the 7-day price, 1,435,000. A customer never pays more for fewer days.
4. **Deposit and the total.** The 1,500,000 deposit is part of the rental total. Balance at pickup = total − deposit.
5. **Deposit on short rentals.** The deposit is capped at the rental total. A 1-day Wave Alpha (240,000) has a 240,000 deposit and nothing due at pickup.
6. **Add-ons** (decided 17 Oct 2026). Editable in staff settings; the seed sets:
   - **Full coverage insurance**, optional, per day, priced by bike size: 80,000 VND (110–125cc: Wave Alpha, GD110, EN125, CB125, NVX125), 130,000 (150cc: Winner X, GSX-R150, XR150), 180,000 (CB150X, CRF150, WR155R), 260,000 (Versys X300). That's the owner's $3 / $5 / $7 / $10, rounded at 26,000 VND per USD. Stored as a price per model (`AddOnModelPrice`). Covers accidents, mechanical problems and flat tyres; not theft or loss of the bike, police problems or breaking the law (owner, 21 Oct 2026). Without insurance the shop covers engine failures only.
   - **Premium helmet**, 500,000 VND one-off each, rented and returned, up to 2 per booking.
   - **Motorcycle gloves**, 500,000 VND one-off per pair, rented and returned, up to 2 per booking.
   - Phone mount, luggage rack and straps are included free, so they are not add-ons. The prototype's placeholder add-ons are switched off.
7. **Day count.** Customers choose dates only, no times. Both the pick-up and drop-off days count: 10 to 17 October is 8 days.

Other booking and payment decisions are in `docs/decisions.md`.
