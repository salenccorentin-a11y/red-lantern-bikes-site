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

| Route | Bikes allowed | One-way fee | Minimum days |
| --- | --- | ---: | ---: |
| Saigon to Hanoi | All | 1,200,000 to 1,800,000 | 12 |
| Saigon to Da Nang | All | 1,000,000 to 1,600,000 | 7 |

## Deposit

A flat online deposit of 1,500,000 per booking, non-refundable. The rest is paid at pickup.

## Open questions (confirm before building pricing)

These are not decided yet. Claude Code must ask rather than guess.

1. **One-way fee within the range.** What sets the exact fee: the bike model, the rental length, the season, or something else?
2. **Reverse directions and other cities.** Are Hanoi to Saigon, Da Nang to Saigon, or any other drop-off cities offered, and at what fee?
3. **Tier thresholds.** Assumed: the weekly rate applies from 7 days and the monthly rate from 30 days. Confirm, including whether the rate applies to every day of the rental once the threshold is reached.
4. **Deposit and the total.** Assumed: the 1,500,000 deposit is part of the rental total, so the balance at pickup is the total minus the deposit. Confirm.
5. **Deposit on short rentals.** On a 1-day Wave Alpha rental (240,000) the deposit is larger than the price. Should the deposit be capped at the rental total?
6. **Add-ons.** Which add-ons exist (helmets, phone mount, insurance or damage waiver, luggage rack, delivery) and their prices.
