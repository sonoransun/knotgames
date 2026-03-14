# Puzzle 1: The Gatekeeper

**Difficulty:** Beginner
**Type:** Disentanglement
**Topological Principle:** Unknot recognition

---

## Overview

A ring appears to be trapped on a cord that wraps around a U-shaped bar. The visual complexity of the wrap suggests the ring is locked in place — but appearances deceive. The cord never actually encircles the bar.

## Components

| Part | Material | Dimensions |
|------|----------|-----------|
| U-bar | 4mm steel rod | 120mm tall, 60mm wide across the U |
| Ring | Welded steel O-ring | 50mm outer diameter, 4mm wire |
| Cord | 5mm braided nylon | 400mm long |

The cord ends are fixed to the two tips of the U-bar via small drilled holes (1.5mm) and figure-eight stopper knots on the inside.

## Setup

```
    L ==== R        (tips of U-bar, cord attached at L and R)
    |      |
    |  /~~~+~~~\    (cord path, passing through ring)
    | / R  |    \
    |/ I   |     \
    | N    |      |
    | G    |      |
    |\     |     /
    | \    |    /
    |  \~~~+~~~/    (cord wraps around U-bar curve)
    |      |
    \======/        (U-bar curve)

    === rigid U-bar     ~~~ flexible cord
```

1. Cord runs from the left tip of the U-bar downward
2. Passes through the ring from above
3. Wraps once around the bottom curve of the U-bar
4. Passes back up through the ring from the other side
5. Terminates at the right tip of the U-bar

The ring hangs on the cord, apparently locked by the wrap around the U-bar's curve.

### Solved State

```
    L ---- R        (tips of U-bar, cord attached at L and R)
    |      |
    |      |
    |      |        cord hangs straight between tips
    |      |        no wraps, no complexity
    |      |
    \------/        (U-bar curve)

      (O)           Ring is free, separate from assembly
```

## Objective

Free the metal ring from the assembly. The cord remains attached to the U-bar.

## The Topology

The cord is an **arc** (open curve) with both endpoints on the same rigid bar. It is **not** a closed loop. The wrap around the U-bar's curve is merely a drape — the cord passes over the bar but does not encircle it. Topologically, the cord describes the **unknot** (trivially embedded arc). The ring's linking number with the bar is 0.

A closed loop around a bar is topologically linked (linking number ≠ 0) and cannot be separated — you would need to cut one or the other. But an open arc — a cord with both endpoints attached to the bar itself — can never form a true encirclement. The cord's endpoints are anchored to the U-bar, so no matter how many times it wraps, it traces a path that starts and ends on the same object. The linking number of the cord with the bar is necessarily 0. The visual wrap is geometric complexity (it looks tangled), not topological complexity (it IS tangled). This distinction — geometric vs. topological — is the foundational lesson of the entire puzzle series.

*For a deeper treatment of linking numbers and why zero means separable, see [Topology Primer: Linking Number](../theory/topology-primer.md#linking-number).*

**Physical Intuition:** What you feel in your hands: the cord slides freely along the bar because it's not locked around anything. The wrap creates friction and visual confusion, but if you push the cord with your thumb toward one tip, it bunches up and slides. There's no catch point, no place where the cord genuinely hooks around the bar. That easy sliding IS the topology — you're feeling linking number zero.

## Solution

1. Create slack by pushing the cord's wrapped section toward one tip of the U-bar
2. Slide the ring along the cord toward the slack

```
Checkpoint (after step 2):
    L ---- R
    |      |
    |  (O) |        Ring has been slid to the drape point
    |  /---+        Cord bunched with slack
    | /    |
    |/     |
    \------/
```

3. Pass the ring over the drape point where the cord crosses the U-bar curve
4. The ring slides free off the cord

The entire solution takes about 5 seconds once you see it.

## Why It's Tricky

The wrap around the U-bar's curve creates a strong visual impression of encirclement. Solvers perceive a closed loop that doesn't exist. The brain interprets "cord goes around bar" as "cord is locked to bar," but since both cord endpoints are on the bar itself, the cord can never form a closed loop around any part of the structure.

**Lesson:** Visual complexity is not topological complexity. Always check whether a curve is actually closed before assuming it's linked.

## Common Mistakes

1. **Trying to unwind the cord from the U-bar.** Solvers rotate the ring around the bar, trying to "unscrew" the cord. This fails because the cord isn't wound around the bar — it's draped over it. Unwinding implies a helix; the actual geometry is a drape. No amount of rotation will change the topology.

2. **Pulling the ring toward the U-bar curve.** The natural instinct is to pull the ring toward the bottom of the U, where the cord crosses the bar. But the solution requires moving the ring toward the *tips*, where the slack accumulates. Down is the wrong direction.

3. **Assuming both cord segments must be managed independently.** The cord looks like two separate strands passing through the ring, but it's one continuous arc. Moving the ring along the cord moves it past both "strands" simultaneously.

## Construction Notes

- Drill 1.5mm holes in each tip of the U-bar using a drill press
- Thread cord through, tie figure-eight stopper knots on the inside
- Seal knots with a drop of CA glue
- The cord should be just long enough to create the wrap with ~30mm of slack when manipulated
- Deburr the drilled holes so the cord doesn't fray at the attachment points
