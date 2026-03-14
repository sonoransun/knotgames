# Puzzle 7: The Ferryman's Knot

**Difficulty:** Advanced
**Type:** Disentanglement
**Topological Principle:** Open knot vs. closed knot; Reidemeister moves on constrained arcs

---

## Overview

A cord wraps around a post in what looks like a trefoil knot pattern — three crossings that appear hopelessly tangled. A ring trapped on the post connects one end; a hook in the base anchors the other. Knot theory says trefoils can't be unknotted. But this isn't a trefoil. It's an open arc on a fixed axis, and the rules are completely different.

**This is the puzzle that seems impossible but isn't.**

## Components

| Part | Material | Dimensions |
|------|----------|-----------|
| Post | Hardwood (maple) dowel | 20mm diameter, 200mm tall |
| Base | Hardwood block | 100mm x 100mm x 25mm |
| Ball finial | Wooden ball | 30mm diameter, glued to post top |
| Ring | Welded steel O-ring | 50mm OD (~42mm ID) |
| Cord | 5mm braided nylon | 600mm long |
| Hook | Steel screw hook | Screwed into base, 50mm from post |

The ring is around the post (trapped by the finial, which is wider than the ring's inner diameter). One cord end ties to the ring; the other ties to the hook.

## Setup

```
         ___
        ( O )      <-- 30mm ball finial
         | |
     ~~~/   \~~~   <-- cord wraps with 3 crossings
    ~~/       \~~       (trefoil-like pattern)
   ~/    POST   \~
    \           /
     \_________/
         |
       [RING]      <-- ring around post, below wraps
         |
       (cord)
         |
       [HOOK]      <-- hook in base
    ___________
   |   BASE    |
```

The cord runs from the hook in the base upward, wraps around the post three times with specific over-under crossings that resemble a trefoil knot, and terminates at the ring on the post. The ring can slide up and down the post but cannot be removed (finial prevents it).

## Solved State

```
         ___
        ( O )      <-- 30mm ball finial
         |
         |          cord hangs freely alongside post
         |          no wraps around post
       [RING]      <-- ring still on post (trapped by finial)
         |
       ~~cord~~
         |
       [HOOK]      <-- hook still in base
    ___________
   |   BASE    |
```

## Objective

Untangle the cord so it hangs freely from hook to ring without wrapping around the post. The ring stays on the post. The hook stays in the base. Nothing is cut or untied.

## The Topology

A **trefoil knot** is a closed curve with three crossings that cannot be simplified (it has crossing number 3). It is the simplest non-trivial knot. If this cord were a closed curve forming a trefoil, it would indeed be impossible to unknot.

But this cord is an **open arc** — it has two endpoints (the hook and the ring). More importantly, one endpoint (the ring) is constrained to a fixed axis (the post). The cord is not a knot in the classical sense; it is an **arc in the complement of a line** (the post).

Open arcs on fixed axes can always be unwound. The wraps are not true knot crossings because the arc's endpoint can slide along the axis, effectively passing "over" or "under" each crossing. Each wrap can be individually resolved by lifting it over the ball finial.

The three crossings correspond to three Reidemeister moves (type I: twist removal), each executed by passing a cord loop over the finial.

### Reidemeister Moves and Why They Matter

In knot theory, **Reidemeister moves** are the three elementary operations that can be performed on a knot diagram without changing the knot type:

- **Type I:** Add or remove a simple twist (a loop that crosses itself once)
- **Type II:** Add or remove two crossings where one strand passes over another
- **Type III:** Slide a strand over or under a crossing

Each wrap removal in this puzzle is a **Type I Reidemeister move** — removing a simple twist. In knot theory, Type I moves don't change the knot type. Since the cord started as an unknot (it's an open arc with endpoints on the hook and ring), each twist removal brings it closer to the visually obvious unknot (a straight cord hanging from hook to ring).

```
Type I move (twist removal):

  Before:        After:
    |               |
    \               |
     \              |
      )   →         |
     /              |
    /               |
    |               |

  One crossing     Zero crossings
  removed          (simpler diagram)
```

The key insight: on a closed curve, these three crossings form a trefoil (non-trivial knot). On an open arc with a fixed axis, the same three crossings are three independent twists, each removable by a Type I move. The fixed axis (the post) turns what would be a genuine knot into a sequence of removable twists.

What you feel in your hands: each wrap feels like its own little puzzle. You slide the ring down for slack, gather the outermost cord loop, and stretch it over the ball finial. There's a satisfying moment when the loop clears the ball and the wrap falls away. The cord noticeably simplifies — one fewer crossing visible. After three of these, the cord hangs straight. Each removal is identical in feel; the puzzle has a rhythm to it.

*For the full treatment of knot theory concepts including Reidemeister moves, see [Topology Primer: Knot Theory Basics](../theory/topology-primer.md#knot-theory-basics).*

## Solution

1. **Slide the ring down** to the base of the post, as low as it will go. This creates maximum slack in the cord near the top of the post.

2. **Identify the outermost wrap** — the one closest to the finial with the most clearance around it.

3. **Lift the outermost wrap over the finial:**
   - Gather the slack in the wrap
   - Push the cord loop upward toward the finial
   - Stretch the loop over the 30mm ball
   - Pull through and down the other side
   - The wrap is eliminated

```
Checkpoint (a) — After removing wrap 1:

         ___
        ( O )      <-- finial
         | |
     ~~~/   \~~~   <-- 2 wraps remain
    ~~/       \~~
         |
       [RING]
         |
       (cord)
         |
       [HOOK]

Two crossings remain. The cord is visibly simpler.
```

4. **Repeat for the second wrap.** Slide the ring down again for slack. Lift the now-outermost wrap over the finial.

```
Checkpoint (b) — After removing wrap 2:

         ___
        ( O )      <-- finial
         | |
     ~~~/   \~~~   <-- 1 wrap remains
         |
       [RING]
         |
       (cord)
         |
       [HOOK]

One crossing remains. Almost there.
```

5. **Repeat for the third wrap.** Same process.

```
Checkpoint (c) — After removing wrap 3 (SOLVED):

         ___
        ( O )      <-- finial
         |
         |          <-- cord hangs straight
         |              no wraps, no crossings
       [RING]
         |
       (cord)
         |
       [HOOK]
    ___________
   |   BASE    |

The cord hangs freely from hook to ring alongside the post.
```

6. The cord now hangs freely from hook to ring, draping alongside the post without wrapping it.

Each individual move takes 10-15 seconds. The total solution takes under a minute once understood.

## Why It's Tricky

**Knowledge becomes a trap.** Anyone who knows even basic knot theory will look at three crossings and think "trefoil" — and trefoils can't be unknotted. The more knowledge a solver has, the more convinced they are that the puzzle is unsolvable. This is rare: a puzzle where expertise is a handicap.

**The finial looks like a constraint, not a tool.** The ball on top of the post seems to exist to trap the ring (which it does). Solvers don't consider that it also provides the fulcrum for unwinding the cord. Its dual role — constraint for the ring, tool for the cord — is not obvious.

**Open vs. closed confusion.** The cord has two free ends, but because it wraps around the post multiple times, it *looks* like a closed knot. The wrapping disguises the fact that it's an open arc. Solvers must recognize that the cord's endpoints change the topological category of the problem entirely.

**Lesson:** Open arcs on fixed axes follow fundamentally different rules than closed knots in free space. The same visual pattern (three crossings) can be trivially unknottable or permanently knotted depending on whether the curve is open or closed.

## Common Mistakes

1. **Assuming it's a trefoil and giving up.** Anyone with knot theory knowledge will look at three crossings and think "trefoil — impossible." But a trefoil is a closed curve. This cord is an open arc. The post provides a fixed axis that makes each wrap independently removable. Knowledge of knot theory is, ironically, the biggest obstacle.

2. **Trying to lift wraps from the bottom (near the ring).** The wraps must be removed from the TOP — over the finial. The finial is the fulcrum. Working from the bottom tangles the cord further because you're pushing crossings into the constrained space near the base.

3. **Not creating enough slack.** Each wrap removal requires pushing the ring all the way down to the base to maximize slack near the finial. If the ring is halfway up the post, there won't be enough cord length to stretch the loop over the 30mm ball. Slide the ring down FIRST, every time.

4. **Removing wraps in the wrong order.** Always remove the OUTERMOST wrap (closest to the finial). Attempting to remove an inner wrap while outer wraps are present creates additional tangles.

## Construction Notes

- **Finial sizing is critical:** The ring's inner diameter (~42mm) is larger than the finial (30mm), but the ring is around the post (20mm), so the ring is trapped: the finial's 30mm diameter cannot pass through the ring when the ring is on the 20mm post. But the cord (5mm) can be passed over the finial with effort — the finial circumference (~94mm) requires a cord loop of at least 94mm to pass over it, and the 600mm cord provides ample slack
- Glue the finial with strong wood glue or epoxy; it must withstand upward tugging
- The **crossing pattern** must be set up precisely. Include a detailed setup diagram (instruction card) showing exactly which strand crosses over which. If the solver re-tangles the cord incorrectly, it may become a pattern that truly cannot be unwound on the post
- Mount the post securely in the base (drill a 20mm hole, glue with epoxy, add a screw from underneath)
- Sand the post smooth — the cord must slide freely up and down
- The hook should be a smooth screw-in hook (not a sharp cup hook) to prevent cord damage
