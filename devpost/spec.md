---
doc: spec
status: approved
---

# SeatReach — Technical Spec

> Approval note: approved provisionally by the learner's relay assistant under the learner's instruction to proceed; product answers marked [AI-provisional] await the learner's confirmation.

All technical decisions below are [AI-provisional] (made by the relay assistant for the learner to confirm), except where marked as derived from the PRD.

## How This Works, In Plain Language
SeatReach is a single web page that runs entirely in the visitor's browser. There is no server, no account, and no outside library.

It has four pieces:
- **The page** (`index.html` and `style.css`) holds the layout: the drawing area on the left, the controls on the right, and the footer.
- **The screen logic** (`app.js`) draws the room, handles dragging and buttons, and shows results.
- **The calculator** (`core.js`) holds the actual math: given tables and a width, it works out which seats can be reached and where the tightest gap is. It knows nothing about the screen, which makes it easy to test.
- **The test page** (`tests.html`) runs checks on the calculator and prints "ALL PASS" if they succeed.

How the calculator thinks (in plain words): the room is cut into 10 cm squares. For each square it works out how much free space surrounds it (the "clearance"). A person or chair can pass through a square only if the free space is at least half the width you set on each side. Starting from the entrance, it spreads out through passable squares. Seats it cannot reach are blocked. To name the pinch point, it asks: for the blocked seats, what is the widest path from the entrance, and which narrowest spot on that path holds it back? That spot is the one to fix.

Why this shape: it is the smallest design that proves the idea. A static page needs no setup, can be hosted free, and lets judges try it without an account.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.
1. Visitor opens the page → `index.html` loads `core.js` and `app.js` → `app.js` loads the Community hall preset and the default width of 90 cm.
2. `app.js` calls the calculator with the tables and the width → the calculator returns reachable cells, blocked seats, the pinch point, and a count.
3. `app.js` draws the room, the teal shading, the orange blocked seats, the pinch marker, and the summary bar.
4. Visitor moves the slider → `app.js` calls the calculator again → the drawing updates.
5. Visitor drags a table → `app.js` snaps the position to 10 cm; if the new position overlaps another table or leaves the room, it snaps back; otherwise it calls the calculator and redraws.
6. When everything connects, the summary reads "36 of 36 seats reachable at 90 cm".
7. Visitor clicks Download plan → `app.js` draws the plan to an off-screen canvas and saves it as a PNG. Copy layout → table positions are put on the clipboard as JSON text.

## Stack
- HTML, CSS, and plain JavaScript (ES2020, no framework, no build step). Documentation: https://developer.mozilla.org/
- Canvas 2D for drawing and PNG export. https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- No external libraries and no network calls.
- Rationale: nothing to install, nothing to break, and easy for the learner and Codex to inspect.
- Tradeoff accepted: no framework means a little more hand-written code, but the app is a single screen so this is small.
- Hosting: GitHub Pages (static hosting).
- Unverified: the exact behavior of the clipboard button in every browser. Check early in the build (fallback below).
- The code is written by OpenAI Codex running on the learner's own small home computer, from this spec.

## Where It Runs and How Someone Tries It
- Runtime: any modern desktop browser. No language version or API keys needed.
- Start locally: open `index.html` in a browser (double-click), or run `python3 -m http.server` in the project folder and open http://localhost:8000. Tests: open `tests.html`; expect "ALL PASS".
- For the demo recording: open the Community hall preset at 90 cm, show the 3 blocked seats and the pinch marker, drag one table, show "36 of 36", download the plan.
- Submission requires a short demo video and a public GitHub repository. GitHub Pages deployment is optional and is not a substitute for either. Deploy steps: push to a public repo, then in the repository's Settings → Pages choose the main branch, root folder. Publishing is a step for the learner to approve.

## Look and Feel
Carried from `prd.md > Look and Feel`.
- Paper background (warm off-white) with a faint grid line every 50 cm; dark ink for outlines; ink-gray tables.
- Safety-orange for blocked seats, the pinch marker, and its label. Deep teal for reachable floor, as a soft translucent shading.
- System font stack; `font-variant-numeric: tabular-nums` for numbers. No emoji; the blocked-seat icon is drawn with canvas lines.
- Calm and practical tone. Interface text is short and plain.
- Must fit 1280×720 without scrolling the plan.
- Blocked seats use color and an icon so that color alone is not the signal.

## Components

### Calculator (`core.js`)
Pure functions with no screen code. Main functions:
- `buildGrid(room, tables)`: marks 10 cm cells as blocked (table, wall, outside room).
- `clearanceMap(grid)`: distance from each free cell to the nearest blocked cell, measured as a square (so a square mover fits). Computed with a two-pass distance transform.
- `reach(grid, clearance, width, entrance)`: a flood fill (BFS) from the entrance over cells where clearance ≥ width/2.
- `seatStatus(tables, reachSet)`: each seat has an access cell just outside the table edge; reachable if that cell is in the reach set. A seat whose access cell is against a wall or outside the room is blocked.
- `pinch(grid, clearance, entrance, blockedSeats)`: a widest-path search (maximin: a priority search that maximizes the smallest clearance along the path) from the entrance. For the blocked seats, finds the path with the widest bottleneck and returns the bottleneck cell and its gap width. The reported gap is the width of the tightest spot on that path.
- `route(grid, clearance, width, entrance, seat)`: shortest path (BFS) to a seat, for the click-a-seat route.
- `overlapsOrOutside(tables, table, room)`: used to refuse invalid moves.
PRD ref: `prd.md > The reachability check`.

### Screen logic (`app.js`)
Draws the plan, shading, seats, pinch marker, and route. Handles drag (snap to 10 cm), rotate, add, delete, arrow-key nudge, the slider, the buttons, and the empty state. Calls the calculator after every change.
PRD ref: `prd.md > The plan`, `prd.md > Summary and output`, `prd.md > States and Boundaries`.

### Page and styles (`index.html`, `style.css`)
Layout (plan left, controls right), summary bar, footer text.
PRD ref: `prd.md > Screens and Layout`, `prd.md > Look and Feel`.

### Tests (`tests.html`)
Plain assertions run in the browser. Prints "ALL PASS" or the failures. Must cover:
- On the preset at 90 cm, 3 seats are blocked and the pinch gap is about 70 cm. If this fails, adjust the preset's positions, not the test's intent.
- After moving one table about 30 cm left, 36 of 36 are reachable.
- Lowering the width never reduces the reachable seat count.
- Overlapping or out-of-room moves are refused.
- Empty room: 0 of 0 seats and no crash.
PRD ref: `prd.md > Acceptance criteria`.

## Data Model
- **Room**: `{ width: 1200, height: 800, entrance: { x, y, side } }` in centimeters. Fixed.
- **Table**: `{ id, x, y, w, h, rotated }`, in cm, multiples of 10. Each table has 6 seats derived from its size (3 on each long side).
- **Width**: a number, 60 to 120.
- **Result** (computed, never stored): reachable cells, blocked seats, pinch `{ x, y, gap }`, counts.
- All state lives in memory in the page. When the visitor refreshes or leaves, it resets to the preset. The only persistence is export (PNG or JSON).

## File Structure
```
project/
├── index.html      # page layout, summary bar, footer
├── style.css       # drafting-paper look
├── app.js          # screen logic: drawing, dragging, buttons
├── core.js         # calculator: clearance, reach, pinch, routes
├── tests.html      # browser checks, prints ALL PASS
├── LICENSE         # MIT
├── README.md       # what it is, how to run, the disclaimer
├── devpost/        # Devpost learning workspace
└── ...
```

## External Services and Dependencies
None in the code. Only GitHub Pages for hosting (free for public repositories), if the learner chooses to deploy.

## Important Failure Modes
- **Preset geometry does not give 3 blocked seats and a 70 cm gap** → the build adjusts the preset table positions until the test passes, and the demo numbers are taken from what the app actually computes.
- **Clipboard copy is blocked by the browser** → the JSON is shown in a text box for manual copy.
- **Slider or dragging feels slow** → the grid is only 120×80 cells, so this is unlikely. If it happens, recompute only when the drag ends.

## What Was Simplified and Why
- **A square mover** instead of a true wheelchair or stroller shape — a square of the chosen width is simple, safe (slightly conservative), and enough to prove the idea. The fuller version would model turning and different shapes.
- **10 cm grid** instead of exact geometry — makes the math simple and fast. The fuller version would use exact polygons.
- **One entrance, one room, rectangular tables** — keeps the check small. The fuller version would handle doors and other shapes.
- **No saving, no server** — nothing to secure and nothing leaves the browser.

## Decisions and Open Issues
- Static page with no build step, no libraries: chosen by the relay assistant [AI-provisional] so the app runs anywhere and Codex can write it simply. Tradeoff: more hand-written code.
- Distance-transform clearance + BFS + widest-path search [AI-provisional]: gives both the reachable seats and the named pinch point with one consistent model. Tradeoff: results are only as precise as the 10 cm grid.
- GitHub Pages hosting [AI-provisional]: lets judges try it without an account. Publishing needs the learner's approval.
- Learner uncertainty or unfamiliar concept discussed: none identified in this session (the learner was away). The "widest path" idea is the least familiar concept; during the build, the learner can check it with one test: a table gap of 70 cm should be reported as 70 cm at the pinch, and widening it should reconnect the seats.
- Open: the preset geometry must be verified in the build (see Important Failure Modes). The learner must confirm all [AI-provisional] answers in one batch. Final product name is open until submission.
