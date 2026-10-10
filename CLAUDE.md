# Red Lantern Bikes: website rebuild

## Business
Motorbike rental and tour business in District 1, Ho Chi Minh City (redlanternbikes.com). Customers are tourists, backpackers and expats. Products: rentals in Saigon, one-way rentals to Hanoi and Da Nang (the largest share of revenue), and guided and self-guided tours. I am replacing an Odoo website completely.

## Stack (decided, do not change)
Next.js with TypeScript, PostgreSQL through Prisma, deployed on Railway in the Singapore region from a GitHub repository. Transactional email through Resend. No Odoo.

## Fleet
26 bikes across 12 models: Honda Wave Alpha 110cc, Suzuki GD110, Suzuki EN125, Honda CB125, Yamaha NVX125, Honda Winner X 150, Suzuki GSX-R150, Honda XR150, Honda CB150X, Honda CRF150, Yamaha WR155R, Kawasaki Versys X300. Every physical bike is its own record (plate, model, status, maintenance blocks).

Units, rates, the deposit and one-way fees are in `docs/pricing.md`. Its "Open questions" list is not decided yet: ask me about those before building the pricing logic, never guess.

`prototype/booking-prototype.jsx` shows the booking flow and layout only. Its add-on prices are placeholders, and its pricing assumptions are the open questions in `docs/pricing.md`.

## Booking rules
- A customer chooses pick-up and drop-off dates, pick-up and drop-off city, and a bike model.
- Availability is checked per physical bike. Two customers must never be able to book the same bike for overlapping dates, even if they submit at the same moment (use a database transaction).
- Pricing: daily, weekly and monthly tiers per model, a one-way fee per route, add-ons, and a flat non-refundable online deposit (1,500,000 VND) with the balance paid at pickup. Riderly.com is the reference for the flow.
- Staff can create walk-in bookings and block a bike for maintenance; both must update availability immediately.
- A configurable gap between rentals for cleaning and checks.

## Payments at launch
Cash on pickup, bank transfer to Vietcombank with a unique reference per booking, and e-wallet QR codes (Momo, ZaloPay, VNPay). No card processing at launch. Keep the payment code behind one interface so a card gateway can be added later.

## Staff area
Staff-only login. Calendar of bookings by bike, check-out and check-in, maintenance blocks, and a per-bike incident and repair log with a structured cost field so I can calculate real profit per bike.

## Data
Import my existing bookings from a Notion CSV export. Prices are stored in VND.

## SEO and migration
Keep my current URLs, page titles and meta descriptions, or add 301 redirects from every old URL. Generate a sitemap, add local-business structured data, and make the site fast and mobile-first.

## How to work with me
Plan first, then build in small steps and commit often. Write tests for pricing and availability. Never put secrets in the code; use environment variables. Explain decisions in plain language and ask before any choice that is hard to undo.
