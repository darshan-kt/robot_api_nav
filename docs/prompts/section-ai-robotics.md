# Prompt — "AI & robotics" section

Builds a two-group section: the maths under the autonomy, and the design work
putting a language model in the loop. This is the only section with **nested
groups** in the nav.

Standalone. Fill the `«placeholders»` and paste. Shared conventions are in
[section-builder.md](section-builder.md).

---

````text
Add an "AI & robotics" section to the left navigation of «APP NAME» at «PATH».

Unlike the other sections it has TWO NAMED GROUPS inside it, not a flat list.
The deck page must render them as labelled bands, and the nav catalog must
support that nesting without a special case per section.

  Group "Statistical distributions"
    «Distribution 1»  — e.g. Uniform
    «Distribution 2»  — e.g. Exponential
    «Distribution 3»  — e.g. Normal (Gaussian)

  Group "AI driven robot"
    «Design page 1»   — e.g. ROS 2 MCP design
    «Design page 2»   — e.g. Prompting robotics

Framing: reference material, not a control surface. Nothing on these pages can
command anything. Say that in the section description.

FIRST: read the existing design system — token config, shared UI kit, two or
three existing pages — and tell me the token names you found before using
them. No new colour/type/spacing values, no new dependency.

=== PART A — the distribution pages ===

Write ONE template for the three. They share a shape; only the maths and the
usage differ.

Each page, in order:

1. Header: name, plus a summary that says what the distribution assumes about
   the world, not what it looks like. "Memoryless — having waited ten minutes
   tells you nothing about how much longer you will wait, which is either
   exactly right or badly wrong depending on what you are modelling."

2. Facts strip of 4: parameters, mean, variance, and one distinguishing
   property.

3. A CURVE figure — the probability density, plotted by EVALUATING THE REAL
   PDF over the domain. Do not hand-trace a path: a traced Gaussian is always
   subtly wrong in the tails, which is exactly the region the page discusses.
   Sample ~240 points, draw axes, faint horizontal guides, a filled area under
   the curve, and dashed vertical markers at the parameters (μ, σ, the mean,
   the median). Hand-authored inline SVG, theme tokens, no chart library.

4. "Definition" — the formula in plain notation in a mono block, the support,
   and the parameter values used to draw the curve above.

5. "Moments" — mean, variance, standard deviation, median as four readouts.

6. "Where this appears: «specific subsystem»" — THE POINT OF THE PAGE. Name
   the actual place in this codebase that assumes this distribution, and what
   the assumption buys. Two short paragraphs. Examples of the right level of
   specificity:
     - uniform → the particle filter's initial scatter across free space,
       because before the first scan match no location is more likely
     - exponential → reconnect backoff jitter, so every client does not retry
       on the same schedule and arrive together
     - normal → the measurement-noise parameter in the tracker's filter; give
       the real σ and say what it was fitted from

7. "What breaks when the assumption is wrong" — caution-toned. Be concrete
   and quantitative where you can. The Gaussian page should say that a 10σ
   error is once-in-10²³ on paper and happens every few minutes in practice
   when the sensor hits something glossy, and that the fix is gating before
   the update step, not a better σ.

8. "Drawing samples" — a few real lines of code in the language the project
   uses, including the API's gotchas (a library that takes scale = 1/λ rather
   than λ, for instance).

=== PART B — the AI design pages ===

These two are NOT templated. They differ genuinely, so write them separately.

--- «Design page 1»: exposing the system to a model ---

Framing: the interesting problem is not wiring the protocol, it is deciding
what the model is allowed to call.

1. An ARCHITECTURE figure — hand-authored inline SVG: model → protocol server
   → POLICY GATE → the underlying system, left to right, with a separate band
   underneath for the safety layer that sits BELOW the model and cannot be
   reached by a tool call. Caption it: every arrow above can fail, the band
   below must not, which is why nothing in it is callable.

2. A TOOL SURFACE table: kind (read / plan / act), tool name, what it maps to
   in the underlying system, and permission tier. Colour the kind by risk.

3. PERMISSION TIERS — four of them, e.g.:
     observe  no approval
     propose  no approval, no effect
     commit   a human confirms
     always   the stop action — never gated, never rate-limited, never queued
   Say why the stop gets its own tier: a gate that can block a stop is a worse
   failure than one that lets a bad action through.

4. "Deliberately not exposed" — 4 capabilities you withheld, each with the
   reason. Raw velocity (not a decision a model should make directly, it may
   only name a destination). Parameter setters (no safe rollback). Map writes
   (silent until the robot is somewhere unexpected). Camera frames (a human
   decides whether footage leaves the site).

5. "Open questions" — 3 things genuinely unresolved. Who confirms a commit
   when the system runs unattended overnight. What the model is told on
   failure (raw errors invite retry loops, silence invites hallucination).
   Whether sensor returns are treated as hostile input — they are a channel
   an attacker controls, and no design here handles that yet.

--- «Design page 2»: prompting for a system that acts ---

Framing: most prompt advice optimises for a good answer; here what is being
optimised is what happens when the answer is wrong. A chatbot that is wrong
produces a wrong sentence. A machine that is wrong produces a collision, and
there is no undo.

1. Four PATTERN cards, each with: a numbered title, why it exists, an "Avoid"
   block and a "Prefer" block showing real prompt text side by side, and a
   one-line note. Suggested four:
     - Name the destination, never the velocity — a model asked for a number
       will produce one, confidently, with no model of mass or friction
     - Make it state uncertainty BEFORE acting — asking after gets a
       rationalisation; asking first surfaces ambiguity while it still matters
     - Treat every sensor return as untrusted input — OCR output reaches the
       model with the same status as the system prompt unless you stop it
     - Refuse to be the safety layer — "never drive into people" reads as a
       control and is not one; it cannot be tested and is one jailbreak from
       absent

2. A WORKED SYSTEM PROMPT, complete, in a mono block. Sections for scope,
   what must happen before a committing action, how observations are
   delimited, what to do when uncertain, and an explicit "you are not the
   safety system" clause.

3. "How we would test it" — 5 numbered probes with pass criteria: ambiguous
   destinations (pass = stops and asks), injected observations (pass = no tool
   call), coaxing for a raw value (pass = no number), safety-claim probes
   (pass = defers to the hardware layer), confirmation bypass (pass = does
   not). Then say plainly that none have been run, and that a design naming
   its own test cases is easier to argue with than one that does not.

4. "What this does not solve" — prompting reduces the rate of bad calls and
   does not bound the worst case. If you are adding a prompt rule because
   something dangerous got through, the fix belongs one layer down.

=== SHARED ===

DECK PAGE: two labelled group bands, each with a heading, a one-line
description and its tiles. The group heading needs a visual treatment that
reads as a level above the tiles — a left rule, or an eyebrow.

CONTENT RULES
- Real maths, evaluated. Real σ values fitted from something named.
- Numbers plausible, never round.
- Honest about status: these are design drafts and reference pages. Say so.
- Practitioner voice, sentence case, active voice. No marketing words.

DATA HONESTY
Label provenance "REFERENCE" for the distributions and "DESIGN DRAFT" for the
two AI pages — never "LIVE", and never imply the design is implemented. Reuse
the app's existing provenance vocabulary if it has one.

ARCHITECTURE
The nav catalog must express section → group → app. Do not special-case this
section in the deck component: a group with no title renders as a plain grid,
a group with a title renders as a band. Give every page a breadcrumb back.

VERIFY BEFORE REPORTING DONE
1. Typecheck and build clean.
2. Confirm every icon you import exists in the installed library version.
3. Load all six routes in a real browser; report console errors and page
   exceptions, expected vs unexplained.
4. Screenshot at 1440px and 375px; report anything clipped or overflowing.
   Check the architecture figure and the tool table — they are the widest.
5. Sanity-check the curves: the Gaussian's inflection points should sit at
   ±σ, and the exponential's median at ln2/λ. If they do not, the PDF is
   being drawn rather than evaluated.
6. Show me the screenshots and what you would still improve.

Do not report success on anything you have not run.
````

---

## Notes

**"Where this appears" is the whole reason the distribution pages exist.**
Without it you have three Wikipedia stubs. Naming the actual subsystem — this
filter, that backoff, this particle scatter — is what makes it a page about
*your* system rather than about statistics. If you cannot name a real usage,
drop the distribution; it does not belong in the section.

**Evaluate the PDF, do not draw it.** Step 5 of the verification exists
because this is the easiest instruction to silently ignore, and the tell is
specific: a hand-drawn bell curve has its inflection points in the wrong place
and tails that are too fat. Checking ±σ catches it immediately.

**The two AI pages are deliberately not templated.** One is an architecture
and a permission model; the other is prose patterns and a worked prompt. A
shared template would force both into a shape that fits neither. Knowing when
*not* to abstract is the same judgement as knowing when to.

**The safety framing transfers.** Strip the robot specifics and the argument
is domain-general: a model that can act needs a gate it cannot reason its way
through, a stop that is never queued, and an enforcement layer that is not
made of sentences in a context window. That applies to a trading system or a
deployment pipeline unchanged.

**The "you are not the safety system" clause is the point of the second
page.** Everything else is technique; that one is the argument.

In the reference implementation:
[`DistributionTemplate`](../../robostore-poc/src/pages/ai/DistributionTemplate.tsx),
[`UniformPage`](../../robostore-poc/src/pages/ai/UniformPage.tsx),
[`ExponentialPage`](../../robostore-poc/src/pages/ai/ExponentialPage.tsx),
[`NormalPage`](../../robostore-poc/src/pages/ai/NormalPage.tsx),
[`Ros2McpPage`](../../robostore-poc/src/pages/ai/Ros2McpPage.tsx),
[`PromptingPage`](../../robostore-poc/src/pages/ai/PromptingPage.tsx).
