import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import puzzles from '../data/puzzles.json';

const STORAGE_KEY = 'realm-game-state';
const EPOCH = '2026-08-21';

function getTodayKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

function cellKey(r, c) { return `${r},${c}`; }

// Cheap content fingerprint so a stale save from a puzzle that got edited
// after someone may have already played it can never silently carry over —
// same lesson Mirror learned the hard way (see its GAME_DESIGN.md).
function contentFingerprint(puzzle) {
  return `${puzzle.size}:${puzzle.regions.join('')}`;
}

function loadState(dateKey, fingerprint) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (saved.dateKey !== dateKey) return null;
    if (saved.fingerprint !== fingerprint) return null;
    return saved;
  } catch { return null; }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export function useGameState() {
  const dateKey = getTodayKey();
  const puzzle = puzzles[dateKey] || null;
  const puzzleNumber = Math.floor((new Date(dateKey) - new Date(EPOCH)) / 86400000) + 1;
  const fingerprint = puzzle ? contentFingerprint(puzzle) : null;

  // cellKey -> 1 (marked ✕, pure scratch note) | 2 (crown)
  const [cells, setCellsState] = useState({});
  const [gameStatus, setGameStatus] = useState('playing');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const timerRef = useRef(null);
  const elapsedRef = useRef(0);

  // Timer tick
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsedSeconds(elapsedRef.current);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  // Init
  useEffect(() => {
    if (!puzzle) { setInitialized(true); return; }

    const saved = loadState(dateKey, fingerprint);
    if (saved) {
      setCellsState(saved.cells || {});
      setGameStatus(saved.gameStatus || 'playing');
      elapsedRef.current = saved.elapsedSeconds || 0;
      setElapsedSeconds(elapsedRef.current);
      const hasProgress = Object.keys(saved.cells || {}).length > 0;
      if ((saved.gameStatus || 'playing') === 'playing' && hasProgress) {
        setTimerRunning(true);
      }
    }
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  // Persist
  useEffect(() => {
    if (!initialized || !puzzle) return;
    saveState({ dateKey, fingerprint, cells, gameStatus, elapsedSeconds });
  }, [cells, gameStatus, elapsedSeconds, initialized, dateKey, fingerprint, puzzle]);

  const crownPositions = useMemo(() => {
    const out = [];
    for (const [key, state] of Object.entries(cells)) {
      if (state === 2) {
        const [r, c] = key.split(',').map(Number);
        out.push({ r, c });
      }
    }
    return out;
  }, [cells]);

  // The whole ruleset, checked continuously — no submit button. One crown
  // per row, per column, per region, and no two crowns diagonally adjacent
  // (orthogonal adjacency is already impossible once one-per-row/col holds,
  // see GAME_DESIGN.md for why that's the only extra check needed).
  const won = useMemo(() => {
    if (!puzzle) return false;
    const { size, regions } = puzzle;
    if (crownPositions.length !== size) return false;

    const rows = new Set();
    const cols = new Set();
    const regs = new Set();
    for (const { r, c } of crownPositions) {
      rows.add(r);
      cols.add(c);
      regs.add(regions[r * size + c]);
    }
    if (rows.size !== size || cols.size !== size || regs.size !== size) return false;

    for (let i = 0; i < crownPositions.length; i++) {
      for (let j = i + 1; j < crownPositions.length; j++) {
        const a = crownPositions[i], b = crownPositions[j];
        if (Math.abs(a.r - b.r) === 1 && Math.abs(a.c - b.c) === 1) return false;
      }
    }
    return true;
  }, [puzzle, crownPositions]);

  useEffect(() => {
    if (won && gameStatus === 'playing') {
      setGameStatus('won');
      setTimerRunning(false);
    }
  }, [won, gameStatus]);

  // Tap cycles empty -> ✕ (scratch mark, no effect on win-checking) ->
  // crown -> empty. Free retry forever, no fail state, no guess penalty —
  // deliberate parallel to Pathways, see GAME_DESIGN.md's "Why this genre."
  const cycleCell = useCallback((r, c) => {
    if (gameStatus !== 'playing') return;
    setTimerRunning(true);
    setCellsState((prev) => {
      const key = cellKey(r, c);
      const cur = prev[key] || 0;
      const nextState = (cur + 1) % 3;
      const next = { ...prev };
      if (nextState === 0) delete next[key];
      else next[key] = nextState;
      return next;
    });
  }, [gameStatus]);

  const generateShareText = useCallback(() => {
    if (!puzzle || gameStatus !== 'won') return '';
    const mm = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    const ss = String(elapsedSeconds % 60).padStart(2, '0');
    return `Realm #${puzzleNumber} 🏰 ${mm}:${ss}`;
  }, [puzzle, gameStatus, elapsedSeconds, puzzleNumber]);

  return {
    puzzle,
    dateKey,
    puzzleNumber,
    initialized,
    cells,
    cycleCell,
    gameStatus,
    elapsedSeconds,
    timerRunning,
    generateShareText,
  };
}
