# SeatReach

SeatReach checks whether every seat in a small table layout can be reached from the entrance at the aisle width you set, and names the one tightest gap to fix. It is for volunteer organizers who lay out tables in a community hall, school room or small exhibition without CAD.

> Planning aid on a simplified plan. It does not certify accessibility or fire-code compliance.

## Try it

- Live demo: https://driedsandwich.github.io/seatreach/
- Locally: download the repository and open `index.html` in a modern desktop browser. No install, no build step.
- Tests: open `tests.html` in the browser. It prints "ALL PASS" when the checks succeed.
- Demo video: [VIDEO URL]

## What it does

- Shows a "Community hall" preset (6 tables, 36 seats, a 12 m x 8 m room, one entrance) as soon as the page opens.
- Lets you set the width you need to pass, from 60 to 120 cm (default 90 cm, for example a wheelchair), and recomputes live.
- Shades reachable floor in teal. Seats that cannot be reached are drawn in orange with an icon, so color is not the only signal.
- Draws one pinch marker at the tightest gap, labeled like "70 cm gap - needs 90 cm".
- Shows a summary line, "N of M seats reachable at W cm".
- Lets you drag a table (snaps to a 10 cm grid), rotate, add or delete tables, and nudge the selected table with the arrow keys. A table that would overlap another or leave the room snaps back.
- Click a seat to draw its best route from the entrance.
- Download the plan as a PNG, copy the layout as JSON, or reload the preset.

The preset is designed so that at 90 cm three seats are blocked by a gap of about 70 cm, and moving one table about 30 cm left reconnects all 36 seats.

## How it works

SeatReach is a static page that runs entirely in the browser: HTML, CSS and plain JavaScript, with no build step, no external libraries and no network calls.

- `index.html`, `style.css`: layout and the drafting-paper look.
- `app.js`: drawing on a canvas, dragging, buttons and the summary.
- `core.js`: the calculator, with no screen code so it can be tested on its own.
- `tests.html`: browser assertions on `core.js`.

The calculator cuts the room into 10 cm cells and computes, for each free cell, the free space around it (a distance transform, measured as a square). A cell is passable if that clearance is at least half the chosen width. A flood fill from the entrance finds the reachable cells, and each seat is reachable if the cell just outside its table edge is reached. To name the pinch point, a widest-path search from the entrance finds the path to the blocked seats whose narrowest spot is widest, and reports that spot and its width.

## Limits

- Planning aid on a simplified plan. It does not certify accessibility or fire-code compliance.
- The mover is a square of the chosen width, not a real wheelchair or stroller shape. The grid is 10 cm, so results are only as precise as the grid.
- Cut from the proof of concept: real floor plans or photos, curved furniture, doors and turning circles, multiple rooms, and saving to a server or accounts.
- One rectangular room, one entrance, rectangular tables with 6 seats each.
- Nothing is saved between visits. Refreshing restores the preset; PNG and JSON export are the only way to keep a layout. Nothing leaves the browser.

## How this was made

- The author is a Japanese speaker and not a software engineer. The idea was chosen by the author from nine candidates that another AI (OpenAI Codex) generated from the public hackathon brief.
- Planning: in Claude Code, the Devpost Learn Skill Pack's 1-start skill was run in the project folder, and `scope.md`, `prd.md` and `spec.md` were drafted from the Skill Pack's templates and instructions. Because of the deadline, the author asked the assistant to answer the product questions provisionally on the author's behalf. Those answers are marked [AI-provisional] in the documents and await the author's confirmation.
- Build: the code was written by OpenAI Codex, running on the author's own small home computer, from the spec. It was checked in a browser with the included `tests.html` before the demo was recorded.
- Planning documents: [devpost/scope.md](devpost/scope.md), [devpost/prd.md](devpost/prd.md), [devpost/spec.md](devpost/spec.md).
- Hosted on GitHub Pages. The demo video is a screen recording with English captions and no voice.

## License

MIT. See `LICENSE`.
