import { useCallback } from 'react';
import styles from './RealmGrid.module.css';

// Same hue set Pathways established for colored regions on a dark UI —
// reused deliberately, see GAME_DESIGN.md's "Shared Noodle Pattern
// Compliance" section.
const REGION_COLORS = [
  '#f43f5e', '#3b82f6', '#22c55e', '#eab308', '#f97316',
  '#a855f7', '#06b6d4', '#ec4899', '#84cc16',
];

function cellKey(r, c) { return `${r},${c}`; }

export default function RealmGrid({ puzzle, cells, onCycleCell, gameStatus }) {
  const { size, regions } = puzzle;
  const locked = gameStatus !== 'playing';

  const handleClick = useCallback((r, c) => {
    if (locked) return;
    onCycleCell(r, c);
  }, [locked, onCycleCell]);

  const rows = [];
  for (let r = 0; r < size; r++) {
    const cols = [];
    for (let c = 0; c < size; c++) {
      const region = regions[r * size + c];
      const color = REGION_COLORS[region % REGION_COLORS.length];
      const state = cells[cellKey(r, c)] || 0;
      const label = state === 2 ? 'crown placed' : state === 1 ? 'marked empty' : 'empty cell';
      cols.push(
        <button
          key={c}
          type="button"
          className={`${styles.cell} ${state === 2 ? styles.crowned : ''}`}
          style={{ '--region-color': color }}
          onClick={() => handleClick(r, c)}
          disabled={locked}
          data-row={r}
          data-col={c}
          aria-label={label}
        >
          {state === 2 && <span className={styles.crown}>👑</span>}
          {state === 1 && <span className={styles.mark}>✕</span>}
        </button>
      );
    }
    rows.push(
      <div key={r} className={styles.row}>
        {cols}
      </div>
    );
  }

  return (
    <div className={styles.boardFrame}>
      <div className={styles.gridWrap} style={{ '--cols': size }}>
        {rows}
      </div>
    </div>
  );
}
