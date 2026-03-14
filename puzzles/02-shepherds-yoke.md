# Puzzle 2: Shepherd's Yoke

**Difficulty:** Beginner
**Type:** Disentanglement
**Topological Principle:** Buttonhole homotopy

---

## Overview

A closed cord loop is threaded through a hole in a wooden paddle. The loop is far too short to slip over the paddle's edges. It appears permanently attached — until you realize the paddle can pass through the loop, not the other way around.

## Components

| Part | Material | Dimensions |
|------|----------|-----------|
| Paddle | Hardwood (maple or beech) | 150mm x 80mm x 10mm |
| Hole | Drilled through center | 20mm diameter |
| Cord loop | 5mm braided nylon, spliced closed | 200mm circumference |

The paddle perimeter is approximately 460mm. The loop circumference (200mm) is less than half the perimeter — it cannot be slipped over any edge.

## Setup

```
    +-------------------+
    |                   |
    |                   |
    |     (  O  )       |    <-- 20mm hole in center
    |     / loop \      |
    |    |        |     |
    +----+--------+-----+
         |  loop  |
         \________/          <-- loop hangs below
```

The cord loop passes through the hole. One side hangs in front, one side behind. The loop is clearly too short to go around the paddle.

## Objective

Remove the cord loop from the paddle entirely. Nothing may be cut, untied, or broken.

## The Topology

This is the classic **buttonhole puzzle**. The paddle is a surface with one handle (the hole makes it genus 1). The cord loop is threaded through that handle. The key topological fact: a loop threaded through a handle can be freed by passing the **body** through the **loop**, rather than the loop over the body. This works because the hole provides a path for material to transfer from one side to the other.

The critical dimensional relationship: the shortest edge of the paddle (80mm) must be less than half the loop circumference (200mm / 2 = 100mm). Since 80mm < 100mm, the paddle can fit through the loop.

The hole in the paddle makes it topologically equivalent to a torus (donut) rather than a disk. A solid disk has genus 0 — no handles, no through-holes. The paddle, with its 20mm hole, has genus 1: one handle. In topology, a 'handle' is any feature that allows a loop to pass through the object without being contractible to a point. The hole IS the handle — the cord loop passes through it and cannot be shrunk to nothing while staying on the paddle.

**Physical Intuition:** What you feel in your hands: when you push the bight through the hole, you're exploiting the handle. The material of the paddle can pass through the loop because the hole provides a shortcut — a path from one side of the paddle to the other without going over any edge. You're literally moving the paddle through itself (via the hole) to get it through the loop.

*For more on genus and handles, see [Topology Primer: Genus and Handles](../theory/topology-primer.md#genus-and-handles).*

## Solution

1. Gather all the cord slack on one side of the paddle (front)
2. Push a **bight** (a U-shaped fold of the cord, without pulling the ends through) of cord back through the hole from front to back

```
Checkpoint (a) — bight pushed through hole:

    +-------------------+
    |                   |
    |     (  O  )       |    <-- hole
    |      bight        |
    |    emerges on     |
    +---back side-------+
         |      |
         | bight |           <-- bight of cord now on back side
         |______|
```

3. On the back side, you now have a loop of cord emerging from the hole
4. Stretch this bight over the **short edge** (80mm) of the paddle

```
Checkpoint (b) — bight stretched over short edge:

    +---------+=========+    <-- bight stretching over the 80mm edge
    |         |  bight  |
    |  (  O  )|  going  |
    |         |  over   |
    +---------+=========+
```

5. Pull the bight all the way over the edge and to the front
6. The cord loop is now around the paddle's body, not through the hole

```
Checkpoint (c) — cord loop now around body:

    +-------------------+
    |                   |
    |     (  O  )       |    <-- hole is now empty
    |                   |
    +-------------------+
    |~~ cord loop ~~~~~~|    <-- loop is around the paddle body
    |~~~~~~~~~~~~~~~~~~~|
```

7. Slide it off any edge — it's free

## Why It's Tricky

The solver's mental model is: "the loop is on the cord, the cord goes through the hole, therefore the loop is trapped." They try to enlarge the loop or find a way to slip it over the paddle's edges.

The non-obvious insight is an **inversion**: instead of the loop moving over the paddle, the paddle moves through the loop. The hole isn't a trap — it's the escape route. The solver must push material *back through* the hole to create enough loop on the other side to pass the paddle through.

**Lesson:** When a flexible object seems trapped on a rigid one, consider whether the rigid object can pass through the flexible one instead.

## Common Mistakes

1. **Trying to stretch the loop over the paddle's long edge.** The loop circumference (200mm) cannot span the 150mm length. The solution only works over the short 80mm edge, where the loop has 20mm of clearance on each side. Solvers who fixate on the long axis never find the solution.

2. **Pulling the cord through the hole repeatedly without creating a bight.** Solvers pull the cord back and forth through the hole, which accomplishes nothing. The key is pushing a *folded* section (bight) through, which creates a loop on the other side large enough to pass the paddle through.

3. **Trying to cut the cord or squeeze it through a gap.** There is no gap and nothing to cut. The solution uses only the existing geometry — hole, edge, loop — in combination.

## Construction Notes

- Use a drill press with a 20mm Forstner bit for a clean hole
- Sand the hole's edges smooth (round them slightly) so cord slides without catching
- Sand the paddle to 220 grit, finish with beeswax for smooth cord sliding
- The cord splice must be neat and flat — a bulky splice will catch in the hole
- Test the critical relationship: the bight must pass over the 80mm edge with ~20mm to spare on each side
