# Decisions

Choices made while planning the rebuild, with the reason for each. Pricing rules are in `docs/pricing.md`.

## Booking and availability (10 October 2026)

- **Dates, not times.** A booking covers whole days, and both the pick-up and drop-off days count.
- **Cleaning gap.** A whole number of days, set in staff settings, default 0. Because both days count, a bike returned on the 17th can go out again on the 18th with a gap of 0.
- **One-way returns.** After a Saigon to Hanoi or Saigon to Da Nang rental, the bike goes back to Saigon by train, which takes 3 days from either city (decided 11 October 2026). It is blocked for those days, then it's available in Saigon again. Transit days are set per route, so this can change.
- **Reverse routes** (Hanoi or Da Nang to Saigon) are enquiry forms, not instant bookings.
- **Bike assignment.** The system picks a free physical bike of the chosen model when the booking is made. Staff can swap it later.
- **No double-booking, enforced by the database.** Every booking, maintenance block and transit block is a date range on one bike. PostgreSQL refuses to store two overlapping ranges on the same bike (an exclusion constraint), so two customers submitting at the same moment can't both get the bike. The stored range includes the cleaning gap and transit days, fixed at the moment of booking.
- **Bookings for the same bike take turns** (11 October 2026). Before saving a booking or maintenance block, the system locks that one bike for a few milliseconds and re-checks it's free. Customers booking different bikes never wait for each other. Without this, two customers booking the same bike at the same instant could stall each other for about a second until the database cancelled one, which then failed with an error instead of getting another bike. The no-overlap rule remains the final guarantee.
- **Timezone.** All dates are in Asia/Ho_Chi_Minh.

## Payments (10 October 2026)

- **Online bookings must pay the deposit online,** by Vietcombank transfer or e-wallet QR (Momo, ZaloPay, VNPay).
- **Unpaid holds.** An unpaid online booking holds the bike for 24 hours, then the hold is released.
- **Cash** is for walk-in bookings and for the balance at pickup.
- **References.** Each booking gets a unique reference (`RLB-XXXXXX`). Bank transfers use a VietQR code, so the amount and reference fill in automatically in the customer's banking app.
- **One payment interface.** All payment methods sit behind a single interface, so a card gateway can be added later without touching the booking code.

## Site (10 October 2026)

- **English only at launch,** built so languages can be added later. Every old language URL (`/vi`, `/fr`, `/nl`, `/ja`, `/ko_KR`, `/zh_CN`) gets a 301 to the matching English page.
- **Currency.** Prices are charged and stored in VND, with an approximate USD figure shown beside them. Staff set the exchange rate in settings.
- **Tours.** Each tour gets its own page with an enquiry form. No online tour booking at launch.
- **Staff login.** Email magic links sent through Resend: no passwords to store, and only listed staff emails can sign in. Two roles: owner (sees costs and profit, edits prices) and staff.

## Staff area (15 October 2026)

- **Sign-in by email link.** Staff enter their email and get a one-time link, valid for 15 minutes. Opening it shows a "Sign in" button, so email scanners that open links automatically can't use it up. A sign-in lasts 30 days. Links and sessions are stored only as hashes. Switching a staff member off signs them out everywhere at once. Staff are added with `npm run staff:add` or from Settings, never in the code.
- **Two roles.** Owners see profit and can change prices and settings; staff handle bookings, bikes, maintenance and the incident log. There is always at least one active owner, and nobody can remove their own owner access.
- **Unpaid bookings can be checked out** until online payments exist: the customer pays the deposit and balance at the counter. An unpaid online hold still lapses after 24 hours, so until payments are built, staff need to check such bookings out before then.
- **Early returns.** Checking in a Saigon round trip before its end date frees the remaining days (after the cleaning gap) so the bike can be rented again. The price doesn't change. One-way trips keep their train-back days.
- **Profit per bike** = revenue from rentals where the bike actually went out (counted in the period the rental started) minus the incident and repair log's parts, labour and other costs, plus anything recovered from the customer or insurer. Kept deposits from cancellations will be added once payments are recorded.
