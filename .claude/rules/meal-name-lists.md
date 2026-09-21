---
paths:
  - "src/App.jsx"
  - "src/ingredientParser.js"
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

**The two lists have no link and never have.** Kevin typed the display tags by
hand, which is why `"Boneless, Skinless Chicken Breast"` carries a comma the
ingredient name doesn't. Nothing keeps them in sync, so an ingredient added
through the editor gets no display tag.

Linking them is a real design question rather than an obvious fix: the
hand-written tags are better copy than the matcher text, which is why there are
two fields in the first place.
