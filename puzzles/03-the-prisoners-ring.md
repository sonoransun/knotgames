# Puzzle 3: The Prisoner's Ring

**Difficulty:** Beginner-Intermediate
**Type:** Disentanglement
**Topological Principle:** Linking number cancellation

---

## Overview

A cord loop is threaded through a two-windowed frame in a way that appears to encircle the crossbar. A ring hangs on the cord. But the cord's path creates opposing crossings that cancel — the linking number is zero, and the cord can be freed from the crossbar entirely.

## Components

| Part | Material | Dimensions |
|------|----------|-----------|
| Frame | 4mm steel rod, rectangular | 150mm x 100mm outer dimensions |
| Crossbar | 4mm steel rod, horizontal | Welded at the frame's vertical midpoint (75mm) |
| Ring | Welded steel O-ring | 50mm OD |
| Cord loop | 5mm braided nylon, spliced closed | 400mm circumference |

The frame has two rectangular windows (top and bottom), created by the crossbar.

## Setup

```
    +==============+
    |  top window  |
    | cord enters  |
    | front→back   |
    +--------------+  <-- crossbar (cord drapes over this)
    | bottom window|
    | cord exits   |
    | back→front   |
    +==============+

         [RING]       <-- ring on cord, hanging in front
```

1. Cord loop goes through the **top window** from front to back
2. Drapes over the **crossbar** from back to front
3. Goes through the **bottom window** from back to front
4. The ring is threaded onto the cord section hanging in front of the frame
5. The cord appears to encircle the crossbar, trapping the ring

## Objective

Free the ring from the frame-and-cord assembly. The cord loop will remain on the frame afterward.

## The Topology

The cord's path over the crossbar creates two crossings:

- **Crossing 1** (top window to crossbar): the cord crosses the crossbar with sign **+1**
- **Crossing 2** (crossbar to bottom window): the cord crosses the crossbar with sign **-1**

The **linking number** of the cord loop with the crossbar = (+1) + (-1) = **0**.

A linking number of zero means the curves are **not linked** — they can be separated. The visual impression of encirclement is an artifact of the specific embedding, not a topological invariant.

### Worked Example: Crossing Signs

To compute the linking number, orient the cord loop (pick a direction of travel) and orient the crossbar (pick left-to-right). At each crossing, determine the sign:

```
    Crossing 1 (top window):        Crossing 2 (bottom window):

    cord →  /                        cord →  \
           / ← crossbar                       \ ← crossbar
          ↗                                    ↘

    Right-hand rule: +1              Right-hand rule: -1
```

**Linking number** = (+1) + (-1) = **0**

A linking number of zero is necessary (though not always sufficient) for separation. In this case, it is also sufficient — the cord can be physically separated from the crossbar.

**Physical Intuition:** What you feel in your hands: when you pull the bight of cord over the end of the crossbar, you feel it slide freely — there's no catch, no resistance from linking. The cord clears the crossbar end because the two crossings cancel each other out. If you had set up the cord to cross the crossbar in the same direction both times (linking number ±2), you would feel the cord lock against the frame, unable to clear the end.

*For the full treatment of linking numbers and crossing signs, see [Topology Primer: Linking Number](../theory/topology-primer.md#linking-number).*

## Solution

1. Slide the ring to one side of the cord loop, away from the frame
2. Create slack in the cord by bunching it toward the frame
3. **This is the key move:** Gather the cord slack on one side (say, the left). Pull a **bight** (a U-shaped fold in the cord, created by doubling it back on itself without pulling the ends through) of cord from below the crossbar, lift it UP and OVER the LEFT end of the crossbar. The bight must clear the end of the crossbar — pass it from the bottom window side, over the tip, and into the top window side. The 400mm cord provides ample slack for this.

```
Key move detail (left end of crossbar):

    +======= crossbar ========+
    |                          |
    |   bight lifts            |
    |   ↑ over end             |
    ~~~~↑                      |
    ~~~~↑  ← cord bight        |
    |                          |
    +==========================+
```

4. The cord lifts free from the crossbar entirely
5. The cord now hangs as a simple loop through one window (or draped over the frame)
6. Slide the ring off the cord loop
7. (Optional) Re-thread the cord back to the starting position

The critical move is step 3: pulling the cord over the end of the crossbar. The crossbar is 100mm wide, and the 400mm cord loop provides ample slack for this maneuver.

## Why It's Tricky

Two illusions compound each other:

1. **The cord looks linked to the crossbar.** The wrap over the crossbar creates a convincing visual impression of encirclement. Solvers don't consider that the crossings might cancel.

2. **Solvers focus on the wrong element.** The objective says "free the ring," so solvers manipulate the ring. But the solution requires manipulating the *cord* — specifically, its relationship with the crossbar. The ring is a distraction; the real puzzle is the cord.

**Lesson:** Linking is algebraic, not just geometric. Crossings have signs, and opposite signs cancel. Always count crossings before assuming something is linked.

## Common Mistakes

1. **Trying to slide the ring off without freeing the cord.** The ring cannot pass over the cord splice (it's a closed loop). The cord must first be freed from the crossbar, then the ring slides off the now-hanging loop.

2. **Pulling the cord through the windows instead of over the crossbar end.** The cord passes through the windows, but the solution requires lifting it over the END of the crossbar — the short exposed section where the crossbar meets the frame's vertical side.

3. **Threading the cord the wrong way when resetting.** If the cord is re-threaded so both crossings have the same sign (both +1 or both -1), the linking number becomes ±2 and the puzzle becomes genuinely unsolvable. Always verify the cord crosses the crossbar from opposite directions in the top and bottom windows.

## Construction Notes

- Weld the frame corners and crossbar solidly; grind all welds flush
- The crossbar must extend fully to both vertical sides of the frame (no gaps at the ends) — the cord must be pulled *over* the end, not through a gap
- The cord circumference (400mm) provides ~200mm of working slack when bunched — enough to clear the 100mm crossbar width
- Use a distinctly colored ring (brass, anodized aluminum) so the objective is visually clear
- Thread the cord exactly as described; incorrect threading may create a genuinely linked configuration
