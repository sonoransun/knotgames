// Puzzle registry — display order. The `id` field is the position the user sees
// (sidebar number, hash route). The module file name is a stable identifier
// from creation order and may NOT match `id` after pedagogical reorderings.
// Reorder rationale: Mirror Gate (was 11) → 5 places chirality with the
// "things are not what they seem" arc; Crossing Number (was 16) → 9 puts
// the unknotting-number puzzle adjacent to its trefoil prerequisite (8).
//
// This is the single source of truth for display order, names, and difficulty.
// It is data-only (no DOM, no imports) so both the browser app (app.js) and the
// Node docs generator (scripts/build-docs.js) can consume it. When adding a
// puzzle, append an entry with the next free `id` and a fresh module filename.
export const puzzleRegistry = [
  { id: 1,  module: './puzzles/puzzle-01.js', name: 'The Gatekeeper',      difficulty: 'beginner' },
  { id: 2,  module: './puzzles/puzzle-02.js', name: "Shepherd's Yoke",     difficulty: 'beginner' },
  { id: 3,  module: './puzzles/puzzle-03.js', name: "The Prisoner's Ring", difficulty: 'intermediate' },
  { id: 4,  module: './puzzles/puzzle-04.js', name: 'Mobius Snare',        difficulty: 'intermediate' },
  { id: 5,  module: './puzzles/puzzle-11.js', name: 'The Mirror Gate',     difficulty: 'intermediate' },
  { id: 6,  module: './puzzles/puzzle-05.js', name: 'Trinity Lock',        difficulty: 'intermediate' },
  { id: 7,  module: './puzzles/puzzle-06.js', name: "Devil's Pitchfork",   difficulty: 'advanced' },
  { id: 8,  module: './puzzles/puzzle-07.js', name: "The Ferryman's Knot", difficulty: 'advanced' },
  { id: 9,  module: './puzzles/puzzle-16.js', name: 'The Crossing Number', difficulty: 'intermediate' },
  { id: 10, module: './puzzles/puzzle-08.js', name: 'Ouroboros Chain',     difficulty: 'advanced' },
  { id: 11, module: './puzzles/puzzle-09.js', name: 'Genus Trap',          difficulty: 'expert' },
  { id: 12, module: './puzzles/puzzle-10.js', name: 'The Hopf Paradox',    difficulty: 'expert' },
  { id: 13, module: './puzzles/puzzle-12.js', name: 'The Braid Cage',      difficulty: 'intermediate' },
  { id: 14, module: './puzzles/puzzle-13.js', name: 'The Torus Winder',    difficulty: 'advanced' },
  { id: 15, module: './puzzles/puzzle-14.js', name: 'The Tricolor Lock',   difficulty: 'intermediate' },
  { id: 16, module: './puzzles/puzzle-15.js', name: 'The Seifert Sail',    difficulty: 'advanced' },
  { id: 17, module: './puzzles/puzzle-17.js', name: 'The Satellite Trap',  difficulty: 'expert' },
];
