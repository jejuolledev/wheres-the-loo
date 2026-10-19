---
doc: prd
status: draft
---

# Where's the Loo — Product Requirements

One line: a single web page for someone on foot in Korea that lists the three nearest public toilets, nearest first, and greys out the ones that are closed at the chosen time.
Source: `scope.md > The Unique Kernel`, `scope.md > The Core Loop`.

## The Core Journey
1. The person opens the page. They see the title, a one-sentence promise, a map centred on Korea, and two buttons: **Use my location** and **Try a demo spot**.
2. They tap **Use my location** and allow the browser prompt (or tap a demo spot such as *Jeonju Hanok Village*).
3. Within a second, the map zooms to them, a blue "you" pin appears, and three numbered pins appear.
4. Below the map, three cards appear in distance order. Each card shows: rank, name, straight-line distance in metres, the raw opening-hours text from the dataset, and a badge **Open**, **Closed** or **Hours unknown**.
5. Closed cards are rendered grey (text and pin); open cards are white with a green badge; unknown cards are white with an amber badge.
6. A time dial under the cards shows the current time. Dragging it to another hour re-evaluates the three badges instantly; the cards and pins change colour accordingly. The list order does not change (nearest stays nearest).
7. Success: the person can say which of the three they can walk into now. They walk.

Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

## Screens and Layout
One screen, mobile-first, scrolls vertically:
- Header: title "Where's the Loo", one-line promise.
- Map block (fixed height ~ 40% of viewport).
- Controls row: **Use my location**, **Try a demo spot** (small menu of three Korean spots).
- Results: three cards stacked.
- Time dial: a range slider 00:00–23:59 in 15-minute steps with a label, and a **Now** reset link.
- Footer: data source, snapshot date, the counted data fact, and the license.

## Look and Feel
Street-sign plain. System sans-serif, large sizes (card name ≥ 18 px, badge ≥ 14 px). Colours carry meaning only: green badge for open, grey card + grey pin for closed, amber badge for unknown, blue for "you". White background, generous spacing, no icons beyond the pins. English UI copy; toilet names and hours shown in the original Korean because that is what the person will see on the door.

## Features and Behavior

### Finding the three nearest toilets
From the chosen coordinates, the server returns the three toilets with the smallest straight-line distance among rows whose coordinates fall inside Korea's bounding box. Distance is shown in metres (under 1,000 m) or kilometres with one decimal.
- [ ] Given Seoul City Hall (37.5663, 126.9779), the API returns exactly three rows, sorted ascending by distance, each with name, address, hours text, lat, lng, distance in metres.
- [ ] Rows with blank or out-of-range coordinates never appear.

### Reading opening hours
Each toilet's free-text hours are classified for a given clock time into **open**, **closed** or **unknown**.
- [ ] "24시간", "연중무휴", "00:00~24:00", "상시" → open at any time.
- [ ] "09:00~18:00" → open at 10:00, closed at 22:00.
- [ ] "05:00~01:00" (overnight) → open at 23:30 and at 00:30, closed at 03:00.
- [ ] "(평일)09:00~18:00+(주말)09:00~18:00" → uses the first readable range.
- [ ] "-", "데이터없음", "8시간", "영업시간내" → unknown.
- [ ] The raw text is always shown to the user next to the badge.

### Greying out closed toilets
- [ ] A closed card has a grey background, grey text and a "Closed" badge; its map pin is grey.
- [ ] An open card is white with a green "Open" badge; its pin is coloured.
- [ ] An unknown card is white with an amber "Hours unknown" badge; its pin is coloured.

### The time dial
- [ ] On load the dial sits at the current local time and the label reads e.g. "Now · 21:40".
- [ ] Moving the dial changes the badges and colours of the three cards and pins without a page reload or a new location request.
- [ ] A "Now" link snaps the dial back to the current time.

### Demo spots
- [ ] "Try a demo spot" offers three fixed locations (Jeonju Hanok Village, Hongdae in Seoul, Gwangju City Hall in Gyeonggi) so the page can be demonstrated without GPS. Each was chosen because at 22:00 at least one of its three nearest toilets is closed, so the grey flip is visible.

### The counted data fact
- [ ] The footer shows one sentence with numbers produced by `scripts/stats.mjs` from the shipped CSV (e.g. how many toilets with readable hours are closed at 22:00), with the dataset name, snapshot date and source link.

## States and Boundaries
- **First open** — map of Korea, no pins, cards area shows "Tap a button above to find the three nearest toilets."
- **Locating** — the location button shows "Locating…" and is disabled until the browser answers.
- **Location denied / unavailable** — a plain message: "Couldn't get your location. Try a demo spot." The demo button stays usable.
- **Server not reachable** — "The toilet list didn't load. Is the server running?"
- **Outside Korea** — results are still the three nearest rows (they will be far); the distance shows in km. No special handling in the POC.
- **Persistence** — nothing is stored. Reloading returns to the first-open state.
- **Privacy** — coordinates go only to the local server for the distance query; nothing is logged or stored.

## Product Decisions
- Straight-line distance, not walking routes — routes need an external API; three straight-line candidates are enough to pick one.
- Show raw Korean hours text next to the badge — the badge is our interpretation; the person should see the source.
- "Unknown" is a first-class state — guessing "open" would send someone to a locked door.
- Time dial over a time picker — the whole kick is watching the colours change as you drag.
- English interface, Korean names — judges read English; the person on the street needs the Korean name on the sign.

## What We're Building
Everything under **Features and Behavior**, the states above, and the footer fact.

## Deferred From the POC
- Weekend / holiday hours — the data has them for a minority of rows; the first readable range is used now.
- Filters (accessible, baby changing, unisex) — the columns exist in the CSV; the POC keeps one question.
- Walking routes — needs a routing service.

## Possible Later Enhancements
- A share link with the coordinates and time in the URL.
- A "closest open one" shortcut that skips grey cards.

## Non-Goals
- No accounts, no saved places, no ratings — different product.
- No deployment — rules make it optional; video shows it working locally.
- No paid APIs or keys — the owner's constraint; also keeps the repo runnable by anyone.
- No copying of the owner's earlier map-app code — hackathon rule.

## Open Questions
- Which exact wording for the footer fact — decided once `scripts/stats.mjs` runs (can wait for build).
- Whether to show km for far results — resolved: yes, one decimal (can wait for build).
