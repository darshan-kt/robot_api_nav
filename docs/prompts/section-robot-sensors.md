# Prompt — "Robot sensors" section

Builds a perception-hardware reference section: one page per sensor, each
answering *what it measures, what it publishes, and where it fails*.

Standalone. Fill the `«placeholders»` and paste. Shared conventions are in
[section-builder.md](section-builder.md).

---

````text
Add a "Robot sensors" section to the left navigation of «APP NAME» at «PATH».

It is a reference section, not a control surface — nothing on these pages can
command hardware.

APPS (one page each)

  «Sensor 1» — «one-line role, e.g. structured-light depth camera»
  «Sensor 2» — «one-line role»
  «Sensor 3» — «one-line role»
  «Sensor 4» — «one-line role»

Plus a deck page listing all four as tiles.

FIRST: read the existing design system — token config, shared UI kit, two or
three existing pages — and tell me the token names you found before using
them. Match what is there. No new colour/type/spacing values, no new
dependency (no chart library, no icon set, no font).

PAGE ANATOMY — every sensor page, same order

1. Header: icon, sensor name, and a one-sentence summary saying what this
   sensor gives the robot that nothing else does.

2. A "facts" strip of exactly 4 headline specs — the four numbers someone
   would want before choosing this part. Typically: primary output + rate,
   secondary output, working range, field of view.

3. A FIGURE panel. Hand-authored inline SVG, theme tokens, no library. One
   per sensor, and it must show something true about THAT sensor:
     - depth camera  → side elevation of the usable envelope: the dead zone
       it cannot see, the calibrated band, the degraded band. Label each
       boundary with its real distance.
     - scanning lidar → a polar plot of one real frame. Generate it from
       actual room geometry (a rectangle, a doorway, a pillar), not random
       noise — the shape must be a room a reader recognises.
     - IMU → signed three-axis bars, one set per sub-sensor. Show the
       stationary-and-level case, because that is the one a reader can
       sanity-check by eye.
     - rangefinder array → one beam cone per transducer, drawn at the real
       beam angle, with the echo across it.
   Under each figure, 2-4 lines explaining what the reader is looking at.

4. A "Hardware" panel: part number, sensing technique, resolution, accuracy
   at two different ranges, interface/bus, power draw. Label in sans, value
   in mono.

5. An "interfaces" panel listing what the sensor publishes and subscribes:
   «e.g. ROS 2 topic name, message type, rate», with publish and subscribe
   visually distinguished. Add 2-3 lines on the practical cost — bandwidth,
   CPU, who subscribes, what happens when it stops.

6. A "Where it fails" panel, caution-toned, with 3 concrete failure modes.
   Each is a bold title plus two sentences describing a real physical
   situation, not a generic caveat.

   This panel is the most important one on the page. A sensor page that only
   lists capabilities is a datasheet excerpt; the failure modes are what an
   engineer actually needs and what shows the author has used the part.

DECK PAGE

Tiles for the four sensors, plus a footer panel that answers "why «N»
sensors" — a coverage matrix: range bands across the top, one row per sensor,
filled/partial/empty cells showing which sensor returns something useful in
each band. Follow it with a short paragraph naming the bands no single sensor
covers, and the band where two sensors read "clear" on something that is
actually there.

CONTENT RULES

- Real part numbers and real specifications. If you are unsure of a figure,
  say so in your summary rather than inventing a confident number.
- Numbers plausible, never round: "0.6 – 8.0 m", "5.5 rev/s", "±1.1 mm",
  "2.4 W typical". Not "10 m", "5 Hz", "±1 mm".
- Quote accuracy at two ranges so the reader can see the error grow.
- Failure modes must be physical and specific: sunlight swamping an IR
  projector, glass returning zero and reading as open floor, a beam
  scattering off fabric, a planar scanner missing a table top.
- Practitioner voice, sentence case, active voice. No marketing words.

DATA HONESTY

«Describe your real data state — e.g. these pages have no live sensor feed.»

Label every page's provenance honestly — "SPEC SHEET" for datasheet figures,
"RECORDED BAG" for a captured frame — and never "LIVE". If the app already
has a provenance/status vocabulary, reuse it exactly. State the caveat once
in a shared page frame, not on every page.

Where a value is genuinely absent (a transducer with no echo), render the
absence rather than a ceiling value. A stale maximum reads as "clear", which
is the opposite of the truth.

ARCHITECTURE

Put the section and its apps in the app's existing nav catalog if there is
one; if there isn't, create a single catalog module that the rail, the deck
and the route table all derive from. Do not declare the nav in three places.

Build the figures as reusable primitives in one module, not inline per page —
the depth envelope, polar plot, axis bars and beam cone are all reusable.

Give every page a breadcrumb back to the section deck.

VERIFY BEFORE REPORTING DONE

1. Typecheck and build clean.
2. Confirm every icon you import exists in the installed library version.
3. Load all five routes in a real browser; report console errors and page
   exceptions, separating expected from unexplained.
4. Screenshot at 1440px and 375px; report anything clipped, truncated or
   scrolling horizontally.
5. Check each page fills the viewport. A deck with four tiles and 450px of
   dead canvas below is not finished.
6. Show me the screenshots and what you would still improve.

Do not report success on anything you have not run.
````

---

## Notes

**The coverage matrix is what makes the deck worth visiting.** Four tiles and
a heading is a menu. The matrix answers the question a reader actually has —
why does this robot carry three overlapping sensors — and it is the one place
that argument can be made compactly.

**Two accuracy figures, not one.** "±1.1 mm at 1 m, ±18 mm at 4 m" tells a
reader the error grows with the square of range. "±1 mm" tells them nothing
and is probably wrong.

**Generate the lidar frame from geometry.** Ray-cast a rectangle with a
doorway and a pillar, add a small deterministic noise term. Random noise looks
plausible at a glance and teaches nothing; a recognisable room lets the caption
point at features — "the spike at 90° is the doorway".

**Make it deterministic.** Use a fixed function of the index rather than a
random call, so the figure does not change on every render and a screenshot
diff stays meaningful.

In the reference implementation: [`AstraPage`](../../robostore-poc/src/pages/sensors/AstraPage.tsx),
[`RplidarPage`](../../robostore-poc/src/pages/sensors/RplidarPage.tsx),
[`ImuPage`](../../robostore-poc/src/pages/sensors/ImuPage.tsx),
[`UltrasonicPage`](../../robostore-poc/src/pages/sensors/UltrasonicPage.tsx),
figures in [`Viz.tsx`](../../robostore-poc/src/components/ui/Viz.tsx).
