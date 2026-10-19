# Where's the Loo

**The three nearest public toilets in Korea — and which ones are closed right now.**

One page. You tap *Use my location* (or a demo spot), and three cards appear, nearest first, each with its distance, its opening hours straight from the national open dataset, and a badge: **Open**, **Closed** or **Hours unknown**. Closed toilets turn grey — on the card and on the map pin. A time dial under the cards lets you ask "what about at 10 pm?" and watch the colours change.

> In this dataset, at 22:00, **7,754 of the 22,500 toilets with readable hours are closed — about 34%.** At 15:00 it's 60.
> (Counted from the shipped CSV by `node scripts/stats.mjs`; see [Data](#data) for the exact definition.)

Built from an empty folder for Devpost's **Build With AI: Basics** hackathon with the [Devpost Learn skill pack](https://github.com/challengepost/learn-ai-basics). Planning documents are in [`devpost/`](devpost/).

## Why

Every toilet finder shows pins. Almost none show *time*, because the opening-hours column in Korea's public-toilet dataset is free text — 589 different spellings in 33,820 rows ("24시간", "09:00~18:00", "(평일)09:00~18:00+(주말)09:00~18:00", "-", "8시간"…). So the hours get ignored and a parent with a four-year-old at 9:40 pm walks to a locked door.

This proof of concept reads that column, decides open / closed / unknown for the clock, and says *unknown* rather than guessing.

## How it works

```
browser ──GET /api/nearest?lat&lng──▶ src/server.mjs ──▶ src/lib/geo.mjs (haversine, nearest 3)
   │                                        │
   │  imports /lib/hours.mjs                └── src/lib/toilets.mjs (CSV loaded once at start)
   ▼
statusAt(parseHours(text), minutes)  ──▶  Open / Closed / Hours unknown  ──▶ grey card + grey pin
```

- **`src/lib/hours.mjs`** — `parseHours(text)` → `always | range | unknown`; `statusAt(parsed, minutesSinceMidnight)` → `open | closed | unknown`. Handles always-open words, `HH:MM~HH:MM` with `~`, `-` or `∼`, ranges without minutes (`09~18`, `0900~1800`, `09시~18시`), overnight spans (`05:00~01:00`), and day-tagged strings (first readable range wins). Month spans such as `하절기(7~9월)` are rejected. The same file runs on the server (for the statistics) and in the browser (for the time dial), so there is one definition of "open".
- **`src/server.mjs`** — zero-dependency Node HTTP server: static files, `GET /api/nearest?lat&lng&n` (n ≤ 10, 400 on bad input), `GET /api/meta` (the counted facts). Coordinates are not logged or stored.
- **`src/lib/geo.mjs`** — haversine distance in metres and a nearest-n scan over the 24,321 rows (a few milliseconds).
- **`public/`** — one HTML page, Leaflet 1.9.4 + OpenStreetMap tiles, numbered CSS pins (so they can turn grey), three cards, a range slider for the clock, and a footer with the data fact.

## Run it

Requires Node.js 20 or newer. No npm install, no keys.

```bash
node src/server.mjs        # or: npm start
# → Where's the Loo → http://localhost:3000
```

Open http://localhost:3000, tap **Try a demo spot → Jeonju Hanok Village**, then drag the dial to 22:00. Two of the three cards turn grey.

Deep link for the same state: `http://localhost:3000/?spot=0&at=22:00` (also `?lat=…&lng=…&at=HH:MM`).

Tests (Node's built-in runner, 14 tests: hours parser cases from the PRD, haversine, nearest-n, and the API on a random port):

```bash
npm test
```

The numbers quoted above:

```bash
node scripts/stats.mjs
```

```
Rows in CSV:                    33,820
Rows with usable coordinates:   24,321 (71.9%)
  with readable opening hours:  22,500 (92.5%)
  with unreadable hours text:   1,821 (7.5%)
At 15:00: open 22,440, closed 60 (0.3% closed)
At 22:00: open 14,746, closed 7,754 (34.5% closed)
```

The map needs internet access for the Leaflet library and OpenStreetMap tiles; the cards, badges and dial only need the local server.

## Data

- **Dataset:** 전국공중화장실표준데이터 (Korea public toilet standard dataset), Korean Public Data Portal — https://www.data.go.kr/data/15012892/standard.do
- **Snapshot:** downloaded 2026-10-18 as the portal's standard-dataset CSV; shipped unchanged as [`data/toilets.csv`](data/toilets.csv) (SHA-256 in [`data/README.md`](data/README.md)). The latest reference date inside the file is 2020-06-08, so treat hours as indicative.
- **Terms:** the portal lists the dataset's usage scope as "이용허락범위: 제한 없음" (no restriction on use).
- **What the app keeps:** rows with coordinates inside Korea (lat 33–39, lng 124–132), exact duplicates (same name and coordinates) kept once → 24,321 toilets. "Readable hours" means `parseHours` returned `always` or `range`; everything else is shown as *Hours unknown*.
- **Known simplification:** when a string lists weekday and weekend ranges, the first readable range is used (see `devpost/spec.md > What Was Simplified and Why`).

## How this was built (the honest version)

1. Empty folder → `npx skills add challengepost/learn-ai-basics --all -y` (the six skills are committed under `.agents/skills/`, with `skills-lock.json`).
2. In Claude Code, the agent read each skill in order — `1-start`, `2-scope`, `3-prd`, `4-spec`, `5-build` — and wrote `devpost/scope.md`, `prd.md`, `spec.md` and `checklist.md` from the skill pack's templates. The skills are designed as a live interview; here the interview answers came from the project owner's written brief for this hackathon (the idea, the "closed = grey" kick, the no-paid-API and no-copied-code constraints), and the owner reviews the documents before submission. `devpost/learner-profile.md` is git-ignored as the skill pack recommends.
3. The build followed the checklist's four slices in order, each verified (tests, curl, a headless-Chrome screenshot) and committed. The plan changed three times during the build; each change is recorded under `devpost/checklist.md > Revisions`. The one that mattered most: the planned demo spot (Seoul City Hall) turned out to have three subway toilets open until 01:00, so the grey flip never showed — the data chose the demo spots.
4. No code was reused from the owner's earlier projects. Pre-existing work incorporated: the public dataset above, Leaflet, OpenStreetMap tiles.

## License

MIT — see [LICENSE](LICENSE). Data terms as stated under [Data](#data).
