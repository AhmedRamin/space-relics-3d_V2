# Fix pass — object photo, Solar System composition, footer

## 1. Object photo disappeared when the page was zoomed in

**Cause:** the info panel body (`.info-panel__scroll`) is a flex column. The photo card was
an ordinary flex child, so whenever the record was taller than the available viewport
(high browser zoom, short laptop / tablet screens) the flex algorithm shrank it first. Its
frame has `overflow: hidden`, so it collapsed to nothing — the title jumped straight to
the status badges. At 50 % zoom there was enough height, which is why it only showed then.

**Fix (`src/styles/app.css`):**
- `.record-image` is now `flex: 0 0 auto`, so it can never be squeezed.
- The frame owns the picture size: fixed `aspect-ratio`, `min-height: 118px`,
  `max-height: 210px`; the `<img>` absolutely fills it with `object-fit: cover`.
- `.info-panel__scroll` gets `flex: 1 1 auto; min-height: 0` so only the text scrolls.
- The phone / small-screen overrides now target `.record-image__frame` instead of the
  `<img>`, so the ratio stays consistent at every breakpoint.

Result: the photo is visible at 100 %, 150 %, 200 % browser zoom, in short landscape
windows and on phones.

## 2. Solar System planets and labels stacked together

**Cause:** `layoutOrbits()` reserved space between planets using the *physical* radius,
while the scene draws each body ~2.1× larger. The enforced gap was therefore ~2× too
small for the drawn planets, so the giants almost touched and their labels collided.

**Fixes (`src/lib/scale.js`, `src/components/scene/SolarSystemScene.jsx`,
`src/components/three/CameraRig.jsx`):**
- One shared `displayRadius()` / `PLANET_SCALE` (2.1) is used by both the renderer and
  the orbit layout, and the minimum gap now scales with the body pair
  (`max(2.4, (rA + rB) * 0.5)`). Jupiter → Saturn → Uranus → Neptune get real air.
- `separateAngles()` guarantees a 12° minimum between any two heliocentric positions, so
  two worlds can never land on the same screen spot (real longitudes are otherwise kept).
- Permanent labels are limited to the four giants + Earth; the other small worlds reveal
  their name on hover/selection. Labels are now small glass pills for legibility.
- The system camera is more top-down (`pitch 0.66 / depth 0.55`), so the nested orbits
  read as rings instead of crossing arcs, and the inner planets no longer project onto
  the Sun.
- Adaptive framing for narrow/portrait screens (`narrowBias`) plus a raised
  `maxDistance` (1400) so the camera can actually back off far enough to keep the outer
  labels (Neptune) on screen on phones.
- On tablet widths the guided tour no longer auto-opens the rail drawer, which used to
  leave a dimming/blurring scrim over the whole Solar System.

Verified with `next build` (clean) and rendered screenshots at 1440×900, 1024×640,
820×1180 and 1440×480.

## 3. Footer section

Added a persistent footer row under the stage with **“© 2026 Matrix. All rights reserved.”**
(`App.jsx` + `.app-footer` in `app.css`):

- The app shell is now `grid-template-rows: auto minmax(0,1fr) auto`, so the footer is a
  real layout row and never covers the canvas or the phone bar.
- Slim glass bar matching the top bar: 30 px desktop, 26 px on phones, with safe-area
  padding, muted type and a subtle top hairline.
- Desktop/tablet show a small “Space Relics 3D” brand before the copyright; phones show
  the copyright only to save space.

## 4. Planet names inside the tour card + names too far from their worlds

**Cause (tour):** the 3D name pills are rendered by drei `<Html>`, which portals them into
the canvas container at the default `zIndexRange` of ~16.7 M. They therefore painted *on
top* of the guided tour card and the dimmed backdrop, so “JUPITER” printed across the
welcome box.

**Cause (labels):** only Earth and the four giants were labelled, the pills were anchored
~1–3 world units below the body (a big gap that grew with camera distance), and a second
`@media (max-width: 700px)` block still hid all inner-planet labels.

**Fixes:**
- `Tour.jsx` adds `body.is-touring` while a step is open; `app.css` hides `.scene-label`,
  `.scene-chip` and `.orbit-label` for the whole walkthrough, so no 3D name can reach the
  card.
- `<Html>` for labels now uses `zIndexRange={[6, 0]}`, keeping them above the canvas but
  *below* the panels, scrim and tour (they used to float over the info panel too).
- Labels are anchored just under the body (`-radius * 0.07`, or the ring outer edge plus a
  hair for Saturn/Jupiter/Uranus/Neptune) instead of a fixed world gap, so they hug their
  planet at every zoom level.
- Every planet is labelled on first load — Mercury, Venus, Earth, Mars, Jupiter, Saturn,
  Uranus, Neptune.
- `LABEL_NUDGE` staggers the tight inner four in screen space (Mercury above, Venus /
  Earth / Mars below with left/right offsets). Verified with bounding-box checks at
  1440×800, 1024×700 and 390×844: zero overlaps.
- The duplicate phone rule that hid `.scene-label--minor` is replaced by a smaller type
  size, so phones also show all eight names.

Verified with `next build` (clean), Playwright screenshots at 1440×800 and 390×844, and a
programmatic overlap test of the eight label boxes.

## 5. Rail overflowed its panel, wouldn't scroll, and hid the phone back button

**Cause:** the rail is a fixed-height flex column, but `.icon-panel` was `flex: 0 0 auto`
with no internal scroll. Opening “Hardware types” gave it its full intrinsic height, so the
tiles spilled past the rounded panel (clipped mid-row) and, on phones, the drawer ran to
`bottom: 6px` — straight over the Panels / Guide / **System** control bar. With the drawer
open the back button was physically covered, which is why “back” appeared dead.

**Fixes:**
- `Sidebar.jsx`: the bodies/hardware list and the hardware grid now sit inside one
  `.sidebar__body` scroll region; the head and foot stay pinned.
- `app.css`: `.sidebar { overflow: hidden }`, `.sidebar__body { overflow-y: auto }`;
  `.icon-panel--open` is a normal block again and `.icon-panel__body` no longer needs its
  own scrollbar, so nothing can paint outside the rail.
- Phone drawer now stops above the control bar (`--phone-bar-h` in `theme.css`, new var),
  and `.phone-bar` is raised to `z-index: 28` so “System” is always tappable.
- `TopBar.jsx`: in body view phones now get a compact `←` icon button (title “Back to the
  Solar System”) next to the menu, so the way back is visible without opening the drawer.

Verified at 405×652, 390×844, 820×700 and 1440×800: rail scrolls to the last tile and the
map key, drawer sits 11 px above the control bar, and back works via the phone `System`
tap, the new top-bar `←`, the desktop `← Solar System`, the brand logo and `Esc`.
