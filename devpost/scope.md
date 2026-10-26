---
doc: scope
status: approved
---

# SeatReach

> Approval note: approved provisionally by the learner's relay assistant under the learner's instruction to proceed; product answers marked [AI-provisional] await the learner's confirmation.

A quick check of whether every seat in a small event layout can be reached from the entrance at the width you need, with the one tightest gap named. [AI-provisional]

## The Unique Kernel
Every seat is checked from the entrance at the width you set (for example 90 cm for a wheelchair), and the tool names the single pinch point to fix, such as "72 cm gap - needs 90 cm". [AI-provisional]

## Who It's For
Volunteer organizers who lay out tables in a community hall, school room, or small exhibition, without CAD. Today they eyeball the layout and often notice too late that a gap that looks open is too narrow for a wheelchair user or a parent with a stroller. [AI-provisional]

## The Core Loop
Open the preset plan → set the required width → see blocked seats and the pinch gap → drag one table → all seats connect → download the plan. [AI-provisional]
They come back to re-check each new layout.

## Inspiration & Identity
A drafting-paper feel: warm off-white paper, a faint grid, dark ink lines, one safety-orange accent for problems and one deep-teal accent for reachable floor. Calm and practical, not flashy. [AI-provisional]
Prior art noted by a web and X search done for this project: event-layout tools check spacing or capacity, and architecture tools check routes in building models, but a quick every-seat check on a simple table layout is missing. [AI-provisional]

## Why This Matters to the Learner
Not established. The learner chose this idea from nine candidates; their personal stake was not stated.

## What "Working" Looks Like
On the "Community hall" preset at 90 cm, 3 seats are blocked by a 70 cm gap. Moving one table about 30 cm left reconnects everything, and the summary reads "36 of 36 seats reachable at 90 cm" (6 tables × 6 seats). That before/after is the "oh, that's cool" beat. [AI-provisional]
Note: the exact numbers are a target for how the preset must be designed. The build must verify them with a test, and adjust the preset if the geometry does not produce them.

## The POC Boundary
- One rectangular room, 12 m × 8 m, 10 cm grid, one entrance.
- Rectangular tables with 6 seats each.
- A square "mover" of the chosen width.
- Drag a table, see the result update live, download the plan. [AI-provisional]

## Later
Multiple entrances, door widths, and turning circles; more furniture shapes; importing a real floor plan. [AI-provisional]

## Explicitly Cut
- Real floor plans or photos: too much work to read reliably in a short hackathon.
- Curved furniture: complicates the geometry for no gain to the kernel.
- Doors and turning circles: a different, larger problem.
- Multiple rooms: not needed to prove the kernel.
- Saving to a server, accounts: no backend, so nothing leaves the browser.
- Any claim of legal accessibility compliance: this is a planning aid only and must not look like a certification. [AI-provisional]
