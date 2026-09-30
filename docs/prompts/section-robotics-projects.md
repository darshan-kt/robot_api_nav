# Prompt — "Robotics projects" section

Builds a behaviour-package section: one page per autonomous behaviour, each
showing the control loop, the tuned parameters, a measured bench run, and what
breaks it.

Standalone. Fill the `«placeholders»` and paste. Shared conventions are in
[section-builder.md](section-builder.md).

---

````text
Add a "Robotics projects" section to the left navigation of «APP NAME» at
«PATH».

Each project is an autonomous behaviour you could load onto the platform. They
all run over the same sensor set — what differs is what each decides to do
with it. Make that the framing.

APPS (one page each)

  «Project 1» — «one-line behaviour, e.g. PID on a thresholded floor stripe»
  «Project 2» — «one-line behaviour»
  «Project 3» — «one-line behaviour»
  «Project 4» — «one-line behaviour»

Plus a deck page listing all four as tiles.

FIRST: read the existing design system — token config, shared UI kit, two or
three existing pages — and tell me the token names you found before using
them. No new colour/type/spacing values, no new dependency.

BUILD ONE TEMPLATE

These four pages share a real shape: sensors in, a decision loop, a command
out, and a bench run that says how well it held. Write ONE template and have
each project supply only what differs. Give the template an optional "extra"
slot so a project can add the one panel the others do not need, rather than
growing a boolean flag per project.

PAGE ANATOMY — same order for all four

1. Header: icon, project name, and a one-sentence summary that names the hard
   part. Not what it does — what is difficult about it. "The hard part is not
   following; it is deciding which person, and refusing to follow anyone else
   once that decision is made."

2. Facts strip of exactly 4: sensors used, loop rate, controller type, top
   speed (or the equivalent four for «DOMAIN»).

3. A PIPELINE figure: the processing chain left to right, 4-5 stages, each a
   box with a stage name and a one-line detail under it, arrows between.
   Hand-authored inline SVG using theme tokens, no chart library. Let it
   scroll horizontally on narrow screens rather than shrinking illegibly.

4. "How the loop runs" — numbered steps, one per pipeline stage. Each step is
   a bold title plus two sentences. Write these as decisions with reasons,
   not descriptions:
     - "Look only where the line can be" — and why cropping cuts work 75%
     - "Threshold in HSV, not RGB" — and why RGB fails after noon
     - "Stop when the line is gone" — and why guessing is how robots hit walls
   At least one step must explain a choice that is non-obvious and would be
   got wrong by someone implementing it from scratch.

5. "Tuned parameters" — the gains, thresholds and limits someone would
   actually retune on a new site. Real values: "Kp 0.0042", "0.35 Bhatt.",
   "min blob area 400 px". Include the ones set to zero and be ready to say
   why in the steps above.

6. "Bench run" — 4 headline numbers from a real-looking run, plus a trace
   (sparkline or equivalent) underneath with a caption that explains its
   shape. The caption is the point: "the two spikes are the 90° corners,
   where the stripe leaves the crop window before the turn completes."

   At least one metric must be imperfect. "24/25 laps", "88.6% retained",
   "2 false locks". A page where everything succeeded is not a bench run.

7. "What breaks it" — caution-toned, 3 concrete failure modes. One of them
   must be the specific failure visible in the metrics above: if you reported
   24/25 laps, explain the lap that failed, what the sensor saw, and what
   would have caught it.

DECK PAGE

Tiles for the four projects, plus a footer comparison table: project, sensors
used, speed, loop rate, RISK, and a one-line "why". Risk is not difficulty —
it is what a failure can physically reach. Say that explicitly under the
table, and make the point that the fiddliest project to tune is often the
least dangerous.

If one project is meaningfully riskier than the others — it follows a person,
it runs unattended — give that page an extra panel saying so, and show that
its parameters are biased toward stopping: a hard floor that ignores the
controller, a lost-target timeout that halts rather than re-targets, a speed
cap below walking pace.

CONTENT RULES

- Parameters must look tuned, not chosen: "0.0042", not "0.5". A round gain
  is a gain nobody measured.
- Every project needs a stop condition described explicitly — what it does
  when its input disappears. "Publishes zero velocity rather than steering on
  its last estimate."
- Failure modes are physical: glare thresholding identically to tape, two
  people in dark jackets under the re-ID threshold, a floor expansion joint
  reading dark, a fire door narrowing a corridor.
- Practitioner voice, sentence case, active voice. No marketing words.

DATA HONESTY

«Describe your real data state — e.g. these are recorded bench results, not a
live run.»

Label provenance honestly ("BENCH RESULTS"), never "LIVE". Reuse the app's
existing provenance vocabulary if it has one. State the caveat once in the
shared page frame.

ARCHITECTURE

Register the section and its apps in the app's nav catalog; the rail, deck and
routes all derive from it. Build the pipeline figure as a reusable primitive.
Give every page a breadcrumb back to the deck.

VERIFY BEFORE REPORTING DONE

1. Typecheck and build clean.
2. Confirm every icon you import exists in the installed library version.
3. Load all five routes in a real browser; report console errors and page
   exceptions, expected vs unexplained.
4. Screenshot at 1440px and 375px; report anything clipped or overflowing.
   Check the pipeline figure specifically — it is the widest thing here.
5. Check each page fills the viewport.
6. Show me the screenshots and what you would still improve.

Do not report success on anything you have not run.
````

---

## Notes

**The summary should name the hard part, not the behaviour.** "Follows a
person at a set standoff" is a label. "The hard part is not following — it is
deciding which person, and refusing to follow anyone else once that decision
is made" tells the reader you have built one.

**Require an imperfect metric.** This is the single highest-leverage line in
the prompt. Four projects that all worked perfectly read as fiction; "24/25
laps" followed by an explanation of the lap that failed reads as a lab
notebook. It also forces the failure section to be specific, because one of
the three failures has to account for a number already on the page.

**Risk ≠ difficulty.** Making the deck table say so out loud is worth a
sentence: the line follower is the fiddliest to tune and the safest by a wide
margin; the patrol loop is ordinary navigation code that runs unattended in a
building at night. That distinction is the closest this section gets to
engineering judgement, and it transfers to any domain — replace "what it can
physically reach" with "what a failure can touch" and it works for finance or
infrastructure equally.

**Use a template, but let one page escape it.** The `extra` slot is what stops
the template becoming a straitjacket. Without it, you either get four
identical pages or a template with a flag per project.

In the reference implementation:
[`ProjectTemplate`](../../robostore-poc/src/pages/projects/ProjectTemplate.tsx),
[`LineFollowingPage`](../../robostore-poc/src/pages/projects/LineFollowingPage.tsx),
[`ObjectTrackingPage`](../../robostore-poc/src/pages/projects/ObjectTrackingPage.tsx),
[`HumanFollowerPage`](../../robostore-poc/src/pages/projects/HumanFollowerPage.tsx),
[`PatrollingPage`](../../robostore-poc/src/pages/projects/PatrollingPage.tsx).
