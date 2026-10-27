---
paths:
  - "src/App.jsx"
  - "src/ingredientParser.js"
  - "src/displayTags.js"
---

# A meal carries two name lists, and they are not interchangeable

`meal.items` is the human-readable display list the meal cards render
(`"Quinoa"`, `"Cod"`, `"Brown Rice"`). `meal.ingredients[].name` / `.raw` is the
matcher's input, and the seed deliberately writes USDA-friendly text there —
`"1 banana, raw"`, `"6 oz cod, raw"`, `"0.75 cup brown rice, raw"` are all
original, not corruption.

**Check `items` before making any claim about what is on screen.** A session
inspecting only `ingredients` concluded the visible board had been corrupted
with search terms. It had not. The cards never read that field.

**Since 2026-10-27 `items` is derived on Save, by `syncDisplayTags` in
`src/displayTags.js`.** A tag was always meant to be its ingredient without
the amount (Kevin, 2026-10-27), and the first seed's tags were exactly that
(`"Orange"`, `"Banana"`). His 2026-08-09 naming pass then pluralised some
(`"Navel Oranges"`, `"Bananas"`) and added the comma in `"Boneless, Skinless
Chicken Breast"`. The derivation keeps existing tags so that pass survives: only
a renamed, added or no-longer-matching ingredient gets a generated tag.

`docs/HISTORY.md` says the hand-written tags were kept apart because they are
"better copy" than matcher text. That was a session's inference, not Kevin's
reasoning - his only recorded words were *"that's polish, not load bearing."*
Don't build on it. The link is positional (tag *i* ↔ ingredient *i* when the editor opens),
carried through edits by ingredient id.

**Tags are not hand-editable, on purpose** - Kevin's call. Don't re-add the
textarea. Anything else that writes `ingredients` (bulk Normalize, JSON import,
cloud pull) leaves `items` alone; the next Save of that meal reconciles it.
