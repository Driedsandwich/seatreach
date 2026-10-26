---
doc: prd
status: approved
---

# SeatReach — Product Requirements

> Approval note: approved provisionally by the learner's relay assistant under the learner's instruction to proceed; product answers marked [AI-provisional] await the learner's confirmation.

SeatReach checks whether every seat in a simple table layout can be reached from the entrance at the aisle width you need, and names the one tightest gap to fix. It is for volunteer organizers of small events.
Source: `scope.md > The Unique Kernel`, `scope.md > The Core Loop`, `scope.md > The POC Boundary`.

All decisions below are [AI-provisional] unless stated otherwise.

## The Core Journey
1. The organizer opens the page. One line says what it does and for whom. The "Community hall" preset (6 tables, 36 seats) is already shown. (`scope.md > What "Working" Looks Like`)
2. They leave the width slider at 90 cm, or move it (60 to 120 cm).
3. The plan updates live. Reachable floor is softly shaded. Blocked seats show in the warning color with an icon. One pinch marker shows the tightest gap with its width, for example "70 cm".
4. The summary bar reads, for example, "33 of 36 seats reachable at 90 cm".
5. They drag one table (snaps to 10 cm). The result updates as they move.
6. When all seats connect, the summary reads "36 of 36 seats reachable at 90 cm".
7. They click "Download plan (PNG)" to keep the result, or "Copy layout (JSON)" to save it as text.
Success: the organizer can say, in one look, which seats are cut off and what one move fixes it.

## Screens and Layout
One screen only. The plan (room drawing) takes the left; controls take the right. Designed for 1280×720. No other pages or dialogs.

## Look and Feel
- Drafting-paper look: warm off-white paper with a faint 50 cm grid, dark ink lines, ink-gray tables.
- One safety-orange accent for blocked seats and the pinch marker. One deep-teal accent for reachable floor.
- System fonts, tabular (equal-width) numbers, no emoji.
- Works at 1280×720.
- Avoid: gradients, decoration, anything that looks like an official compliance badge.

## Features and Behavior

### The plan
- Tables are rectangles with 6 seats each. The room is 12 m × 8 m with one entrance.
- Drag a table to move it; positions snap to a 10 cm grid. Rotate, add a table, delete a table. Arrow keys nudge the selected table by 10 cm.
- A table that would overlap another table, or leave the room, is refused and snaps back to its last valid position.

### The reachability check
- Controlled by a width slider, 60 to 120 cm, default 90.
- Recomputes live on every change.
- A seat counts as reachable if a square of the chosen width can travel from the entrance to the seat.
- A seat touching a wall counts as blocked.
- Reachable floor is softly shaded teal. Blocked seats get the orange warning color plus an icon (so color is not the only signal).
- One pinch marker is drawn at the tightest gap that, once widened, would reconnect the most-blocked region, labeled with its width (for example "70 cm gap - needs 90 cm").
- Clicking a seat draws its best route from the entrance.

### Summary and output
- Summary bar: "N of M seats reachable at W cm".
- Download plan (PNG): saves the current drawing as an image.
- Copy layout (JSON): copies the table positions as text to the clipboard.
- Load preset: restores the "Community hall" layout.
- Footer, always visible: "Planning aid on a simplified plan. It does not certify accessibility or fire-code compliance."

### Acceptance criteria
- [ ] On the Community hall preset at 90 cm, exactly 3 seats are blocked and a pinch marker of about 70 cm is shown.
- [ ] Moving one table about 30 cm left makes the summary read "36 of 36 seats reachable at 90 cm".
- [ ] Lowering the slider to a smaller width makes at least as many seats reachable as before (never fewer).
- [ ] A table dropped overlapping another or outside the room returns to its previous position.
- [ ] Download plan produces a PNG that shows the plan and summary.
- [ ] The footer text appears on screen.

## States and Boundaries
- **First use** — preset loaded, 90 cm, results already visible.
- **Empty (no tables)** — a message: load the preset or add a table. Summary reads "0 of 0 seats".
- **All reachable** — summary shows all seats; no pinch marker; the status reads as success.
- **Entrance blocked** — if nothing can enter at the chosen width, every seat is blocked and the pinch marker sits at the entrance.
- **Refused move** — the table snaps back; no error dialog.
- **Persistence** — nothing is saved between visits. Refreshing restores the preset. Export (PNG, JSON) is the only way to keep a layout. No data leaves the browser.

## Product Decisions
- The idea (SeatReach) was chosen by the learner from nine candidates. Everything else here is [AI-provisional] pending the learner's review.
- Name the single worst gap rather than listing every problem: keeps the fix obvious for non-experts.
- Rejected tables snap back instead of showing an error: fewer interruptions while dragging.
- No saving and no accounts: nothing to build or secure, and no data leaves the browser.
- Not a certification: the footer says so, to avoid false assurance.

## What We're Building
- The single-screen plan and controls described above.
- The reachability check with blocked seats, the pinch marker, and click-a-seat route.
- The Community hall preset tuned to give 3 blocked seats at 90 cm and 36 of 36 after the move.
- PNG download, JSON copy, preset reload, the footer, the empty state.

## Deferred From the POC
- Saving layouts in the browser or on a server: needs storage and accounts; export covers the need.
- Loading a layout back from JSON: not needed for the demo.
- Multiple entrances or doors: a larger geometry problem.

## Possible Later Enhancements
Import a JSON layout. Several entrances. Suggest the best single move automatically. More table shapes.

## Non-Goals
- No claim of legal accessibility or fire-code compliance.
- No real floor-plan or photo import.
- No curved furniture, turning circles, or multiple rooms.
- No accounts, no server, no analytics.

## Open Questions
- Does the preset geometry really produce 3 blocked seats and a 70 cm gap? Must be checked in the build (can wait until `5-build`; a test settles it).
- Final product name. Can wait until submission.
- Learner to confirm all [AI-provisional] answers. Can wait; does not block `4-spec`.
