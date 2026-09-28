# These things need to be done in Meal Planner v1.1 #

Current release: **v1.0.0** (2026-09-28). Format: [BACKLOG-FORMAT](https://github.com/kwpledger/kwpledger-design/blob/main/docs/BACKLOG-FORMAT.md).

Sections are in the order to work them, and so are the items inside each: the
first open item in the first section is the next thing to do. Don't ask Kevin
which to pick (`docs/WORKING-PREFERENCES.md`). Released work is in
[CHANGELOG.md](CHANGELOG.md); the reasoning and measurements behind everything
before v0.9 are in [HISTORY.md](HISTORY.md), which other docs cite by its old
item numbers.


## To Do (design) ##

Nothing open.

**Completed Items**

(none)


## To Do (sharing) ##

- [ ] **1.** Social cards for link previews, the way kwpledger.com does them (KWP-14 there). `index.html` has no `description` or Open Graph tags at all, so a LinkedIn share of the v1.0 launch showed only the page title and the domain: no image, no blurb. Needs:
    - [x] **a.** A 1200×630 PNG card built to `kwpledger-design`'s `docs/social-card-design-system.md`: dark register, pinned; one sentence, one name, one mark. Its reference implementation is `examples/social-card/` in that repo. Serve it from `public/og/`.
    - [x] **b.** Tags in `index.html`: `description`, `og:type`, `og:title`, `og:description`, `og:url`, `og:site_name`, `og:image` with its type, size and alt, and `twitter:card` as `summary_large_image`. `og:image` must be an absolute URL, since crawlers don't resolve relative ones. kwpledger-site's `BaseLayout.astro` is the working example.
    - [x] **c.** Copy: the portal's blurb is the obvious `og:description`. The card's one sentence is Kevin's call: *A written diet plan was not something I could actually read at 6am.* (2026-09-28). Card source and re-render steps: `docs/social-card/`.
    - [ ] **d.** After deploy, refresh LinkedIn's cached preview with its Post Inspector. LinkedIn keeps the old card for days otherwise.

**Completed Items**

(none)


## To Do (polish) ##

Moved up from the v1.0 polish section, which was deliberately outside the
running order. For v1.1 they are ordinary work.

- [ ] **1.** Display tags and ingredients drift apart. `meal.items` (the card chips) and `meal.ingredients` are maintained independently, so an ingredient added in the editor gets no chip and a renamed one leaves its old chip standing. **Not obviously "link them"**: the hand-written tags are better copy than matcher text. If picked up, *warn on drift* rather than *derive*. (HISTORY, Polish.)
- [ ] **2.** Decide whether `searchName` stays. It works, but no ingredient in production uses it; the seed's naming convention solved the cases it was built for. Keep it until a case arrives where USDA's wording would be unacceptable in the grocery list, the meal modal or the Cronometer export; retire it if that case never comes. (HISTORY, Polish.)
- [ ] **3.** Button hierarchy in the ingredient editor. Collapsing `bg-indigo-600` and `bg-slate-800` onto `--accent` put every primary button at the same weight. If that wants a hierarchy, the answer is a secondary *style*, not a second hue, and which buttons demote is a design call. (HISTORY item 2, step 3.)

**Completed Items**

(none)


## Later (not v1.1) ##

Deliberately **not** v1.1. Nothing here counts toward the release, and none of
it is the next thing to do until v1.1 ships.

- [ ] **1.** Compound ingredient lines. "Oats cooked in 1 cup 2% milk" matches only the oats; the milk becomes an unmatched `prepNote`. Moved out of v1.0 on 2026-09-28: Kevin's own board no longer has such rows, since he split them long ago. It comes back into scope with v2.0, where the app is meant to take other people's plans, which will arrive unsplit. **No design exists yet:** `docs/ROADMAP.md` records only that the problem exists.

**Completed Items**

(none)
