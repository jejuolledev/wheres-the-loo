---
doc: scope
status: approved
---

# Where's the Loo

One line: a single web page that shows the three nearest public toilets in Korea and tells you, in grey, which ones are closed right now.

## The Unique Kernel
Every toilet finder shows pins. This one shows **time**. Opening hours in the national dataset are free text (589 different spellings in 33,820 rows), so nobody uses them. We parse them, decide "open / closed / unknown" for the current clock, and draw closed toilets in grey. The second kick is a time dial: drag it to 10 pm and watch the map go grey — a fact counted from the data, not a slogan.

## Who It's For
A parent with a four-year-old in a Korean city at 9:40 pm, or a tourist who cannot read "평일 09:00~18:00". They open the page on their phone and need one answer: *which of the closest three can I actually walk into right now?* Today they open a map app, tap three pins, read Korean hours, and guess.

## The Core Loop
Open the page → allow location (or pick a demo spot) → see three cards, nearest first, each with distance, hours, and an open / closed / unknown badge → closed ones are grey → optionally drag the time dial to check "what about later?" → walk. People come back because the question recurs every day in every new place.

## Inspiration & Identity
Mood: a street sign, not a dashboard. Big readable type, three cards, one map, one dial. Colour only where it carries meaning: open = green badge, closed = grey card, unknown = amber. Reference for the restraint: the Korean public-toilet standard dataset itself (https://www.data.go.kr/data/15012892/standard.do) — plain, public, no branding.

## Why This Matters to the Learner
"I want the kick to come from the data, not from a feature list." The owner has built map apps before; this is a chance to build the smallest possible one, from an empty folder, and let one counted number carry the story.

## What "Working" Looks Like
Start the server, open `http://localhost:3000`, click "Try a demo spot → Jeonju Hanok Village": three cards appear within a second with distances in metres and hours. Drag the time dial from 15:00 to 22:00: at least one card turns grey and its badge says "Closed". That grey flip is the "oh, that's cool" beat.

## The POC Boundary
- One page, one server file, no database, no accounts, no paid API.
- Data = the one CSV from data.go.kr, loaded at start.
- Nearest three by straight-line (haversine) distance, only rows with valid coordinates.
- Hours parser that handles the common patterns and says "unknown" for the rest.
- Map with the three pins and the user pin (Leaflet + OpenStreetMap tiles).
- A time dial that re-evaluates open/closed without reloading.
- One data fact in the footer, counted by a script in the repo.

## Later
- Walking routes instead of straight-line distance.
- Weekend / holiday-specific hours (the data has them for a minority of rows).
- Filters: accessible stall, baby changing table, unisex.
- Other countries' datasets behind the same parser interface.

## Explicitly Cut
- **Reusing the owner's existing map-app code** — hackathon rule: old ideas fine, old code not; and it would hide what the skill pack is for.
- **Deployment** — optional per the rules; a local run on video is enough and keeps secrets and hosting out of scope.
- **Reverse geocoding / address search** — needs an external API; demo locations cover the video.
- **Ratings, reports, photos** — a different product (crowdsourcing), not the kernel.
