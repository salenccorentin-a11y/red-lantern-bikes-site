# Design: "Lantern Night"

Chosen 15 October 2026. The look grows out of the Red Lantern catalogue (navy and lantern red, the lantern-with-star logo) and the business's own riding photos.

## Who and what for

Tourists, backpackers and expats planning a ride, mostly on phones, often comparing several rental shops. The site's job: make them trust a small District 1 shop enough to book a bike online, especially the long one-way trip to Hanoi or Da Nang.

## Palette

| Token | Hex | Use |
| --- | --- | --- |
| Night | `#0F1B2D` | Header, footer, hero and route bands; text on light |
| Night raised | `#1A2C4A` | Panels on dark (booking ticket, route stops) |
| Lantern | `#D62A1E` | The one action colour: Book buttons, active states |
| Star | `#FFCC00` | The lantern's star: route stops, rating, tiny highlights on dark only |
| Paper | `#FFFFFF` | Main reading background, bike cards |
| Mist | `#EEF2F7` | Alternate light sections (cool, not cream) |
| Slate | `#4A5872` | Secondary text on light (7:1 on white) |
| Fog | `#AAB6CB` | Secondary text on dark |

White on Lantern is 5:1; body text is Night on Paper.

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
3. **Red means "book".** Lantern red is reserved for the main action, so it's always obvious what to press.
4. **Light to read, night to frame.** Dark bands frame the page; reading happens on white.

## Review against the brief

Checked the first draft for template defaults and changed:
- A fully dark site (the "near-black plus one bright accent" look) → dark only for framing bands; content on white and mist.
- Uppercase eyebrow labels above every heading → removed; headings carry the hierarchy.
- Arrows appended to links and dot-joined meta lines → plain link text.
- Identical cards everywhere → photo tiles, white bike cards and the ticket each have their own form.
- Numbered markers only where the content is a real sequence (how booking works, the route).
