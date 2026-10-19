---
doc: checklist
status: draft
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. The hours reader answers open / closed / unknown for real dataset strings, and the stats script counts the 22:00 fact**
  Becomes usable: `node scripts/stats.mjs` prints how many toilets have readable hours and how many are closed at 22:00; `npm test` proves the parser on the PRD cases.
  Why now: The kernel is time-awareness, and the only real risk is the free-text hours column. Proving the parser against the real CSV first (the "critical risk with runnable evidence" exception) means the UI never has to be rebuilt around a parser that turned out to be wrong.
  PRD ref: `prd.md > Reading opening hours`, `prd.md > The counted data fact`
  Spec ref: `spec.md > Hours reader`, `spec.md > CSV reader`, `spec.md > Toilet loader`, `spec.md > Stats script`
  Build: Create `package.json`, `src/lib/csv.mjs`, `src/lib/toilets.mjs`, `src/lib/hours.mjs`, `scripts/stats.mjs`, `test/hours.test.mjs`, `data/README.md`.
  Verify (mechanical): `npm test` passes all hours cases; `node scripts/stats.mjs` prints counts whose readable + unknown equals rows with coordinates.
  Learner check: Run `node scripts/stats.mjs` and say whether the 22:00 sentence is the kick you wanted.
  Commit: `Add hours parser, CSV loader and dataset stats script`

- [x] **2. The server returns the three nearest toilets for a coordinate**
  Becomes usable: `node src/server.mjs` then `curl 'http://localhost:3000/api/nearest?lat=37.5663&lng=126.9779'` returns three rows with distances, nearest first; `/api/meta` returns the counts.
  Why now: It is the only network path in the product; once it works, the page is pure presentation.
  PRD ref: `prd.md > Finding the three nearest toilets`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Geo`, `spec.md > Server`, `spec.md > Data Model`
  Build: `src/lib/geo.mjs`, `src/server.mjs` (static + API + validation), `test/geo.test.mjs`, `test/api.test.mjs`.
  Verify (mechanical): `npm test` passes; curl returns HTTP 200 with 3 results in ascending `distanceM`; bad input returns 400.
  Learner check: Curl the API with your own coordinates and check the three names make sense for where you are.
  Commit: `Add nearest-toilet API server`

- [x] **3. The page shows the three nearest toilets as cards and pins, closed ones grey**
  Becomes usable: Open `http://localhost:3000`, tap a demo spot, see the map, three pins and three cards with Open / Closed / Hours unknown badges at the current time.
  Why now: This is the core journey end to end; the kernel (grey = closed) becomes visible.
  PRD ref: `prd.md > The Core Journey` (steps 1–5), `prd.md > Greying out closed toilets`, `prd.md > Demo spots`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Page`, `spec.md > Look and Feel`
  Build: `public/index.html`, `public/style.css`, `public/app.js` (demo spots, fetch, cards, Leaflet pins via divIcon, badge logic via `/lib/hours.mjs`).
  Verify (mechanical): `curl -s localhost:3000/ | grep -c 'Where'` ≥ 1; `curl -sI localhost:3000/lib/hours.mjs` is 200 with a JavaScript content type; the page's JS has no syntax errors (`node --check` on a copy of app.js).
  Learner check: Open the page, tap Seoul City Hall, and say whether the three cards are readable at arm's length on a phone.
  Commit: `Add the single page with map, cards and grey-when-closed`

- [x] **4. The time dial, real location, error states and the footer fact**
  Becomes usable: Drag the dial to 22:00 and watch cards and pins go grey; "Now" snaps back; "Use my location" works or shows the plain error; the footer shows the counted fact from `/api/meta`.
  Why now: The second kick (time travel) and the honest states complete the product experience the judges score under Design.
  PRD ref: `prd.md > The time dial`, `prd.md > The Core Journey` (step 6), `prd.md > States and Boundaries`, `prd.md > The counted data fact`
  Spec ref: `spec.md > Page`, `spec.md > Server` (`/api/meta`), `spec.md > Important Failure Modes`
  Build: dial + label + Now link in `index.html`/`app.js`; geolocation with error message; fetch-failure message; footer populated from `/api/meta`.
  Verify (mechanical): `/api/meta` returns the same numbers `scripts/stats.mjs` prints; `node --check` on app.js; `npm test` still green.
  Learner check: Drag the dial from 15:00 to 22:00 at Jeonju Hanok Village and confirm at least one card turns grey; deny location once and read the message.
  Commit: `Add time dial, geolocation, error states and dataset fact`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 1 (the stats sentence) and slice 3 (the first grey card)
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [pending]
Route and stops: [pending]
Edit outcome: [pending]
Reflection: [pending]
Activity mode: [pending]

## Revisions

- Demo spots changed from Seoul City Hall / Daegu Seomun Market / Busan Station to Jeonju Hanok Village / Hongdae / Gwangju City Hall (Gyeonggi) — the build probed the data and found Seoul City Hall's three nearest toilets are all subway toilets open 05:00~01:00 and Busan Station's are all "24시간", so the grey flip at 22:00 never showed; the new spots each have at least one closed card at 22:00 (Jeonju: two of three).
- Exact duplicate rows dropped in the loader (2,705 rows with the same name and coordinates) — the first API call for Daegu Seomun Market returned the same toilet twice; counts in `scripts/stats.mjs`, `data/README.md` and the API test were updated (24,321 toilets, 22,500 with readable hours, 7,754 closed at 22:00).
- `?spot=&at=HH:MM` deep link added to the page — needed so the finished state could be opened in headless Chrome for a screenshot check without a visible window; it also makes the demo video repeatable.
- The hours regex gained a lookahead that rejects month/day spans — the stats run flagged "하절기(7~9월)" being read as 07:00~09:00.
