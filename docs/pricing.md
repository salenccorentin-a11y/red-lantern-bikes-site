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
4. **Deposit and the total.** The 1,500,000 deposit is part of the rental total. Balance at pickup = total − deposit.
5. **Deposit on short rentals.** The deposit is capped at the rental total. A 1-day Wave Alpha (240,000) has a 240,000 deposit and nothing due at pickup.
6. **Add-ons.** Not decided yet. They are editable records in the staff settings, using the prototype's placeholders until the real list and prices arrive. The booking page does not go live before then.
7. **Day count.** Customers choose dates only, no times. Both the pick-up and drop-off days count: 10 to 17 October is 8 days.

Other booking and payment decisions are in `docs/decisions.md`.
