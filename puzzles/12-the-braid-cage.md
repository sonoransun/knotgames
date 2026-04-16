# Puzzle 13: The Braid Cage

**Difficulty:** Intermediate-Advanced
**Type:** Transfer
**Topological Principle:** Braid groups (Yang-Baxter relation)

---

## Overview

Three colored rings sit on three posts connected by cords. The rings must be rearranged to target positions — but naive swap sequences tangle the cords into impossible configurations. Only specific sequences that obey the braid group's algebraic relations keep the cords untangled.

## Components

| Part | Material | Dimensions |
|------|----------|-----------|
| Base | Hardwood | 180mm x 60mm x 15mm |
| Posts (x3) | 10mm dowel | 120mm tall, 50mm spacing |
| Finial balls (x3) | Wood | 14mm diameter, press-fit on posts |
| Red ring | Steel, painted | 35mm OD, 4mm wire |
| Blue ring | Steel, painted | 35mm OD, 4mm wire |
| Yellow ring | Steel, painted | 35mm OD, 4mm wire |
| Cords (x2) | 4mm paracord | 100mm each, anchored through base |

Each cord connects adjacent post pairs through holes in the base, constraining which rings can pass over which posts.

## Setup

![Three posts with colored rings and connecting cords](../diagrams/puzzles/12-the-braid-cage/setup.svg)

1. Three posts stand in a row on the base, spaced 50mm apart
2. Each post has a finial ball at the top
3. Initial ring positions: Blue (left), Yellow (center), Red (right)
4. Target positions: Red (left), Blue (center), Yellow (right)
5. Cord 1 connects left and center posts through the base
6. Cord 2 connects center and right posts through the base
7. Target positions are marked by colored dots on the base

## Objective

Move each ring to its target post without cutting, detaching, or tangling the cords. After the rearrangement, the cords must hang freely without knots or twists.

## The Topology

The three rings on three posts form a **braid** — and the allowed moves are the **generators** of the braid group on three strands.

### What Is a Braid Group?

A **braid** on n strands is a set of n non-intersecting curves connecting n top points to n bottom points, where the curves may cross over and under each other. Two braids are equivalent if one can be continuously deformed into the other. The set of all braids on n strands, with composition (stacking) as the operation, forms the **braid group** B_n.

For three strands, the braid group B_3 has two generators:
- **sigma_1**: swap strands 1 and 2 (strand 1 crosses over strand 2)
- **sigma_2**: swap strands 2 and 3 (strand 2 crosses over strand 3)

These generators do not commute: sigma_1 * sigma_2 does NOT equal sigma_2 * sigma_1. The order of swaps matters — performing them in the wrong order tangles the cords.

### The Yang-Baxter Relation

Two sequences of ring-swaps can land every ring in the same final position **and yet** leave the cords in completely different states — one set hanging clean, the other twisted into knots. The algebraic rule that distinguishes "clean" sequences from "twisted" ones is the **Yang-Baxter relation** (also called the braid relation):

**σ₁ · σ₂ · σ₁ = σ₂ · σ₁ · σ₂**

In words: swap-left-then-center-then-left produces the same braid as swap-center-then-left-then-center. Both sequences achieve the same permutation of the rings AND leave the cords in the same untangled state. Most other 3-swap sequences with the same permutation produce *different* (tangled) braids.

![Braid sequence showing the Yang-Baxter relation](../diagrams/puzzles/12-the-braid-cage/braid-sequence.svg)

**Why this matters for the puzzle:** the cords are physically anchored. They record every swap you perform, like a transcript. If your transcript respects the Yang-Baxter relation (and the trivial relation σᵢ · σᵢ⁻¹ = identity), the cords stay clean. If it doesn't, you'll end up with the right ring positions but the cords tangled around each other, physically resisting the final placement. **You can feel non-commutativity in your hands** — the tangle is the algebra refusing to let you cheat.

![Yang-Baxter relation: two equivalent braid words](../diagrams/puzzles/12-the-braid-cage/yang-baxter.svg)

**Physical Intuition:** What you feel in your hands: when you lift a ring over a finial and place it on the adjacent post, the cord connecting those posts either hangs freely or develops a twist. After a correct braid sequence, the twists cancel and the cords hang straight. After an incorrect sequence, the cords are visibly twisted around each other and resist the final placement. The tangle IS the failure of the braid relation — you can feel non-commutativity.

*For more on braids and their algebra, see [Topology Primer: Braid Groups](../theory/topology-primer.md#braid-groups).*

## Solution

Initial positions: **Blue · Yellow · Red** (posts 1·2·3). Target: **Red · Blue · Yellow**.

The permutation needed is a 3-cycle: the ring at post 1 ends at post 2, post 2's ring ends at post 3, post 3's ring ends at post 1. The minimum braid word that achieves this with clean cords is **σ₂ · σ₁** (two adjacent swaps):

| Step | Operation | Physical move | Positions after |
|------|-----------|---------------|-----------------|
| 1 | **σ₂** | Swap the rings at posts 2 and 3: lift Yellow over the center finial onto post 3, then lift Red over the right finial onto post 2. | Blue · Red · Yellow |
| 2 | **σ₁** | Swap the rings at posts 1 and 2: lift Blue over the left finial onto post 2, then lift Red over the center finial onto post 1. | **Red · Blue · Yellow** ✓ |

The cords end with the topological signature of a 3-cycle braid: cord 1 (anchored between posts 1 and 2) and cord 2 (anchored between posts 2 and 3) cross once — that's the unavoidable braid generator pattern σ₂σ₁ produces. They are *not* tangled around each other; they hang in a clean two-strand crossing.

**The Yang-Baxter test.** Try the alternative sequence **σ₁ · σ₂** instead:

1. σ₁ first: swap rings at posts 1–2 → Yellow · Blue · Red.
2. σ₂: swap rings at posts 2–3 → Yellow · Red · Blue.

Different final permutation! σ₁σ₂ ≠ σ₂σ₁ — the order matters. This is non-commutativity made physical.

**Why the longer Yang-Baxter sequences (σ₁σ₂σ₁ or σ₂σ₁σ₂) don't appear here.** Those three-letter words give the same permutation as σ₂σ₁ followed by an extra swap that lands one ring back in its original spot — *not* this 3-cycle target. They are useful when you need to demonstrate that two seemingly-different moves are equivalent, not when you're solving a specific permutation. For this puzzle, σ₂σ₁ is both correct and minimal.

## Why It's Tricky

The puzzle exploits the non-commutativity of braids. Solvers instinctively think of ring-swapping as a simple permutation problem — and it is, if you ignore the cords. But the cords enforce the braid structure, and most permutation sequences that achieve the correct ring positions leave the cords tangled.

**Lesson:** When operations have memory (the cords record the history of swaps), the ORDER of operations matters, not just the outcome. Non-commutative algebra is not an abstraction — it is a physical constraint.

## Common Mistakes

1. **Performing sigma_1 twice in a row.** This creates a full twist in cord 1 that cannot be removed without undoing the swap. Adjacent identical generators accumulate twists rather than canceling.

2. **Trying to untangle the cords after achieving the correct permutation.** If the cords are tangled, the braid word was wrong. You cannot fix the cords without moving the rings — the braid is a holistic structure.

3. **Assuming all paths to the target permutation are equivalent.** In the symmetric group S_3, many transposition sequences achieve the same permutation. In the braid group B_3, most of these sequences produce different braid words with different cord configurations.

4. **Ignoring which ring goes OVER vs UNDER at a swap.** The over/under direction matters — sigma_1 and sigma_1^{-1} are different generators. Swapping in the wrong direction introduces the inverse generator, compounding the tangle.

## Construction Notes

- Drill three 10mm holes in the base at 50mm spacing for the posts
- Press-fit posts with a drop of wood glue
- Drill 4mm holes through the base between each adjacent post pair (two holes total), ~15mm deep
- Thread cord through, tie stopper knots on the underside
- Finial balls: drill 10mm socket, 8mm deep, press-fit onto post tops
- Paint rings in distinct colors (automotive spray paint over primer)
- The finial ball diameter (14mm) must be smaller than the ring ID (35 - 2*4 = 27mm) so rings can lift over
- Mark target positions with small colored adhesive dots on the base
