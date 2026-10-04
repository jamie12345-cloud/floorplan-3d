# Custom house and garden viewer

A bespoke house and garden design developed with Codex, using the MIT-licensed floorplan-3d viewer by wuyi as the foundation.

## View the finished design

Serve this repository with `python3 -m http.server 8000`, then open `http://localhost:8000/phone.html`. This portable version includes the furniture and finishes for a new browser. Three.js loads from its CDN, so an internet connection is needed.

- `plan-1.html`: first measured layout.
- `plan-2.html`: proposed ground-floor layout with custom editing tools.
- `phone.html`: furnished version with compact mobile controls.

## Custom work

Measured house layouts; a revised utility and pantry arrangement; open arches; staircase, banister and under-stair infill; white sash windows, rear folding doors and three roof lights; bespoke cabinetry and furniture; interior finishes and external brickwork; a landscaped garden with garage access, seating, cooking area and garden room.

The viewer also includes automatic near-wall hiding, independent 2D roof-light visibility, touch walk controls, visible mobile Undo/Redo and an English-only interface.

## Regenerate

Run `node adapt-plans.js` from the repository root. The generator reads the original `index.html`, the adaptation modules and `phone-furniture.json`, and writes the three custom HTML files. Keep `index.html` as the upstream source. The generator performs geometry and fit checks.

Editing furniture saves only in the current browser. Use JSON export/import to transfer edited layouts. Undo/Redo history lasts for the current page session.

## Build another property with AI

Give your coding assistant this repository and the following brief:

> Help me build a measured 2D and interactive 3D model of my house and garden using this viewer. First ask me for plans, scale, at least one known measurement, room uses, ceiling heights, doors, windows, stairs and any proposed changes. Establish an origin and axes in metres. Mark every measurement as measured, inferred or assumed. Before 3D work, present a numbered 2D outline with separate house, neighbour, garage, garden, fence and gate boundaries. Confirm boundary ownership, which structures remain, garage door position and access routes. Confirm the staircase's lowest step, highest step and upper-floor opening. Resolve uncertain boundaries explicitly. Then build structure, openings and stairs, followed by furnishings, materials and garden design. Check clearances and alignment after each stage. Test actual mobile dragging, Undo/Redo, walk movement and exit. Inspect fresh renders from opposite sides. Preserve the original licence and credit, distinguish local browser saves from shared defaults, and explain temporary versus permanent hosting.

## Measurement limits

This is a design concept rather than a survey or construction drawing. Some dimensions, wall thicknesses, door openings and site geometry are inferred. The garden's far end was cropped in its reference photograph and is estimated. Confirm measurements on site before using the model for construction or boundaries.

## Attribution

Based on [wy51ai/floorplan-3d](https://github.com/wy51ai/floorplan-3d), copyright 2026 wuyi, under the MIT licence. The original copyright and licence remain in `LICENSE`. The bespoke property model, adaptations and workflow are additions to that foundation.
