# Materials & Construction Guide

Puzzle numbers in this guide are **display numbers** — the series order (1–20) used in the README and on the site — not the frozen module filenames.

> **Arc 5 (Puzzles 18–20):** the 3D-printed carriers — the ring stands, the tangle frame with its ball handles, and the mold board with its integral bridges — are still being finalized, and their parametric print models are **forthcoming** (the OpenSCAD sources for Arc 5 are deferred). The cord, ring, and raw-material specifications below are stable and buildable now; the printed parts are listed with their intended dimensions and flagged as forthcoming.

## Shared Materials

| Material | Specification | Puzzles Used In | Source |
|----------|--------------|----------------|--------|
| Steel rod | 4mm diameter, mild steel | 1, 3, 6, 7, 12 | Metal supplier / welding shop |
| Steel rod | 3mm diameter, mild steel | 10 (shuttle bar) | Metal supplier / welding shop |
| Braided cord | 5mm braided nylon (paracord 550 type III) | 1, 2, 3, 7, 8, 10, 11, 20 | Outdoor / craft supplier |
| Braided cord | 4mm braided nylon (two-color pair for 19) | 12, 18, 19 | Outdoor / craft supplier |
| Braided cord | 3mm braided nylon | 4 | Outdoor / craft supplier |
| Welded O-rings | 40mm OD, 4mm wire | 4, 11 | Marine / rigging supplier |
| Welded O-rings | 50mm OD, 4mm wire | 1, 3, 7, 8 | Marine / rigging supplier |
| Welded O-rings | 55mm OD, 4mm wire | 12 | Marine / rigging supplier |
| Welded O-rings | 80mm OD, 6mm wire (68mm aperture) | 18 (rigid rings ×2) | Marine / rigging supplier |
| Wooden balls | 25mm, drilled 6mm through-hole | 12 (path-constraint ball) | Craft supply |
| Wooden balls | 30mm, drilled 6mm through-hole | 8 (finial), 11 (cord stops) | Craft supply |
| Steel balls | 8mm solid | 7 (prong stops) | Hardware / bearing supplier |
| Hardwood | Maple or beech, various dimensions | 2, 8, 10, 12 | Lumber supplier |
| Wooden dowels | 10mm diameter, 80mm length | 10 (posts) | Craft supply |
| Cast acrylic | Clear, 120mm x 80mm x 60mm block | 11 | Plastics supplier |
| Chrome-tanned leather | 2mm thick, 300mm x 25mm strip | 4 | Leather craft supplier |
| Rivets | Small brass or copper | 4 (Mobius band join) | Hardware supplier |
| 3D-printed PETG | Ring stands ×2 (18); 170mm square tangle frame + 16mm ball handles ×4 (19); ~200 x 120 x 14mm mold board with integral 7mm bridges (20) — print models forthcoming | 18, 19, 20 | FDM 3D printer (SCAD deferred) |
| Heat-shrink sleeve | Two contrasting colors, cord ID bands | 20 (loop identification) | Electronics / hardware supplier |

## Shared Construction Techniques

### Bending Steel Rod

Use a rod bending jig or vise for consistent curves. For U-shapes (Puzzles 1, 7), mark bend points and bend around a mandrel of the desired inner radius. For ovals (Puzzle 6), use an oval form or bend freehand, ensuring both sides are symmetric before welding the closure.

### Welding

All steel joints should be MIG or TIG welded. Grind all welds flush and smooth — any burr or rough spot will catch cord or rings and make the puzzle frustrating rather than challenging. Test that rings slide freely over all welded joints.

### Cord Preparation

- Cut cord with a hot knife or heated blade to prevent fraying
- Seal all cut ends with a lighter flame (melt and press flat)
- For closed loops: splice ends using a fid, or tie a fisherman's knot and seal with adhesive
- For fixed ends: thread through drilled holes and tie figure-eight stopper knots on the inside, optionally sealed with a drop of CA glue

### Drilling

- Holes in steel rod tips (Puzzle 1): use a 1.5mm drill bit on a drill press; clamp the rod securely
- Through-tunnels in acrylic (Puzzle 11): use a 15mm Forstner bit on a drill press at slow speed with cooling fluid to prevent melting; polish tunnel interiors with progressively finer sandpaper (400 → 800 → 1200 grit)
- Holes in wooden paddles (Puzzle 2): use a 20mm Forstner bit; sand edges of hole smooth

### Wood Finishing

Sand all wooden components to 220 grit minimum. Apply a thin coat of beeswax or tung oil for smooth cord sliding. Do not use polyurethane — it creates too much friction for cord puzzles.

### Ring Sizing

The critical relationship in most puzzles is ring inner diameter vs. the elements it must pass over or be stopped by:

| Puzzle | Name | Ring OD | Must slide over | Must be stopped by |
|--------|------|---------|----------------|-------------------|
| 1 | The Gatekeeper | 50mm | 5mm cord | N/A |
| 3 | The Prisoner's Ring | 50mm | 5mm cord | N/A |
| 4 | Mobius Snare | 40mm | 3mm cord | N/A |
| 7 | Devil's Pitchfork | 50mm | 4mm prong rod | 8mm ball stops |
| 8 | The Ferryman's Knot | 50mm | 20mm post | 30mm ball finial |
| 11 | Genus Trap | 40mm | 5mm cord | 15mm tunnel diameter |
| 12 | The Hopf Paradox | 55mm | 4mm hoop rod | Window geometry |
| 18 | The Whitehead Waltz | 80mm (68mm aperture) | 4mm cord (bight of 4 strands) | N/A (seated in stand) |

### Prototyping Advice

Build Puzzles 1 and 2 first — they use the simplest materials and validate your cord/ring sizing. Before building each puzzle, test the critical dimensional relationships with scrap materials:

- Can the ring slide freely where it should?
- Is the cord long enough for the solution moves but short enough to maintain the constraint?
- Do ball-stops actually stop the ring, or does it slip past?
- Does the cord slide smoothly through all holes and tunnels?

Expect to iterate 2-3 times on Puzzles 7, 11, and 12, where dimensional tolerances are tight.
