# EXKNOTS

A series of 10 hand dexterity topological puzzles — physical manipulation challenges where you must transform, thread, and disentangle objects through non-obvious permutations to free or resolve each puzzle.

Inspired by classic carnival and tavern puzzles, each puzzle in the series isolates a specific topological principle. Working through them in order builds genuine topological intuition: you learn to see genus, linking numbers, homotopy classes, and the difference between topological and geometric constraints — all through your hands.

## The Series

| # | Name | Difficulty | Topological Principle | Type |
|---|------|-----------|----------------------|------|
| 1 | [The Gatekeeper](puzzles/01-the-gatekeeper.md) | Beginner | Unknot recognition | Disentanglement |
| 2 | [Shepherd's Yoke](puzzles/02-shepherds-yoke.md) | Beginner | Buttonhole homotopy | Disentanglement |
| 3 | [The Prisoner's Ring](puzzles/03-the-prisoners-ring.md) | Beginner-Intermediate | Linking number cancellation | Disentanglement |
| 4 | [Mobius Snare](puzzles/04-mobius-snare.md) | Intermediate | Non-orientability | Disentanglement |
| 5 | [Trinity Lock](puzzles/05-trinity-lock.md) | Intermediate | Borromean rings | Assembly |
| 6 | [Devil's Pitchfork](puzzles/06-devils-pitchfork.md) | Intermediate-Advanced | Fundamental group of config space | Transfer |
| 7 | [The Ferryman's Knot](puzzles/07-the-ferrymans-knot.md) | Advanced | Open knot vs closed knot | Disentanglement |
| 8 | [Ouroboros Chain](puzzles/08-ouroboros-chain.md) | Advanced | Gray code / binary recursion | Sequential disentanglement |
| 9 | [Genus Trap](puzzles/09-genus-trap.md) | Expert | Genus-2 fundamental group | Disentanglement |
| 10 | [The Hopf Paradox](puzzles/10-the-hopf-paradox.md) | Expert | Hopf fibration | Extraction |

## What You Learn

The series teaches you to think topologically, one puzzle at a time:

1. Visual complexity does not equal topological complexity
2. Invert your model of which object moves through which
3. Crossings can cancel algebraically
4. Twists change boundary structure — one-sidedness enables escape
5. Linkage can be collective and non-decomposable
6. Configuration space has its own topology — change constraints before moving pieces
7. Open arcs on fixed axes follow different rules than closed knots
8. Some puzzles have no shortcut — recursive structure demands trust
9. Invisible topology requires mental models and algebraic cancellation
10. Some motions cannot be decomposed into sequential steps

## Interactive Visualizations

Each puzzle has interactive 2D diagrams, rotatable 3D models, and step-by-step animated solutions. To view them:

```bash
# Serve the project directory
python3 -m http.server 8000

# Open in browser
open http://localhost:8000
```

Select any puzzle from the sidebar to explore:
- **2D SVG Diagram** showing components, dimensions, and topology
- **Interactive 3D Model** (drag to rotate, scroll to zoom)
- **Animated Solution** with play/pause/step controls and a timeline scrubber

Requires a modern browser with ES module and WebGL support.

## 3D Printing (FDM)

All 10 puzzles have parametric OpenSCAD models in `scad/` designed for FDM 3D printing. Key adaptations:

- **Thickened features**: 4mm steel rods → 6mm printed, 8mm ball-stops → 12mm
- **Material substitution**: Leather → TPU strip, clear acrylic → split PETG with color-coded tunnel liners
- **Real paracord**: 6mm cord channels for threading 4mm paracord through printed parts
- **Constraint assertions**: Dimensional relationships that make each puzzle work are verified in code

Each puzzle `.scad` file has a `part` variable to render individual printable parts:

```openscad
part = "u_bar";    // Render just the U-bar for printing
part = "ring";     // Render just the ring
part = "assembly"; // Preview assembled puzzle (default)
```

Print settings, orientations, and assembly instructions are documented in each file's header comments. See the [plan](/.claude/plans/) for the full print specification tables.

## Theoretical Foundations

The puzzles in this series are grounded in genuine mathematical topology — not analogies or simplifications, but the real concepts that professional mathematicians use. The difference is that here, you learn them through your hands before encountering the formalism.

A comprehensive **[Topology Primer](theory/topology-primer.md)** covers every concept used in the series:

- **Linking numbers** and why zero means separable (Puzzles 1, 3)
- **Genus** and why holes are topological handles (Puzzles 2, 9)
- **Orientability** and the Mobius boundary (Puzzle 4)
- **Borromean links** and irreducibly collective properties (Puzzle 5)
- **Configuration spaces** and their non-trivial topology (Puzzle 6)
- **Knot theory** — Reidemeister moves, open arcs vs. closed knots (Puzzles 1, 3, 7)
- **Gray codes** and recursive complexity (Puzzle 8)
- **Fundamental groups** and algebraic cancellation (Puzzle 9)
- **Fiber bundles** and the Hopf fibration (Puzzle 10)

The primer is designed for readers with no formal topology background. Each concept includes plain-language definitions, ASCII diagrams, physical intuition, and a one-paragraph rigorous statement.

## How to Use This Series

**Solve in order.** Each puzzle introduces exactly one new topological concept while building on ideas from earlier puzzles. Skipping ahead is possible but means missing the conceptual scaffolding that makes later puzzles approachable.

**Read theory alongside solving.** After solving (or getting stuck on) each puzzle, read the corresponding section of the [Topology Primer](theory/topology-primer.md). The physical experience of manipulation makes the abstract concepts click in a way that textbook definitions cannot.

**Think topologically.** The core skill this series develops is the ability to distinguish topological properties (invariants — things that don't change under continuous deformation) from geometric properties (things that look complicated but can be smoothed away). By Puzzle 10, you'll have internalized this distinction.

For educators: see the **[Pedagogical Arc](theory/pedagogical-arc.md)** for guidance on using the series in classrooms, workshops, or self-study, including discussion prompts and common misconceptions at each stage.

## Difficulty & Time Estimates

| # | Puzzle | Difficulty | Novice | Experienced | Key Concept |
|---|--------|-----------|--------|-------------|-------------|
| 1 | The Gatekeeper | Beginner | 5-15 min | < 1 min | Unknot recognition |
| 2 | Shepherd's Yoke | Beginner | 10-30 min | 1-2 min | Genus / buttonhole |
| 3 | The Prisoner's Ring | Beginner-Intermediate | 15-45 min | 2-5 min | Linking number |
| 4 | Mobius Snare | Intermediate | 20-60 min | 3-5 min | Non-orientability |
| 5 | Trinity Lock | Intermediate | 30-90 min | 5-10 min | Borromean rings |
| 6 | Devil's Pitchfork | Intermediate-Advanced | 1-3 hrs | 10-20 min | Configuration space |
| 7 | The Ferryman's Knot | Advanced | 1-4 hrs | 5-15 min | Open vs. closed knots |
| 8 | Ouroboros Chain | Advanced | 2-5 hrs | 30-60 min | Gray code recursion |
| 9 | Genus Trap | Expert | 3-8 hrs | 30-90 min | Fundamental group |
| 10 | The Hopf Paradox | Expert | 4-12 hrs | 1-3 hrs | Hopf fibration |

*Novice = first encounter, no hints. Experienced = has seen the topological principle before.*

## Materials

All puzzles are constructible from common materials: steel rod/wire, braided nylon cord, welded metal rings, wooden balls, and hardwood or acrylic for frames. See [construction/materials.md](construction/materials.md) for the full bill of materials and shared construction techniques.

## License

MIT License. See [LICENSE](LICENSE).
