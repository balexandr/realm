import styles from './HowToPlay.module.css';

// A tiny 4x4 solved example: 4 regions, one crown per row/column/region,
// none touching diagonally — purely illustrative, not pulled from a real
// generated puzzle.
const REGION_COLORS = ['#f43f5e', '#3b82f6', '#22c55e', '#eab308'];
const EXAMPLE_REGIONS = [
  0, 0, 1, 1,
  2, 0, 0, 1,
  2, 2, 3, 1,
  2, 3, 3, 3,
];
const EXAMPLE_CROWNS = new Set(['0,1', '1,3', '2,0', '3,2']);

export default function HowToPlay({ onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>How to Play</h2>
        <p className={styles.intro}>
          Place one crown in every row, column, and colored region — no two
          crowns may touch, not even diagonally.
        </p>

        <div className={styles.steps}>
          <div className={styles.step}>
            <span className={styles.stepIcon}>👆</span>
            <div>
              <p className={styles.stepTitle}>Tap a cell</p>
              <p className={styles.stepDesc}>Cycles empty → ✕ → 👑 → empty. Use ✕ as your own scratch mark to rule cells out — it has no effect on solving.</p>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepIcon}>🎯</span>
            <div>
              <p className={styles.stepTitle}>One crown per row, column, region</p>
              <p className={styles.stepDesc}>Every row, every column, and every colored region gets exactly one crown — never two.</p>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepIcon}>🚫</span>
            <div>
              <p className={styles.stepTitle}>No touching</p>
              <p className={styles.stepDesc}>Two crowns can never sit diagonally next to each other. (They already can't share a row or column.)</p>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepIcon}>🏰</span>
            <div>
              <p className={styles.stepTitle}>It solves itself</p>
              <p className={styles.stepDesc}>The puzzle locks in the instant every rule is satisfied at once — no submit button, retry as much as you like.</p>
            </div>
          </div>
        </div>

        <div className={styles.example}>
          <p className={styles.exampleLabel}>Solved example</p>
          <div className={styles.exampleGrid}>
            {[0, 1, 2, 3].map((r) => (
              <div key={r} className={styles.exRow}>
                {[0, 1, 2, 3].map((c) => {
                  const region = EXAMPLE_REGIONS[r * 4 + c];
                  const hasCrown = EXAMPLE_CROWNS.has(`${r},${c}`);
                  return (
                    <span
                      key={c}
                      className={styles.exCell}
                      style={{ background: `${REGION_COLORS[region]}33` }}
                    >
                      {hasCrown ? '👑' : ''}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          <p className={styles.exampleCaption}>One crown per color, per row, per column — none touching corners.</p>
        </div>

        <button className={styles.playButton} onClick={onClose}>
          Start playing
        </button>
      </div>
    </div>
  );
}
