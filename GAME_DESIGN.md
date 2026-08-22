# Realm — Game Design & Technical Guide

Status: **design only** — not built yet. This doc exists so the concept
survives even if the build gets interrupted (see [[Mirror's history]] —
lost that concept once already by not writing it down in time).

## Concept

Daily region-placement logic puzzle, same genre as LinkedIn's "Queens"
(we are NOT calling it Queens — that's their trademark, not a generic
term). Grid is divided into N irregular colored regions. Place exactly
one crown so that every row, every column, and every region has
exactly one — and no two crowns touch, including diagonally.

Pure logic, one deterministic solution per puzzle, zero trivia
knowledge required. This is a deliberate parallel to Pathways (the
suite's best-loved game) and a deliberate departure from Odd One Out
(the least-loved) — see "Why this genre" below.

## Why this genre

Pathways works because: single deterministic solution, no trivia
recall, no guess-anxiety (redraw as much as you want), and it
self-solves the instant you're right — the win feels *discovered*,
not *submitted*. Odd One Out struggles because: one-shot guess against
recalled trivia, feels arbitrary when the "why" isn't airtight, no
room to experiment before committing.

Realm copies Pathways' formula on every axis above, in a new
mechanical shape (region+placement logic instead of path-drawing), so
it's genuinely new to play rather than a Pathways reskin.

## Core Mechanic

- Grid: N×N, N regions, N crowns to place (one crown per row, column,
  AND region — since there are exactly N of each, this always works
  out if the puzzle is well-formed).
- **Adjacency rule**: two crowns may never occupy diagonally adjacent
  cells (e.g. (r,c) and (r+1,c+1)). Orthogonal adjacency is already
  impossible once one-per-row/one-per-col holds, so this is the only
  *extra* constraint beyond row/col/region uniqueness — don't
  over-implement it as a general "no neighbors at all" check.
- **Cell interaction**: tap cycles `empty → ✕ (marked) → 👑 (crown) →
  empty`. The ✕ mark is a pure scratch-pad for the player (rule this
  cell out) — it has zero effect on win-checking. Real players lean on
  this heavily to do deduction visually; don't skip it to save a
  build step.
- **No submit button, no fail state** — matches Pathways/Sprout, not
  Mirror/Sequence. Win-check runs continuously; the puzzle solves
  itself the instant all constraints hold simultaneously:
  - exactly one crown in every row
  - exactly one crown in every column
  - exactly one crown in every region
  - no two crowns diagonally adjacent
- Free retry forever. No "guesses" concept, no penalty for wrong
  placements or for undoing — the entire skill is deduction, not risk
  management. This is intentional, not a missing feature.

## Puzzle Generation

Two-phase generation, same spirit as Pathways' Hamiltonian-path
generator and Mirror's par-verified puzzles — generate, then verify,
don't hand-author:

1. **Generate a valid solution first.** Build a random permutation
   `π` of `0..N-1` (row `r` → crown at column `π(r)`) such that no two
   *consecutive* rows have columns differing by exactly 1 (that's the
   only way two row/col-unique cells could ever be diagonally
   adjacent). Retry the permutation until this holds.
2. **Grow regions from those N seed cells.** Flood-fill/BFS all N
   seeds outward simultaneously, claiming unclaimed neighbor cells at
   random, until every cell on the grid belongs to exactly one region.
   Bias the growth randomness by difficulty — blockier regions early
   in the week, jagged/interleaved regions later.
3. **Verify uniqueness with a solver.** Backtracking search over the
   generated region layout must find *exactly one* valid crown
   placement satisfying all four win conditions. If zero or 2+
   solutions come back, discard and regenerate. Ship nothing
   unverified — same rule Mirror learned the hard way with unverified
   par claims.

## Difficulty / Weekday Curve

Unlike Pathways (size and color-count vary independently), region
count always equals grid size here, so difficulty is purely grid size
(plus how jagged the region-growth bias is). Proposed curve, mirroring
Pathways' Mon→Sun ramp:

| Day | Size | Region growth bias |
|-----|------|---------------------|
| Mon | 5×5  | blocky (easy to eyeball) |
| Tue | 6×6  | blocky |
| Wed | 6×6  | mixed |
| Thu | 7×7  | mixed |
| Fri | 7×7  | jagged |
| Sat | 8×8  | jagged |
| Sun | 9×9  | jagged |

Tune after real playtesting, same as every other game in this suite —
treat this table as a starting point, not a contract.

## Scoring / Stats

No par, no move-count penalty (✕ marks are free scratch work, not
guesses to be judged). Score is **solve time**, same feel as Sprout:

- Timer starts on first crown/✕ placement, stops on solve.
- Stats screen: streak + time distribution (fast/typical/slow bucket),
  not a 0-3 star breakdown like the guess-based games.
- Share text: `Realm #N 🏰 MM:SS` — no link in the text (per the
  standing fix applied to Mirror; check this before shipping).

## Puzzle Data Format

```js
{
  size: 6,
  regions: [
    // one entry per cell, row-major, value = region id 0..N-1
    0, 0, 1, 1, 2, 2,
    0, 3, 1, 4, 2, 5,
    // ...
  ],
  solution: [2, 0, 4, 1, 5, 3], // solution[row] = col, for solver QA only
}
```
`solution` ships in the data file for the test/QA script to check
against (verify the shipped region layout still has exactly one valid
placement, and that it matches), but the client never reads it —
win-checking is derived purely from crown positions + regions, same
as every other Noodle game never trusting a stored "answer" client-side
in a way a curious player could find in devtools without it mattering
(the regions themselves are the puzzle; there's nothing to leak).

## Shared Noodle Pattern Compliance

Per the standing suite rule (same footer/logo font/unique-icon feel,
same share-by-text ability):
- `getTodayKey()` via `Intl.DateTimeFormat('en-CA', { timeZone:
  'America/New_York' })`, same as every other game.
- Puzzle number = `Math.floor((today - EPOCH) / 86400000) + 1`.
- localStorage keys: `realm-game-state`, `realm-stats`.
- CSS Modules, How-to-play modal (first-visit flag), Stats modal,
  footer `© YEAR NoodleGames.co`.
- Add to `noodle_games/src/data/games.js` hub roster.
- Add `{ id: 'realm', label: 'Realm' }` to every sibling repo's
  `src/utils/shareAll.js` GAMES array (8 existing repos + this one's
  own copy = 9 total after this ships).
- Subdomain: `realm.noodlegames.co` (CNAME + DNS entry needed before
  going live — same GoDaddy wildcard should already cover it since
  it's `*.noodlegames.co`, confirm rather than assume).
- Accent color: **teal `#14b8a6`** — not used by any existing game
  (closest is Squint's cyan `#06b6d4`, distinct enough).

## Open Questions / Not Yet Decided

- EPOCH date: set to the actual ship date once built, not decided
  here — Mirror's EPOCH got reset once already because build/tuning
  days got counted as "real" puzzle history by mistake. Don't repeat
  that.
- Exact region-growth "jaggedness" tuning is a guess until playtested.
- Whether marks (✕) persist across a page reload mid-solve (probably
  yes, same as everything else being saved to localStorage keyed by
  dateKey) — confirm during build, not decided here.

## Implementation Notes

(Empty — fill in here once built, same convention as Mirror's
GAME_DESIGN.md, which has the full as-built deviation history at the
bottom. Don't let this section stay empty after the first build pass.)
