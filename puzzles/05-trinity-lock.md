# Puzzle 5: Trinity Lock

**Difficulty:** Intermediate
**Type:** Assembly
**Topological Principle:** Borromean rings (no pairwise linking)

---

## Overview

Three rigid steel ovals must be interlocked into a configuration where all three are mutually linked — yet no two are linked to each other. Remove any one oval, and the other two fall apart. This is the Borromean property, and assembling it requires a fundamentally different approach than "connect two, then add a third."

This is the puzzle that **seems easy but is actually hard.**

## Components

| Part | Material | Dimensions |
|------|----------|-----------|
| Oval A (Red) | 4mm steel rod, welded, painted red | 80mm x 40mm |
| Oval B (Blue) | 4mm steel rod, welded, painted blue | 80mm x 40mm |
| Oval C (Yellow) | 4mm steel rod, welded, painted yellow | 80mm x 40mm |

All three ovals are identical in size. The elongated shape (2:1 aspect ratio) is critical — it provides just enough room for one oval to pass through another at the narrow crossing point.

The inner dimensions are approximately 72mm x 32mm. Two overlapping 4mm rods occupy 8mm, leaving 24mm of clearance at the narrow crossing — sufficient for one rod to pass through.

## Setup

The solver receives three separate, unlinked ovals and a **target diagram** showing the Borromean configuration:

```
        A (Red)
       / \
      /   \
     /  B  \        B (Blue) passes through A
    |  / \  |
    | /   \ |
    |/ C   \|       C (Yellow) passes through B
    +-------+       A passes through C
```

**Over-under pattern:** A goes over B, B goes over C, C goes over A. No two are linked — only the three-way interaction creates the lock.

## Objective

Interlock the three ovals into the Borromean configuration. Verify by:
1. Confirming all three hold together as a cluster
2. Removing any single oval and confirming the other two fall apart immediately
3. Reassembling

## The Topology

The **Borromean rings** are the simplest example of a **Brunnian link**: a link of n components where removing any one component makes the remaining n-1 components completely unlinked.

Key properties:
- **Pairwise linking number = 0** for every pair. No two ovals are linked.
- **Milnor invariant (triple linking number) ≠ 0.** The three-component interaction is non-trivial.
- The link cannot be assembled by first linking any two components and then adding the third, because no two components are ever linked at any stage.

This teaches that **topological properties can be collective** — emergent from the interaction of all components, not reducible to pairwise relationships.

### What Makes Borromean Links Special

The Borromean property is a higher-order linking phenomenon detected by the **Milnor triple linking number** (μ-invariant). While the ordinary linking number (which detects pairwise linking) is 0 for every pair, the Milnor invariant is non-zero, capturing the three-body interaction.

Think of it this way: ordinary linking is like a handshake between two people. Borromean linking is like three people each holding the wrist of the person to their left — no two people are directly connected, but the whole group is bound together. Breaking any one person's grip frees everyone.

*For the mathematical details of Borromean and Brunnian links, see [Topology Primer: Borromean and Brunnian Links](../theory/topology-primer.md#borromean-and-brunnian-links).*

**Physical Intuition:** What you feel in your hands: during assembly, the ovals keep falling apart. Nothing holds until all three are woven. The moment the third oval threads into place, you feel a sudden resistance — the cluster locks. It's satisfying precisely because the transition from 'nothing holds' to 'everything holds' is instantaneous. There's no gradual tightening. This is the physical signature of an irreducibly collective property.

## Solution

The assembly **cannot** be done sequentially — linking any two first is impossible since no two are linked.

### Step 1: Lay the foundation
Hold **Red (A)** flat on a table, long axis left-to-right.

### Step 2: Position Blue
Place **Blue (B)** perpendicular to Red, so Blue's long axis runs front-to-back. Position Blue so it crosses Red at Red's center. **Blue's top rod passes OVER Red's top rod.** Blue's bottom rod passes UNDER Red's bottom rod. (Blue rests tilted, crossing Red.)

### Step 3: Thread Yellow
Take **Yellow (C)** and thread it through the assembly:
- Yellow's left rod goes **OVER Red's** right rod (entering from above)
- Yellow continues and goes **UNDER Blue's** front rod (passing beneath)
- Yellow's right rod goes **OVER Blue's** back rod (exiting above)
- Yellow's bottom rod passes **UNDER Red's** left rod

The over-under cycle: **Red over Blue, Blue over Yellow, Yellow over Red.**

### Step 4: Lock and verify
Carefully slide the three ovals together, maintaining the crossing pattern. They should click into a stable cluster.

**Verification test:** Remove Red. Blue and Yellow should immediately separate with no resistance. If they stay together, the weaving is wrong — check the over-under pattern.

Repeat the test for each oval: remove Blue (Red and Yellow should separate) and remove Yellow (Red and Blue should separate).

### Borromean Configuration — Three Views

```
Front view:              Top view:              Side view:

    ╔══Red══╗               Blue                  Blue
    ║       ║             ┌──┼──┐               ┌──┼──┐
  ──╫─Blue──╫──         ──╪══╪══╪── Red       ──╪══Red═╪──
    ║       ║             └──┼──┘               └──┼──┘
    ╚═══════╝              Yellow                 Yellow

In each view, crossings show which oval passes over/under:
- Red OVER Blue (Red's rod is above Blue's where they cross)
- Blue OVER Yellow (Blue's rod is above Yellow's where they cross)
- Yellow OVER Red (Yellow's rod is above Red's where they cross)
```

## Why It's Tricky

**The pairwise instinct:** Every problem-solving instinct says "connect two things first, then add the third." Solvers spend significant time trying to link A to B, failing (because they can't be linked), and concluding the puzzle is broken. The insight that no two ovals should ever be linked — that the connection is purely a three-body phenomenon — is deeply counterintuitive.

**Assembly order confusion:** Even after understanding the Borromean property, the simultaneous threading of all three is mechanically awkward. The ovals keep falling apart during assembly because the configuration is unstable until all three are in position.

**The "easy" trap:** Three ovals, just put them together. How hard can it be? The simplicity of the components belies the conceptual difficulty. This is the most common puzzle in the series to be underestimated.

**Lesson:** Some properties are irreducibly collective. You cannot build a Borromean link incrementally — it exists as a three-body phenomenon or not at all.

## Common Mistakes

1. **Linking two ovals first, then trying to add the third.** No two ovals should ever be linked. If Red and Blue seem to hold together without Yellow, the weaving is wrong. Start over.

2. **Getting the over-under cycle backwards.** If the pattern is Red-under-Blue, Blue-under-Yellow, Yellow-under-Red instead of over, the assembly looks correct but is actually the mirror image. It still works as a Borromean link! But it won't match the target diagram. Either orientation is topologically valid.

3. **Not sliding the ovals tightly enough.** The Borromean configuration only locks when the ovals are snug against each other. If they're loosely arranged, gravity will pull them apart even when correctly woven. Push them together until each crossing is firm.

## Construction Notes

- Weld ovals precisely: any asymmetry in the shape makes threading harder
- Grind all welds perfectly flush — any bump will catch on other ovals during the tight threading
- Paint or powder-coat in three distinct, bright colors; color is essential for following the over-under pattern
- Inner clearance at the narrow dimension (32mm) must accommodate two 4mm rods passing through (8mm total), leaving 24mm of play — this is adequate but not generous
- Include a printed **solution diagram** showing the over-under pattern from three orthogonal views (front, top, side) with color-coded ovals
- Consider providing a small display stand (three short dowels in a wooden base) for the completed configuration
