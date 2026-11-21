# Design: "Lantern Night"

Chosen 15 October 2026. The look grows out of the Red Lantern catalogue (navy and lantern red, the lantern-with-star logo) and the business's own riding photos.

## Who and what for

Tourists, backpackers and expats planning a ride, mostly on phones, often comparing several rental shops. The site's job: make them trust a small District 1 shop enough to book a bike online, especially the long one-way trip to Hanoi or Da Nang.

## Palette

Recoloured 21 November 2026 at the owner's request: **Egyptian blue** frames the page, **stone blue** carries the quiet greys, and a little **scarlet** is kept for the one thing to press.

| Token | Hex | Use |
| --- | --- | --- |
| Night (deep Egyptian blue) | `#0C2270` | Header, footer, hero and route bands; headings and body text on light |
| Night raised / Egyptian | `#1034A6` | The pigment itself: panels on dark (booking ticket), Vietnam on the map, text links, selected text |
| Night line | `#2F52C2` | Lines and disabled buttons on dark |
| Lantern (scarlet) | `#DE2E0C` | The one action colour: Book buttons, route line, link underlines, focus ring |
| Lantern deep / ink | `#B02207` | Button hover; error and warning text on light |
| Star | `#FFCC00` | The lantern's star: route stops, rating, tiny highlights on dark only |
| Paper | `#FFFFFF` | Main reading background, bike cards |
| Mist (light stone blue) | `#DFE7EE` | Alternate light sections |
| Slate (dark stone blue) | `#4A6073` | Secondary text on light (6.5:1 on white) |
| Fog (pale stone blue) | `#B4C4D3` | Secondary text on dark |
| Stone | `#8299AE` | Unlit lanterns and quiet details on the map |
| Rule / field line | `#CDD8E1` / `#71879B` | Dividers / borders of form fields (3:1 on mist) |

White on scarlet is 4.7:1, white on Night 14:1; body text is Night on Paper. Scarlet on Night is 3:1, so red buttons stay visible on the dark bands. Text links are Egyptian blue with a scarlet underline, so red text only ever means "book" or an error.

## Type

One family: **Be Vietnam Pro** (designed for Vietnamese, so place names keep their accents properly). Headings 800 with slightly tight tracking; body 400 at 16–18px, line-height 1.6; lines under ~70 characters. Scale: 14 · 16 · 18 · 22 · 28 · 36 · 52 · 72.

## Layout

```
┌ Night header: lantern + name · nav · [Book a bike] ┐
│ Hero: full-bleed riding photo, headline bottom-left │
│       over a night gradient, two actions            │
├ Route band (signature) ─────────────────────────────┤
│ Saigon ●━━━━━━━━━● Da Nang ━━━━━━━━━● Hanoi          │
│        7+ days          12+ days                     │
├ Light: ways to ride (photo tiles), popular bikes ───┤
├ Night: riders wall (real customers) ────────────────┤
├ Light: included + how booking works (numbered) ─────┤
└ Night footer with the lantern ──────────────────────┘
```

Content pages open with a night band (title, one line, sometimes a photo) and read on white. Text is left-aligned throughout. Radii follow hierarchy: photos 14px, cards 12px, inputs 8px, buttons fully rounded.

## Principles

1. **Photos do the talking.** Real roads, real riders, real bikes. No illustrations, no gradients for decoration.
2. **One bold thing: the route.** The Saigon → Da Nang → Hanoi line with the lantern's gold stops is the memorable element; everything around it stays quiet.
3. **Red means "book".** Scarlet is reserved for the main action (and error text), so it's always obvious what to press.
4. **Light to read, night to frame.** Dark bands frame the page; reading happens on white.

## Review against the brief

Checked the first draft for template defaults and changed:
- A fully dark site (the "near-black plus one bright accent" look) → dark only for framing bands; content on white and mist.
- Uppercase eyebrow labels above every heading → removed; headings carry the hierarchy.
- Arrows appended to links and dot-joined meta lines → plain link text.
- Identical cards everywhere → photo tiles, white bike cards and the ticket each have their own form.
- Numbered markers only where the content is a real sequence (how booking works, the route).
