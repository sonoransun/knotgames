# Puzzle 4: Mobius Snare

**Difficulty:** Intermediate
**Type:** Disentanglement
**Topological Principle:** Non-orientability (Mobius boundary)

---

## Overview

A cord loop with a dangling ring is threaded around a Mobius band — a strip of leather joined with a half-twist. On an ordinary (untwisted) band, the cord would be permanently trapped between the two distinct edges. But a Mobius band has only one edge, and this changes everything.

## Components

| Part | Material | Dimensions |
|------|----------|-----------|
| Mobius band | Chrome-tanned leather | 300mm x 25mm x 2mm, joined with half-twist |
| Join | Brass rivets | 2 rivets securing the half-twisted overlap |
| Ring | Welded steel O-ring | 40mm OD |
| Cord | 3mm braided nylon | 250mm long, both ends tied to ring |

The cord forms a closed loop that hangs from the ring. The total cord-plus-ring assembly forms one closed curve.

## Setup

```
        ___________________
       /                   \
      /    MOBIUS BAND       \
     /   (with half-twist     \
    |     at the join)         |
    |                          |
    |   ~~cord passes~~        |
    |   ~~around band~~        |
     \                        /
      \______________________/
              |  |
              | cord |
              [RING]
```

The cord loop is threaded around the Mobius band — it passes through the interior of the band loop (inside the leather strip's circumference) at one point. The ring dangles below, weighted by gravity.

## Solved State

```
    ___________________
   /                   \
  /    MOBIUS BAND       \
 /   (unchanged)          \
|                          |
|                          |
 \                        /
  \______________________/

  (O)~~~cord~~~(O)           <-- ring and cord completely free
                              from the Mobius band
```

## Objective

Free the ring-and-cord assembly from the Mobius band. Nothing may be cut, unriveted, or broken.

## The Topology

An ordinary (untwisted) band has **two edges** and **two sides**. A cord threaded around such a band is trapped between the two edges — it cannot pass over either edge without cutting the band.

A Mobius band has **one edge** and **one side**. The half-twist connects what would be the "top edge" to the "bottom edge," creating a single continuous boundary curve. A cord positioned on the band can follow this single edge all the way around and eventually reach any point — including the escape path.

The Mobius band's boundary is a single unknotted closed curve. The cord loop and this boundary have linking number 0 (they can be separated), which is only possible because the single edge wraps around the band twice before closing.

### How One-Sidedness Enables Escape

On a normal (0-twist) band, the cord is trapped between the top edge and the bottom edge — two distinct boundary curves. Think of it like a track with two rails: the cord sits between the rails and cannot jump over either one to escape.

On a Mobius band, there is only **one boundary curve**. The cord can follow this single boundary all the way around and reach any point — including positions that *appear* to be on the 'other side' of the band (but are really the same side). This means the cord can slide to the edge and off.

**Edge-tracing exercise:** Place your finger on the edge of the Mobius band at any point. Trace along the edge without lifting your finger. You will visit the *entire* boundary — both what looks like the 'top edge' and what looks like the 'bottom edge' — before returning to your starting point. This proves it is a single continuous edge.

```
Normal band (0 twists):          Mobius band (half-twist):

  Edge A ─────────────────        Edge A ─────────┐
  |                      |        |                 ↓ (twist)
  |    cord is trapped   |        |    cord can     |
  |    between edges     |        |    follow edge  |
  |                      |        |    all the way  |
  Edge B ─────────────────        └────────── Edge A
                                  (same edge!)
  2 boundary components           1 boundary component
  Cord cannot escape              Cord can escape
```

**Physical Intuition:** What you feel in your hands: as you slide the cord along the band toward the twist, you feel it transition smoothly from what looks like the 'inside face' to the 'outside face' without ever leaving the surface. At the twist, the cord just... keeps going. There's no barrier, no edge to cross. The twist that looks like a complication is actually an open door.

*For the mathematical foundation of orientability and boundary components, see [Topology Primer: Orientability and the Mobius Band](../theory/topology-primer.md#orientability-and-the-mobius-band).*

## Solution

1. Identify the half-twist in the leather band (where the rivet join is)
2. Slide the cord along the band's surface toward the half-twist
3. At the twist, feed the cord through: pass it along the surface, following the twist to what *appears* to be the "other side" of the leather — but is actually the same side

```
Checkpoint (after step 3):
The cord has followed the twist and is now on what appears to be
the "other face" of the leather. But it's the same face — the
Mobius property in action. Continue sliding in the same direction.
```

4. Continue working the cord along the band, now on the "opposite face" (same face, topologically)
5. The cord eventually reaches the point where it can slide off the band's single edge

The key physical move: at the half-twist, pinch the leather flat and slide the cord across the twist point. This transfers the cord from one "face" to the other (same face). Repeat the sliding motion around the band until the cord clears the edge.

## Why It's Tricky

**The twist is perceived as a complication, not a solution.** Solvers look at the half-twist and think "that makes it harder — more tangled." In reality, the twist is precisely what makes escape possible. On an untwisted band, the puzzle would be genuinely unsolvable.

**Two-sided thinking:** People intuitively treat surfaces as two-sided. They think the cord is between a "top edge" and a "bottom edge" and try to pass it over one of those edges. On a Mobius band, there is only one edge, but the visual appearance of two sides persists. The solver must abandon two-sided intuition.

**Lesson:** Twists can change the boundary structure of a surface in ways that enable rather than restrict. Non-orientability (one-sidedness) is not just a mathematical curiosity — it has physical consequences.

## Common Mistakes

1. **Trying to pull the cord over the edge directly.** On a normal band, this would be the only option (and it would fail). On the Mobius band, you don't need to go over the edge — you can reach the edge by following the surface through the twist. Pulling over the edge fights the geometry; sliding through the twist uses it.

2. **Ignoring the half-twist.** Solvers often try to solve the puzzle by working the cord around the non-twisted portions of the band, avoiding the riveted join. But the twist is the solution — it's the feature that converts two edges into one. Working away from the twist guarantees failure.

3. **Confusing the Mobius band with a regular loop.** If you mentally model the band as a simple ring (ignoring the twist), every approach you try will fail because you're solving the wrong puzzle. The twist fundamentally changes the topology.

## Construction Notes

- Use chrome-tanned leather for flexibility; vegetable-tanned leather is too stiff
- The half-twist must be precise: exactly 180 degrees of twist before riveting
- Rivet the join with the overlap lying flat (about 15mm overlap); the rivet heads must be flush so the cord slides over them
- **Visual aid:** Before joining, color one side of the leather (e.g., dye one side dark, leave the other natural). After joining with the half-twist, the color will be continuous — trace it with your finger to verify the Mobius property. This also provides a visual clue for solvers
- The cord must be thin enough (3mm) to slide smoothly around the band, especially through the twist region
- Test that the cord slides freely over the riveted join — file down any sharp edges
