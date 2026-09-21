---
paths:
  - "src/ingredientParser.js"
  - "src/ingredientLibrary.js"
  - "src/nutritionApi.js"
---

# An ingredient's display name and its search term are separate fields

USDA's search is poor at generic whole foods — "sweet potato" returns *Sweet
potato tots, school*, "banana" returns *Banana, baked*. The wording that works is
knowledge the human has and the matcher doesn't.

Before `searchName` existed, the only place to put that wording was the display
name, so fixing what the matcher saw meant corrupting what the board showed.

`searchTermFor(ingredient)` resolves `searchName` → `raw` → `name`, and **all
three matching entry points go through it.** Don't add a fourth that reads
`name` directly.

The field is optional and its absence behaves exactly as before, which is why it
needed no migration and **no `SCHEMA_VERSION` bump**. That was deliberate: a
bump would make an older client *refuse* a board carrying the field rather than
ignore it, which is the wrong failure for a two-machine setup.
