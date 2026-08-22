// Offline puzzle generator for Realm.
//
// Each puzzle is an N×N grid divided into N irregular colored regions.
// A valid solve places one crown in every row, every column, and every
// region, with no two crowns diagonally adjacent (orthogonal adjacency is
// already impossible once one-per-row/one-per-col holds — see GAME_DESIGN.md).
//
// Generation is two phases, same "generate then verify" spirit as Pathways'
// Hamiltonian-path generator and Mirror's par-verified puzzles:
//   1. Find a valid crown placement (a permutation with no adjacent-diagonal
//      pairs), then grow N regions outward from those N cells until they
//      cover the whole grid.
//   2. Run a solver over the resulting region layout and discard/regenerate
//      unless it comes back with EXACTLY one valid placement. Ship nothing
//      unverified.
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const EPOCH = '2026-08-21';
const NUM_DAYS = 180;

// Reuses the exact hue set Pathways already established for colored regions
// on a dark UI — same convention, same "why," see GAME_DESIGN.md.
const REGION_COLORS = [
  '#f43f5e', '#3b82f6', '#22c55e', '#eab308', '#f97316',
  '#a855f7', '#06b6d4', '#ec4899', '#84cc16',
];

// Difficulty follows day of week, same convention as Pathways. `orderliness`
// controls region-growth bias: near 1.0 grows regions round-robin (blocky,
// easy to eyeball), near 0 grows them in random order (jagged, interleaved).
// Index 0 = Monday ... index 6 = Sunday.
const WEEKLY_DIFFICULTY = [
  { size: 5, orderliness: 0.9 },  // Monday
  { size: 6, orderliness: 0.85 }, // Tuesday
  { size: 6, orderliness: 0.6 },  // Wednesday
  { size: 7, orderliness: 0.55 }, // Thursday
  { size: 7, orderliness: 0.3 },  // Friday
  { size: 8, orderliness: 0.22 }, // Saturday
  { size: 9, orderliness: 0.15 }, // Sunday
];

function difficultyForDate(dateKey) {
  const utcDay = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  const mondayIndexed = (utcDay + 6) % 7;
  return WEEKLY_DIFFICULTY[mondayIndexed];
}

// djb2 string hash -> uint32 seed
function hashSeed(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h >>> 0;
}

// mulberry32 PRNG
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function neighbors(r, c, size) {
  const out = [];
  if (r > 0) out.push([r - 1, c]);
  if (r < size - 1) out.push([r + 1, c]);
  if (c > 0) out.push([r, c - 1]);
  if (c < size - 1) out.push([r, c + 1]);
  return out;
}

// Finds a permutation (row -> col) with no two CONSECUTIVE rows landing in
// diagonally-adjacent columns (|colDiff| === 1). That's the only way two
// row/col-unique cells could ever be diagonally adjacent, so it's the only
// constraint this needs to satisfy — full backtracking, not just one shuffle
// attempt, so it always finds a solution when one exists (it does, for every
// size this generator uses).
function generateSolutionPermutation(size, rng) {
  const cols = Array.from({ length: size }, (_, i) => i);

  function backtrack(row, used, prevCol, perm) {
    if (row === size) return perm.slice();
    const order = shuffle(cols.filter((c) => !used[c]), rng);
    for (const col of order) {
      if (prevCol !== -1 && Math.abs(col - prevCol) === 1) continue;
      used[col] = true;
      perm.push(col);
      const result = backtrack(row + 1, used, col, perm);
      if (result) return result;
      perm.pop();
      used[col] = false;
    }
    return null;
  }

  return backtrack(0, new Array(size).fill(false), -1, []);
}

// Grows N regions outward from N seed cells (the solution's crown positions)
// until every cell on the grid belongs to exactly one region. `orderliness`
// biases whose turn it is: 1.0 = strict round-robin (compact, blocky
// regions), 0 = fully random region picked each step (jagged, interleaved).
function growRegions(size, seeds, rng, orderliness) {
  const total = size * size;
  const regionOf = new Int32Array(total).fill(-1);
  const n = seeds.length;
  const frontiers = seeds.map(() => []);

  seeds.forEach(([r, c], i) => { regionOf[r * size + c] = i; });
  seeds.forEach(([r, c], i) => {
    for (const [nr, nc] of neighbors(r, c, size)) {
      if (regionOf[nr * size + nc] === -1) frontiers[i].push([nr, nc]);
    }
  });

  let claimed = n;
  let turn = 0;

  while (claimed < total) {
    let regionIdx = rng() < orderliness ? turn % n : Math.floor(rng() * n);
    turn++;

    frontiers[regionIdx] = frontiers[regionIdx].filter(([r, c]) => regionOf[r * size + c] === -1);
    if (frontiers[regionIdx].length === 0) {
      let found = false;
      for (let k = 0; k < n; k++) {
        const idx = (regionIdx + k) % n;
        frontiers[idx] = frontiers[idx].filter(([r, c]) => regionOf[r * size + c] === -1);
        if (frontiers[idx].length > 0) { regionIdx = idx; found = true; break; }
      }
      if (!found) break; // grid fully claimed or (shouldn't happen) disconnected
    }

    const pickIdx = Math.floor(rng() * frontiers[regionIdx].length);
    const [cr, cc] = frontiers[regionIdx][pickIdx];
    regionOf[cr * size + cc] = regionIdx;
    claimed++;

    for (const [nr, nc] of neighbors(cr, cc, size)) {
      if (regionOf[nr * size + nc] === -1) frontiers[regionIdx].push([nr, nc]);
    }
  }

  return regionOf;
}

// Backtracking solution counter, capped at `limit` — we only ever need to
// know "exactly 1" vs "not exactly 1," so it bails the instant it finds a
// second solution instead of enumerating all of them.
function countSolutions(size, regions, limit = 2) {
  const colUsed = new Array(size).fill(false);
  const regionUsed = new Array(size).fill(false);
  let count = 0;

  function backtrack(row, prevCol) {
    if (count >= limit) return;
    if (row === size) { count++; return; }
    for (let col = 0; col < size; col++) {
      if (colUsed[col]) continue;
      if (prevCol !== -1 && Math.abs(col - prevCol) === 1) continue;
      const reg = regions[row * size + col];
      if (regionUsed[reg]) continue;
      colUsed[col] = true;
      regionUsed[reg] = true;
      backtrack(row + 1, col);
      colUsed[col] = false;
      regionUsed[reg] = false;
      if (count >= limit) return;
    }
  }

  backtrack(0, -1);
  return count;
}

// Randomly-grown regions are almost never uniquely solvable on their own —
// measured distribution for an 8x8 board came back 20-50+ valid placements
// per attempt, essentially never 1, so "generate regions and hope" doesn't
// converge in any reasonable number of attempts. Instead, actively CARVE
// out every alternate solution one at a time:
//
// Find any full valid placement that differs from the true solution. Since
// it's a different permutation, at least one row's column differs from the
// true solution there — and because that cell is never part of the true
// solution (proof: true-solution cells sit one per row at the true column,
// so a cell at the same row but a different column can never coincide with
// ANY true-solution cell, which are all at different rows), it's always
// safe to hand that single cell to a different region. Specifically, hand
// it to whatever region another differing row's alternate crown already
// uses — that instantly gives the alternate placement two crowns in one
// region, which is illegal, so that exact alternate can never recur. Repeat
// until the solver can't find any alternate left: that's a proof of
// uniqueness, not a guess.
function findAlternateSolution(size, regions, trueSolution) {
  const colUsed = new Array(size).fill(false);
  const regionUsed = new Array(size).fill(false);
  const current = new Array(size).fill(-1);

  function backtrack(row, prevCol) {
    if (row === size) {
      for (let i = 0; i < size; i++) {
        if (current[i] !== trueSolution[i]) return current.slice();
      }
      return null; // that leaf IS the true solution — keep searching others
    }
    for (let col = 0; col < size; col++) {
      if (colUsed[col]) continue;
      if (prevCol !== -1 && Math.abs(col - prevCol) === 1) continue;
      const reg = regions[row * size + col];
      if (regionUsed[reg]) continue;
      colUsed[col] = true; regionUsed[reg] = true; current[row] = col;
      const found = backtrack(row + 1, col);
      colUsed[col] = false; regionUsed[reg] = false; current[row] = -1;
      if (found) return found;
    }
    return null;
  }

  return backtrack(0, -1);
}

function neighborsOfIdx(idx, size) {
  const r = Math.floor(idx / size), c = idx % size;
  const out = [];
  if (r > 0) out.push((r - 1) * size + c);
  if (r < size - 1) out.push((r + 1) * size + c);
  if (c > 0) out.push(r * size + c - 1);
  if (c < size - 1) out.push(r * size + c + 1);
  return out;
}

function carveUnique(size, initialRegions, solution, rng, maxIterations = 800) {
  const working = initialRegions.slice();

  for (let iter = 0; iter < maxIterations; iter++) {
    const alt = findAlternateSolution(size, working, solution);
    if (!alt) return working; // no alternates left — proven unique

    const diffRows = [];
    for (let r = 0; r < size; r++) if (alt[r] !== solution[r]) diffRows.push(r);
    const shuffledRows = shuffle(diffRows, rng);

    // Scan every differing row (not just one random pick) for a fix that
    // hands the cell to a region it's already orthogonally touching, so
    // regions stay roughly blob-shaped instead of accreting scattered,
    // disconnected outlier cells. Only fall back to a non-contiguous fix
    // if truly none of this round's rows offers one.
    let applied = false;
    for (const r of shuffledRows) {
      const cellIdx = r * size + alt[r];
      const ownRegion = working[cellIdx];
      const candidateRegions = new Set(
        diffRows.filter((r2) => r2 !== r).map((r2) => working[r2 * size + alt[r2]])
      );
      candidateRegions.delete(ownRegion);
      if (candidateRegions.size === 0) continue;

      const adjacentRegions = neighborsOfIdx(cellIdx, size)
        .map((n) => working[n])
        .filter((rg) => rg !== ownRegion && candidateRegions.has(rg));

      if (adjacentRegions.length > 0) {
        working[cellIdx] = adjacentRegions[Math.floor(rng() * adjacentRegions.length)];
        applied = true;
        break;
      }
    }

    if (!applied) {
      const r = shuffledRows[0];
      const cellIdx = r * size + alt[r];
      const ownRegion = working[cellIdx];
      const candidates = diffRows
        .filter((r2) => r2 !== r)
        .map((r2) => working[r2 * size + alt[r2]])
        .filter((region) => region !== ownRegion);
      if (candidates.length === 0) continue; // pathological; try again next iteration
      working[cellIdx] = candidates[Math.floor(rng() * candidates.length)];
    }
  }

  return null; // didn't converge within budget
}

// carveUnique proves uniqueness but doesn't care about *looks* — it can
// leave a region as a main blob plus a few stray, disconnected outlier
// cells scattered elsewhere (measured ~3.8 stray fragments/puzzle on
// average). This pass cleans that up: repeatedly find the smallest stray
// fragment (a region's component that ISN'T the one holding that region's
// true solution cell — the true cell's component always stays put, see
// carveUnique's comment for why that cell is safe to reassign but never
// safe to strand), and hand it to whichever neighboring region borders it
// most. Re-verify uniqueness after every merge and back out immediately if
// it broke — this only ever *keeps* a change that's still provably unique.
function smoothRegions(size, initialRegions, solution, maxPasses = 300) {
  const working = initialRegions.slice();

  for (let pass = 0; pass < maxPasses; pass++) {
    const total = size * size;
    const seen = new Array(total).fill(false);
    const componentsByRegion = {};

    for (let i = 0; i < total; i++) {
      if (seen[i]) continue;
      const region = working[i];
      const cells = [i];
      seen[i] = true;
      const stack = [i];
      while (stack.length) {
        const cur = stack.pop();
        for (const n of neighborsOfIdx(cur, size)) {
          if (!seen[n] && working[n] === region) { seen[n] = true; stack.push(n); cells.push(n); }
        }
      }
      (componentsByRegion[region] ||= []).push(cells);
    }

    let smallestStray = null;
    for (const region in componentsByRegion) {
      const comps = componentsByRegion[region];
      if (comps.length <= 1) continue;
      const trueIdx = Number(region) * size + solution[Number(region)];
      const strays = comps.filter((cells) => !cells.includes(trueIdx));
      for (const cells of strays) {
        if (!smallestStray || cells.length < smallestStray.length) smallestStray = cells;
      }
    }
    if (!smallestStray) return working; // every region is one contiguous blob

    const freq = {};
    for (const idx of smallestStray) {
      for (const n of neighborsOfIdx(idx, size)) {
        const rg = working[n];
        if (!smallestStray.includes(n)) freq[rg] = (freq[rg] || 0) + 1;
      }
    }
    const ranked = Object.keys(freq).map(Number).sort((a, b) => freq[b] - freq[a]);

    let merged = false;
    for (const candidateRegion of ranked) {
      const backup = smallestStray.map((idx) => working[idx]);
      for (const idx of smallestStray) working[idx] = candidateRegion;
      if (countSolutions(size, working, 2) === 1) { merged = true; break; }
      smallestStray.forEach((idx, i) => { working[idx] = backup[i]; }); // revert, try next candidate
    }
    if (!merged) return working; // couldn't relocate without breaking uniqueness — stop here
  }

  return working;
}

function generatePuzzle(dateKey, maxOuterAttempts = 60) {
  const rng = mulberry32(hashSeed(dateKey));
  const { size, orderliness } = difficultyForDate(dateKey);

  for (let attempt = 0; attempt < maxOuterAttempts; attempt++) {
    const solution = generateSolutionPermutation(size, rng);
    if (!solution) continue;
    const seeds = solution.map((col, row) => [row, col]);
    const initialRegions = growRegions(size, seeds, rng, orderliness);
    if (initialRegions.includes(-1)) continue; // shouldn't happen, but never ship a hole

    const carved = carveUnique(size, initialRegions, solution, rng);
    if (!carved) continue;
    const regions = smoothRegions(size, carved, solution);

    // Belt-and-suspenders: re-verify with the independent counter before
    // ever writing this puzzle out (smoothing already self-checks each
    // merge, but nothing ships without this final independent pass too).
    if (countSolutions(size, regions) !== 1) continue;

    const palette = shuffle(REGION_COLORS, rng);
    return {
      size,
      regions: Array.from(regions),
      solution,
      palette: Array.from({ length: size }, (_, i) => palette[i % palette.length]),
    };
  }

  throw new Error(`Failed to generate a uniquely-solvable puzzle for ${dateKey} after ${maxOuterAttempts} attempts`);
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function main() {
  const puzzles = {};
  const start = new Date(`${EPOCH}T00:00:00Z`);

  for (let i = 0; i < NUM_DAYS; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const dateKey = formatDateKey(d);
    puzzles[dateKey] = generatePuzzle(dateKey);
  }

  const outPath = join(__dirname, '..', 'src', 'data', 'puzzles.json');
  writeFileSync(outPath, JSON.stringify(puzzles, null, 2));
  console.log(`Generated ${NUM_DAYS} puzzles -> ${outPath}`);
}

main();
