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

## Launch set-up and data (17 November 2026)

- **Hosting**: Railway (Singapore) for the site, database and hourly job; Cloudflare's free plan for the domain's DNS, the bare-domain redirect to `www`, and email forwarding. The live branch is `main`, kept in step with `build/foundation`.
- **Archiving finished rentals** (2026-11-17, owner's choice): done by hand in the owner's Notion Rentals database. The "Archive to Notion" button was removed; its `archivedAt` column is dropped by a later migration rather than deleting the migration that added it, so databases that already ran it stay in step.
- **Email**: there's no mailbox on the domain; the owner uses a Gmail address. Booking emails go out through Resend from an address on the domain, and Cloudflare Email Routing forwards replies sent to that address to the owner's Gmail, which is never shown to customers.
- **How long booking data is kept** (changed 2026-11-17): booking details stay on the site to manage the rental, and the owner also records the rental by hand in the Notion Rentals database. Both are kept until the customer asks for deletion, unless the law requires keeping them. The privacy page says so.
- **Drop-off points** in Hanoi and Da Nang are near the city centre (FAQ and one-way page, EN, FR, KO).
- **One-way fee** for the CRF150 and WR155R confirmed at $60, the same as the XR150 (already in the seed).

## WhatsApp, deposits, home page (17 November 2026)

- **WhatsApp button on every public page** (`FloatingWhatsApp`), bottom right. On phones it's a round icon and sits above the price bar on bike and booking pages; on the booking page it moves to the left so it never covers the prices. Wider screens show "Chat on WhatsApp".
- **Two deposits, two names.** "Booking deposit": 1,500,000₫, non-refundable, paid to the shop after confirmation. "Security deposit": passport or cash (US$300 scooter, US$500 motorcycle), left at pick-up and returned. The booking page states the booking deposit amount at the tick box and explains the security deposit before the request is sent. In Korean the booking deposit is 예약금 and the security deposit 보증금.
- **Phone or WhatsApp is required** on the booking form (at least 6 digits), because the booking deposit is arranged through it.
- **≈ $ on the booking page**: each bike row and the total in the phone bar.
- **Home page**: the "Two ways to ride" tiles and the Lao Tzu quote are gone (they repeated the route section). The riders wall and Google reviews come straight after the route, on mist. A "Why rent instead of buying?" block follows the popular bikes, for backpackers who'd otherwise buy a bike in Saigon and sell it in Hanoi.

## Blog clean-up, licence, reviews (16 November 2026)

- **Licence.** International Driving Permits are recognised in Vietnam under the 1968 Vienna Convention, not the 1949 Geneva Convention (owner, 16 Nov 2026). Every licence text says 1968 Vienna (bike pages, FAQ, guides, old blog post, pick-up email, FR and KO). The site doesn't discuss enforcement, and doesn't say the insurance depends on the licence: the shop decides that case by case.
- **Old blog posts** (imported from Odoo) now match the site: Vietnam drives on the right; booking is a free request, confirmed by email, then a 1,500,000₫ deposit paid directly to the shop and the rest at pick-up; free delivery to hotels in or near District 1; prices from the bike pages. Fake "•" bullets became real lists, the comparison is a real table, stray `&nbsp;` removed.
- **Bikes over 175cc** (the Versys X300) follow the same rule as the others: a Vietnamese motorcycle licence or a 1968 Vienna IDP covering motorbikes (owner, 16 Nov 2026).
- **Opening hours.** Every day, 8am to 8pm (owner, 16 Nov 2026), in the text and the structured data.
- **XR150 photos.** The riding photo with the old logo pasted on it is out of the gallery (file kept). The studio photo comes first, replaced by the owner's cut-out `XR.png` (black and orange XR150) on a white 1200×800 background like the other bikes.
- **Reviews.** Until the Google Places key is set up, `src/content/reviews.json` holds three real 5-star reviews copied word for word from the Google Maps listing on 16 Nov 2026 (4.9 from 252 reviews). Once the key is set, the live reviews replace them.

## Before launch: tours, drop-off cities, contract terms (16 November 2026)

- **No tour pages.** The shop doesn't run guided tours, only self-guided trips with its map. The tour pages, their nav and footer links, the home tile and the sitemap entries are gone. `/tours` and `/tours/*` (also under `/fr` and `/ko`) redirect to the one-way page. To bring tours back, restore `src/content/tours.ts`, `src/views/ToursView.tsx`, `src/components/tourPhotos.ts` and the `tours` route folders from the commit before this change, and remove the redirect. The `TOUR` enquiry kind stays in the database for enquiries sent before.
- **Drop-off cities.** Bookable online: Da Nang and Hanoi only. Da Lat, Hue and Nha Trang can be arranged on request, so the one-way page, FAQ and terms say so and point to the contact page.
- **Terms, FAQ and the insurance extra follow the rental contract of 11 November 2026:** the new insurance cover and its two conditions (oil-change photos, contact the shop before any repair), return hours (9am to 4pm in Da Nang and Hanoi, more flexible in Saigon) and hourly late fees. Flat tyres stay covered (owner, 16 Nov 2026). The site doesn't show the fine amounts; they are in the contract. The 24-hour rental (for pick-ups after noon) is handled case by case and stays off the site on purpose. The deposit stays 1,500,000₫, non-refundable (confirmed 16 Nov 2026). The seed doesn't overwrite existing extras, so a database seeded before this change keeps the old insurance description until it's edited in staff settings.

## Booking requests instead of online payment (15 November 2026)

Online payment isn't possible yet, so this replaces the "Payments" rules below until it is.

- **Online bookings are requests.** The customer chooses dates and a bike, sees the full price and sends a request. Nothing is paid on the website.
- **The request holds the bike** while it waits, so two customers can't both be promised the same bike. The no-double-booking rules are unchanged.
- **The shop answers by email.** Each request is emailed to the shop (`BOOKINGS_EMAIL`, or `ENQUIRIES_EMAIL` if that isn't set) with every detail and two buttons, Accept and Decline. They open a page that shows the request and asks for one more click, so email scanners that open links automatically can't answer by accident. The page needs no sign-in: the link holds a random code that is only ever sent to that inbox, so keep that inbox private. The same buttons are on the booking in the staff area.
- **Accept:** the booking is confirmed, the bike stays reserved, and the customer gets an email saying the shop will contact them about the deposit. The page then shows WhatsApp and email links to the customer with a message started. The shop collects the deposit directly; there is no payment record in the system yet, so use the staff note.
- **Decline:** the request is cancelled, the bike is free again, and the customer gets an email with the shop's message, if it wrote one.
- **No answer:** the shop has 24 hours (the "hours you have to answer" setting). It gets one reminder 3 hours before the end. After that the request runs out, the bike is released and the customer is told. A request that ran out can still be accepted afterwards, as long as its bike is still free and the pick-up day hasn't passed.
- **Emails to customers are in English** for now, like the other emails.
- **When online payment arrives,** accepting can lead straight to a payment page; the accept and decline steps stay the same.

## Payments (10 October 2026)

Not in use yet: see "Booking requests" above.

- **Online bookings must pay the deposit online,** by Vietcombank transfer or e-wallet QR (Momo, ZaloPay, VNPay).
- **Unpaid holds.** An unpaid online booking holds the bike for 24 hours, then the hold is released.
- **Cash** is for walk-in bookings and for the balance at pickup.
- **References.** Each booking gets a unique reference (`RLB-XXXXXX`). Bank transfers use a VietQR code, so the amount and reference fill in automatically in the customer's banking app.
- **One payment interface.** All payment methods sit behind a single interface, so a card gateway can be added later without touching the booking code.

## Site (10 October 2026)

- **English only at launch,** built so languages can be added later. Every old language URL (`/vi`, `/fr`, `/nl`, `/ja`, `/ko_KR`, `/zh_CN`) gets a 301 to the matching English page.
- **French and Korean added (November 2026).** The key pages (home, bikes, one-way, tours, FAQ, contact) and the booking steps exist in French under `/fr` and Korean under `/ko`; English keeps its original addresses. About, blog, terms, privacy, emails and the staff area stay in English. Old `/fr` and `/ko_KR` addresses now go to the French and Korean page where one exists. The Korean wording is a draft that needs a native speaker's check.
- **Currency.** Prices are charged and stored in VND, with an approximate USD figure shown beside them. Staff set the exchange rate in settings.
- **Tours.** Each tour gets its own page with an enquiry form. No online tour booking at launch.
- **Staff login.** Email magic links sent through Resend: no passwords to store, and only listed staff emails can sign in. Two roles: owner (sees costs and profit, edits prices) and staff.

## Staff area (15 October 2026)

- **Sign-in by email link.** Staff enter their email and get a one-time link, valid for 15 minutes. Opening it shows a "Sign in" button, so email scanners that open links automatically can't use it up. A sign-in lasts 30 days. Links and sessions are stored only as hashes. Switching a staff member off signs them out everywhere at once. Staff are added with `npm run staff:add` or from Settings, never in the code.
- **Two roles.** Owners see profit and can change prices and settings; staff handle bookings, bikes, maintenance and the incident log. There is always at least one active owner, and nobody can remove their own owner access.
- **Requests can be checked out** without being accepted first (handing over the bike is the answer): the customer pays at the counter.
- **Early returns.** Checking in a Saigon round trip before its end date frees the remaining days (after the cleaning gap) so the bike can be rented again. The price doesn't change. One-way trips keep their train-back days.
- **Profit per bike** = revenue from rentals where the bike actually went out (counted in the period the rental started) minus the incident and repair log's parts, labour and other costs, plus anything recovered from the customer or insurer. Kept deposits from cancellations will be added once payments are recorded.
