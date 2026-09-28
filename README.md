# Meal Planner

A visual meal-plan board, because a written diet plan was not something I could
actually read at 6am. It turns a seven-day plan into cards you can see, drag and
rearrange, with the macros and the grocery list following along.

**Live:** [meal-planner.kwpledger.com](https://meal-planner.kwpledger.com)

It's a personal, single-user app, built for one plan and one person. Nothing
stops you running your own copy, but the seed board is mine.

## What it does

- **The board.** Seven days, four meals each, colour-coded by meal and labelled
  in text, so the colour is never the only cue.
- **Drag and swap.** Move a meal to another day, or swap two meals in place.
- **Macro breakdowns.** Carbs, protein and fat per meal and per day, and a
  running calorie total for the week.
- **Grocery list.** Built from whatever the board currently holds, grouped by
  ingredient, with every place each one is used. A printable prep sheet and a
  copy-paste list for Cronometer come from the same data.
- **Nutrition matching.** Each ingredient can be matched against USDA
  FoodData Central, falling back to Open Food Facts, with its amount converted
  to grams. Matches are advisory: the plan's own figures stay on screen until
  you choose to recompute, see the before and after, and apply it.
- **Manual cloud sync.** Push the board up from one device and pull it down on
  another. Nothing syncs on its own, so nothing is overwritten behind your back.
  The board is also saved in the browser, and can be exported and imported as
  JSON.

## Running it

1. `npm install`
2. Copy `.env.example` to `.env` and fill in `VITE_USDA_API_KEY`, a free key
   from [api.data.gov](https://api.data.gov/signup/). Without it the board
   still works; only nutrition lookups fail.
3. `npm run dev` for the local dev server.
4. `npm run build` for a production build, and `npm test` for the tests.

**`npm run dev` can't sync**, and that's expected. Sync is a Cloudflare Pages
Function, and Vite's dev server doesn't serve those. To exercise sync locally,
build first and run `npx wrangler pages dev dist`.
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) has the detail.

## Stack

React 19, Vite and Tailwind CSS v4, styled with the
[`@kwpledger/design`](https://github.com/kwpledger/kwpledger-design) system,
hosted on Cloudflare Pages with one Pages Function and Workers KV for sync.

## License and links

Licensed under the [GPL-3.0](LICENSE).

Part of [kwpledger.com](https://kwpledger.com).
