---
doc: spec
status: approved
---

# Where's the Loo — Technical Spec

## How This Works, In Plain Language
There are four pieces and no database.

1. **The data file** — one CSV from the Korean public data portal with 33,820 public toilets. It ships in the repo. When the server starts it reads the file once, keeps the 24,321 rows that have usable coordinates (27,026 before exact duplicates are dropped), and holds them in memory.
2. **The hours reader** — a small function that looks at the free-text "opening hours" of a toilet ("24시간", "09:00~18:00", "(평일)09:00~18:00+(주말)…", "-") and turns it into something a computer can check against a clock: *always open*, *a time range*, or *unknown*. The same file runs on the server (for the statistics) and in the browser (for the time dial).
3. **The server** — one Node.js file. It serves the web page and answers one question over HTTP: "given this latitude and longitude, which three toilets are nearest?" It measures distance with the haversine formula (straight line over the globe) and returns the three smallest.
4. **The page** — one HTML file with a map (Leaflet + OpenStreetMap tiles), two buttons, three cards and a time dial. The browser asks for the person's location (or uses a demo spot), calls the server, draws the three pins and cards, and uses the hours reader locally to colour each card for whatever time the dial shows.

Why this shape: the whole product is one question answered from one file. A framework, a database or a hosted API would add setup without adding proof. Zero npm dependencies means anyone can run it with `node src/server.mjs`.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. Person opens `http://localhost:3000` → server sends `public/index.html`, `style.css`, `app.js` and `lib/hours.mjs`; the page draws an empty map of Korea and the first-open message.
2. Person taps **Use my location** → browser Geolocation API returns `lat, lng` (or they tap a demo spot and the page uses fixed coordinates).
3. Page calls `GET /api/nearest?lat=37.5663&lng=126.9779` → server computes haversine distance from that point to all 24,321 rows, sorts, takes three, responds with JSON (name, address, hours text, lat, lng, distance in metres).
4. Page draws the "you" pin and three numbered pins, then builds three cards.
5. For each card the page calls `statusAt(parseHours(hoursText), minutesSinceMidnight)` from `lib/hours.mjs` → `open | closed | unknown` → badge text and colour; a closed card and pin go grey.
6. Person drags the time dial → step 5 runs again with the new minutes value; no network call.
7. Footer shows the dataset fact; the numbers come from `GET /api/meta`, which the server computed at startup with the same hours reader that `scripts/stats.mjs` uses.

## Stack
- **Node.js ≥ 20** (developed on 26.0.0) — built-in `http`, `fs`, `node:test`. Docs: https://nodejs.org/docs/latest/api/
- **No npm dependencies.** `package.json` exists only for `npm start` / `npm test` scripts and metadata.
- **Leaflet 1.9.4** from unpkg with subresource-integrity hashes — the map. Docs: https://leafletjs.com/reference.html. Tradeoff accepted: the map needs internet access for the library and tiles; the cards and badges work without it.
- **OpenStreetMap standard tiles** — free, attribution required. Policy: https://operations.osmfoundation.org/policies/tiles/
- **Browser Geolocation API** — https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API. Works on `localhost` without HTTPS.
- Owner-selected choices: zero-dependency Node (runs anywhere, nothing to install), straight-line distance (no routing API), English UI with Korean names.
- Unverified before build: none — every piece above is standard. The one thing to check early is the hours parser against real values (slice 1).

## Where It Runs and How Someone Tries It
- Runtime: a local Node process serving a browser page. No API keys, no environment variables.
- Start: `node src/server.mjs` (or `npm start`) → prints `Where's the Loo → http://localhost:3000` once the CSV is loaded.
- Open `http://localhost:3000` in a browser. For the demo video, click **Try a demo spot → Jeonju Hanok Village**, then drag the time dial to 22:00 (or open `http://localhost:3000/?spot=0&at=22:00`).
- Tests: `npm test` (runs `node --test test/`).
- Statistics for the README footer fact: `node scripts/stats.mjs`.
- Deployment: none (optional per the rules; not chosen).

## Look and Feel
From `prd.md > Look and Feel`: street-sign plain. System font stack, 16 px base, card titles 18–20 px bold, badges 14 px uppercase. Palette tokens: ink `#1a1a1a`, paper `#ffffff`, open `#1b7f3b`, closed grey `#9a9a9a` on `#f0f0f0`, unknown amber `#b26a00`, you-blue `#1d5fd1`. Pins: numbered circular markers drawn with CSS (Leaflet `divIcon`) so they can turn grey without extra images. Copy tone: short, plain, no exclamation marks. Mobile-first, single column, max-width 640 px on desktop.

## Components

### CSV reader (`src/lib/csv.mjs`)
Parses RFC-4180 CSV text (quoted fields, embedded commas and newlines, BOM) into rows. No dependency. PRD ref: `prd.md > Finding the three nearest toilets`.

### Toilet loader (`src/lib/toilets.mjs`)
Reads `data/toilets.csv`, maps header names (Korean) to fields `{type, name, address, hours, lat, lng}`, keeps rows whose coordinates fall inside Korea's bounding box (lat 33–39, lng 124–132), and reports counts (total rows, rows with coordinates, latest reference date). PRD ref: `prd.md > Finding the three nearest toilets`, `prd.md > The counted data fact`.

### Geo (`src/lib/geo.mjs`)
`haversineM(a, b)` in metres; `nearest(list, point, n)` returns the `n` closest with `distanceM`, ascending. PRD ref: `prd.md > Finding the three nearest toilets`.

### Hours reader (`src/lib/hours.mjs`)
`parseHours(text)` → `{kind: 'always' | 'range' | 'unknown', ranges: [{start, end}]}` with minutes since midnight; `statusAt(parsed, minutes)` → `'open' | 'closed' | 'unknown'`. Handles: always-open words (24시간, 연중무휴, 상시, 종일, 00:00~24:00, 24), time ranges with `~`, `-`, `∼`, with or without minutes (09~18, 0900~1800, 9:00~18:00, 09시~18시), overnight ranges (05:00~01:00), day-tagged strings (first readable range wins). Everything else → unknown. Pure ES module, runs in Node and the browser. PRD ref: `prd.md > Reading opening hours`, `prd.md > The time dial`.

### Server (`src/server.mjs`)
`http.createServer`. Routes: `GET /` and static files under `public/`; `GET /lib/hours.mjs` served from `src/lib/`; `GET /api/nearest?lat&lng&n` → JSON; `GET /api/meta` → dataset counts and the 22:00 fact. Validates numbers, caps `n` at 10, returns 400 on bad input. No logging of coordinates. PRD ref: `prd.md > Finding the three nearest toilets`, `prd.md > The counted data fact`, `prd.md > States and Boundaries`.

### Page (`public/index.html`, `public/app.js`, `public/style.css`)
Map, buttons, cards, dial, footer. Imports `/lib/hours.mjs` as an ES module. PRD ref: `prd.md > Greying out closed toilets`, `prd.md > The time dial`, `prd.md > Demo spots`, `prd.md > States and Boundaries`.

### Stats script (`scripts/stats.mjs`)
Loads the CSV with the same loader and hours reader, prints: total rows, rows with coordinates, rows with readable hours, how many are open / closed at 22:00 (and at 15:00 for contrast), and the share of unknown. The README quotes its output. PRD ref: `prd.md > The counted data fact`.

## Data Model
In memory only, built at server start from the CSV:

```
Toilet { type: string, name: string, address: string, hours: string, lat: number, lng: number }
Meta   { rows: number, withCoords: number, readableHours: number, closedAt22: number, openAt22: number, snapshotDate: string }
```

Nothing is written anywhere; leaving and coming back starts from the first-open state. The person's coordinates exist only inside one request.

## File Structure
```
wheres-the-loo/
├── src/
│   ├── server.mjs          # HTTP server: static files + /api/nearest + /api/meta
│   └── lib/
│       ├── csv.mjs         # RFC-4180 parser
│       ├── toilets.mjs     # CSV → Toilet[] + Meta
│       ├── geo.mjs         # haversine + nearest(n)
│       └── hours.mjs       # parseHours + statusAt (shared with the browser)
├── public/
│   ├── index.html          # the single page
│   ├── app.js              # location, fetch, cards, pins, dial
│   └── style.css           # street-sign plain styling
├── scripts/
│   └── stats.mjs           # prints the counted data fact for the README
├── test/
│   ├── hours.test.mjs      # parser cases from the PRD
│   ├── geo.test.mjs        # haversine + nearest
│   └── api.test.mjs        # starts the server on a random port, calls /api/nearest
├── data/
│   ├── toilets.csv         # data.go.kr dataset 15012892 snapshot (2026-10-18)
│   └── README.md           # source, date, license, column notes
├── devpost/                # Devpost Learn planning docs (scope, prd, spec, checklist, app-map)
├── package.json
├── LICENSE                 # MIT
└── README.md
```

## External Services and Dependencies
- **unpkg CDN** — `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` and `.css`, pinned with `integrity` attributes. No key, no cost.
- **OpenStreetMap tiles** — `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, attribution "© OpenStreetMap contributors" shown on the map. No key. Fair-use policy applies; a demo is far below limits.
- **data.go.kr** — not called at runtime; the CSV is shipped. Source page: https://www.data.go.kr/data/15012892/standard.do

## Important Failure Modes
- **Location denied or unavailable** → message "Couldn't get your location. Try a demo spot." Demo buttons remain.
- **Server down / fetch fails** → message "The toilet list didn't load. Is the server running?"
- **No internet for the map** → the map area shows grey tiles, but cards, badges and the dial still work (they only need the local server).
- **Hours text the parser can't read** → badge "Hours unknown", never a guess.

## What Was Simplified and Why
- **Straight-line distance** instead of walking routes — no routing API; three candidates within a few hundred metres are enough to choose. The fuller version would call a routing service per card.
- **First readable range** instead of weekday/weekend logic — most rows have one range; day-tagged rows are a minority. The fuller version would pick the range by today's day type.
- **Shipped CSV snapshot** instead of live download — reproducible, offline, and the hackathon video does not depend on the portal. The fuller version would refresh from the portal on a schedule.
- **"No closing days" counted as always open** — the dataset's 개방시간 column uses the word 연중무휴 ("no closing days") for 4,393 of the 24,321 kept toilets; it means no rest days rather than 24 hours, and the app treats it as open at any hour. The 22:00 count in the README rests on this assumption. The fuller version would ask the publisher what the word means per row.
- **Demo spots** instead of address search — search needs a geocoding API; three fixed spots cover the video. A `?spot=&at=HH:MM` (or `?lat=&lng=`) deep link exists so the same state can be opened in a headless browser for checks.

## Decisions and Open Issues
- **Zero dependencies (owner's choice)** — runs with `node` alone; tradeoff: hand-written CSV parsing and static file serving (small, tested).
- **Shared `hours.mjs` for server and browser (implementation detail)** — one parser, one truth; tradeoff: the module must stay dependency-free and ES-module-only.
- **Numbered CSS pins (implementation detail)** — so pins can turn grey; tradeoff: slightly more CSS than default markers.
- **The one real uncertainty:** how many of the 589 distinct hours strings the parser can read, and whether "first readable range" misclassifies day-tagged rows. Agreed check: slice 1 ships `scripts/stats.mjs`, which prints the readable share and the 22:00 counts; the README quotes those numbers and the day-tag simplification is stated next to them. Evidence lives in `test/hours.test.mjs` and the stats output.
- Carried from `prd.md > Open Questions`: footer wording — settled after the stats script runs; km display — one decimal.

## Sharing

- Repository (MIT): https://github.com/jejuolledev/wheres-the-loo
- Demo video (2:16, YouTube, public): https://youtu.be/fWILw1hEd04
- Devpost: Build With AI: Basics, submitted 2026-10-21 (KST)
