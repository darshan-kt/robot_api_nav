# Reusable prompt — building a multi-section reference console

This is the prompt that produced ROBOSTORE's **Robot sensors**, **Robotics
projects** and **AI & robotics** sections, generalised so it works on any
project.

Copy the block in [The prompt](#the-prompt), fill the `«placeholders»`, paste.
[Why each instruction is there](#why-each-instruction-is-there) explains what
each clause is defending against — read it before deleting anything, because
most of the clauses exist to prevent a specific failure.

## Which prompt do you want?

This page is the **generic** version — use it when you are adding sections of
your own design. If you want one of the three sections rebuilt as-is on
another app store, use the detailed per-section prompt instead; each is
standalone and specifies page anatomy panel by panel.

| Prompt | Builds | Shape |
|---|---|---|
| [section-robot-sensors.md](section-robot-sensors.md) | Perception hardware reference — one page per sensor | 4 apps, flat |
| [section-robotics-projects.md](section-robotics-projects.md) | Autonomous behaviour packages — loop, parameters, bench run | 4 apps, flat, one shared template |
| [section-ai-robotics.md](section-ai-robotics.md) | Distributions + LLM-in-the-loop design | 5 apps in **2 named groups** |

The three are independent — build one, or all three, in any order.

---

## The prompt

````text
I want to add «N» new sections to the left navigation of «APP NAME» at «PATH».

STRUCTURE

Rail section: «Section A name»
  apps: «App 1» · «App 2» · «App 3» · «App 4»

Rail section: «Section B name»
  apps: «App 1» · «App 2» · «App 3» · «App 4»

Rail section: «Section C name»
  group "«Group 1 name»": «App 1» · «App 2» · «App 3»
  group "«Group 2 name»": «App 1» · «App 2»

Each section gets a landing "deck" page listing its apps as tiles. Each app
gets its own page. Existing sections and routes keep working.

BEFORE YOU WRITE ANY CODE

Read the existing design system first — the token config, the shared UI kit,
and two or three existing pages. Match what is there. Do not introduce new
colour, type, spacing or radius values, and do not add a dependency (no chart
library, no icon set, no font). If something is genuinely missing from the
system, say so and propose it rather than inlining a one-off value.

Tell me the token names you found before you use them, so I can correct you
early if you misread the system.

ARCHITECTURE

Put the whole information architecture in ONE catalog module: sections →
optional groups → apps, with id, title, one-line blurb, route, icon. The rail,
every deck page, and the route table must all derive from that catalog. I do
not want the nav declared in three places that can drift apart.

Give the catalog a lookup that resolves a route to its app + owning section,
and make it throw on an unregistered route, so a typo fails at import rather
than rendering a page with a blank header.

Write ONE generic deck component that renders whatever the catalog declares: a
group with no title becomes a plain tile grid, a group with a title becomes a
labelled band. Adding a section later should be a catalog entry, not a new
component.

Where several app pages share a shape, write one template and have each page
supply only what differs. Where they genuinely differ, write them separately.
Use your judgement and tell me which you chose and why.

CONTENT — this is the part that usually goes wrong

Every page must carry real domain substance. Specifically:

- Use real part numbers, real units, real interface names, real terminology
  from «DOMAIN». If you are unsure of a figure, say so in your summary rather
  than inventing a confident number.
- Numbers must be plausible, not round. "0.34 m/s", "5.5 rev/s", "±1.1 mm",
  "48.3 s" — never "50%", "100 units", "10x".
- Every page needs an honest limitations section: "where it fails", "what
  breaks it", "what this cannot tell you". A reference page that only lists
  capabilities is marketing, and it is the single clearest tell that nobody
  who does this work wrote it.
- No lorem ipsum, no "Acme", no placeholder names, and none of: elevate,
  seamless, unleash, next-gen, game-changer, leverage, robust, cutting-edge.
- Write in the voice of a practitioner explaining a system to a colleague.
  Sentence case headings. Active voice.

DATA HONESTY — non-negotiable

«Describe your app's real data state, e.g.: These pages have no live backend
behind them.»

So: never label stub content as live. Give each page an honest provenance
label — "SPEC SHEET", "RECORDED BAG", "BENCH RESULTS", "DESIGN DRAFT",
"REFERENCE" — and if the app already has a provenance or status convention,
reuse that vocabulary exactly rather than inventing a parallel one. State the
caveat once, in the shared page frame, not seventeen times.

VISUALS

Each page needs at least one figure that shows something real about its
subject — not a decorative icon and not a generic bar chart.

Hand-author them as inline SVG using the theme tokens. Do not add a charting
dependency: its defaults will fight the design system, and these are static
figures.

Where a figure plots a function, evaluate the real function. Where it shows
measured data, derive it from real geometry or real parameters. A hand-traced
curve is always subtly wrong in exactly the region the page is discussing.

Build the figures as reusable primitives in one module, not inline per page.

NAVIGATION

Every app page needs a breadcrumb back to its section deck. The rail only
moves between sections, so without one an app page is a dead end for anyone
arriving by link.

The rail's active state must light the owning section when you are on any app
inside it, not just on the deck itself.

VERIFY BEFORE YOU TELL ME IT IS DONE

1. Typecheck and build. Both clean.
2. Confirm every icon/import you used actually exists in the installed
   version of the library before importing it.
3. Load every new route in a real browser and report console errors and page
   exceptions. Expected, explained errors are fine; unexplained ones are not.
4. Screenshot at 1440px and 375px. Report anything clipped, overflowing,
   truncated or horizontally scrolling.
5. Measure whether each page actually fills the viewport. A deck with four
   tiles and 450px of dead canvas below them is not finished — either the
   content is too thin or the layout is wrong. Tell me which.
6. Show me the screenshots and say what you would still improve.

Do not report success on anything you have not actually run.
````

---

## Why each instruction is there

Each clause below maps to a specific failure that happens without it.

| Clause | Without it |
|---|---|
| Read the design system first, report the tokens | A parallel set of hardcoded colours appears next to the real ones, and the new pages look adjacent to the product rather than part of it. |
| One catalog, everything derives from it | Nav gets declared in the rail, again in each deck, and again in the routes. At 17 apps one copy drifts and the rail points at a route no deck lists. |
| Lookup throws on unregistered route | A mistyped route renders a page with a blank header and no error — found weeks later. |
| One generic deck component | Four near-identical deck files that immediately start diverging in spacing and heading treatment. |
| Template where pages share a shape | Either four copy-pasted 200-line files, or one over-parameterised template with a flag per page. Asking for a judgement call plus a rationale gets a defensible answer. |
| Plausible, non-round numbers | `50%`, `100ms`, `10x` everywhere. Round numbers are the fastest way to signal that nobody measured anything. |
| Mandatory limitations section | Capability-only pages that read as a brochure. This one clause does more for credibility than any styling instruction. |
| Named banned words | Otherwise you get "seamlessly elevate your robotics workflow". |
| Data-honesty block | Stub data rendered with a green LIVE badge. On an operations console that is not cosmetic — it teaches operators to trust a number that is not true. |
| Reuse the existing provenance vocabulary | A second, parallel status language that means almost the same thing as the first. |
| No charting dependency | A library whose default palette, fonts and tooltips override the design system, plus a dependency added for six static figures. |
| Evaluate the real function | Hand-traced curves are wrong in the tails — exactly the region a distribution page exists to talk about. |
| Figures as reusable primitives | Seventeen bespoke inline SVGs with seventeen slightly different stroke weights. |
| Breadcrumbs | Deep-linked pages become dead ends. |
| Rail lights the owning section | You navigate into an app and the rail shows nothing selected, so you lose your place. |
| Verify icons exist first | Hallucinated imports from the wrong library version. This one bites constantly. |
| Report console errors, explained vs not | "It works" with a red console. |
| Screenshot at two widths | Mobile is broken and nobody notices, because nobody looked. |
| Measure viewport fill | Pages that technically render but are 60% empty canvas. Catching this is what turned two thin decks into a sensor coverage matrix and a project risk comparison. |
| "Do not report success on anything you have not run" | The most important line in the prompt. |

---

## Adapting it to a different domain

The prompt is domain-agnostic except for the content section. Swap `«DOMAIN»`
and give three or four examples of the kind of specificity you want — that is
what calibrates the output more than any other edit.

| If your domain is | The "real substance" looks like |
|---|---|
| Robotics | Part numbers, ROS topics and message types, ranges, rates, FOV, tuned gains |
| Finance | Instruments, venues, settlement windows, fee schedules, real tickers |
| Healthcare | Device model numbers, sampling rates, reference ranges, coding systems |
| DevOps / infra | Service names, SLOs, real latency percentiles, retry and timeout values |
| ML platform | Architectures, parameter counts, dataset names, measured eval numbers |

Keep in every case: the non-round-numbers rule, the mandatory limitations
section, the data-honesty block, and the verification list. Those four are what
separate a page that reads as written by a practitioner from one that reads as
generated.

---

## What it produced here

For reference, the run this prompt is derived from:

- **Catalog** — [`src/lib/appCatalog.ts`](../../robostore-poc/src/lib/appCatalog.ts):
  `SectionDef → AppGroup → AppDef`, plus `appMeta()` which throws on an
  unregistered route. Drives the rail, all four decks, and 21 routes.
- **Generic deck** — [`SectionDeck.tsx`](../../robostore-poc/src/components/layout/SectionDeck.tsx),
  with `children` and `footer` slots so a deck can add content above or below
  its tile grid.
- **Page frame** — [`AppPage.tsx`](../../robostore-poc/src/components/layout/AppPage.tsx):
  breadcrumb, header, facts strip, and the provenance caveat stated once.
- **Figure primitives** — [`Viz.tsx`](../../robostore-poc/src/components/ui/Viz.tsx):
  `Curve`, `PolarScan`, `AxisBars`, `RangeCone`, `Pipeline`, `Sparkline`,
  `DepthFrustum`. No dependency.
- **Templates** — `ProjectTemplate.tsx` and `DistributionTemplate.tsx`, each
  backing several pages; the two AI design pages are written separately
  because they genuinely differ.
- **13 app pages** across `src/pages/sensors/`, `projects/`, `ai/`.

Two things from the verification step that would have shipped broken
otherwise: the facts strip truncated values on mobile, and two decks left
~450px of dead canvas — which is why they now carry a sensor coverage matrix
and a project risk comparison instead of empty space.
