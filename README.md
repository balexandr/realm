# Realm — Daily Region Puzzle

A daily puzzle game where you place one crown in every row, column, and
colored region — no two crowns may touch, not even diagonally.

Part of the [NoodleGames](https://noodlegames.co) family alongside **Pathways** and **Sprout**.

---

## How to play

Tap a cell to cycle it through `empty → ✕ → 👑 → empty`. The ✕ is a pure
scratch mark for your own deduction — it has no effect on solving.

- Every row, every column, and every colored region gets exactly **one** crown.
- Two crowns can never sit diagonally next to each other.
- No submit button — the puzzle locks in the instant every rule holds at once.
- Free retry forever. There's no fail state and no penalty for backtracking;
  the whole game is deduction, not risk management.
- Resets daily at **midnight ET**.

---

## Scoring

Solve time only — no par or guess penalty, since ✕ marks are free scratch
notes rather than guesses. The timer starts on your first tap, not on page load.

---

## Sharing

After a solve you can share your solve time. Once you've finished at least
one NoodleGame today, a **Share all completed** button appears in the
footer, letting you share every game you've solved today in one message.

---

## Stack

React + Vite · CSS Modules · localStorage · GitHub Pages

---

## Puzzles

Puzzles run from **August 21, 2026** onward (180 days, through February 2027),
stored in `src/data/puzzles.json` keyed by date. Each entry has a grid size,
colored region layout, and the unique crown solution.

Puzzles are generated, not hand-written: `scripts/generate-puzzles.mjs`
uses an active carving algorithm — find an alternate valid crown placement,
hand one of its cells to a region another alternate solution depends on
(breaking that alternate), repeat until a solver proves the puzzle has
exactly one solution. A smoothing pass then merges stray disconnected
region fragments into neighbors, re-verifying uniqueness after every merge.

See [GAME_DESIGN.md](./GAME_DESIGN.md) for the full design history —
puzzle generation approach and why the genre was picked.
