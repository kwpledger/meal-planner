# Meal Planner social card

The 1200×630 link-preview image served as `og:image` from
`public/og/meal-planner.png`. Built to `kwpledger-design`'s
`docs/social-card-design-system.md`, and a copy of that repo's reference card
(`examples/social-card/`) with two changes: the headline, and the domain in the
footer.

| | |
| :-- | :-- |
| Headline | *A written diet plan was not something I could actually read at 6am.* Kevin's choice, 2026-09-28, taken from the portal blurb. `read at 6am.` is the accent phrase, held together with non-breaking spaces so it never splits across lines. |
| Register | Dark, pinned, as the spec requires |
| Mark | `logo_long_ring_inv_teal.svg`, from the pinned `@kwpledger/design` package |

## Re-rendering it

1. `npm install`. The page loads its fonts and mark from
   `node_modules/@kwpledger/design/`.
2. Open `docs/social-card/index.html` and screenshot the `.card` element at
   1× device pixel ratio, clipped to 1200×630. PNG, not JPEG.
3. Replace `public/og/meal-planner.png`.
4. Check the spec's preflight: exactly 1200×630, overflow 0, both fonts loaded
   (a fallback serif changes the wrap), four lines with the accent phrase whole
   on the last.

After it deploys, ask LinkedIn's Post Inspector to re-read the URL. LinkedIn
caches previews for days.
