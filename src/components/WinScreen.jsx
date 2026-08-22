import { useState, useEffect } from 'react';
import styles from './WinScreen.module.css';

function getTimeToMidnight() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const diff = tomorrow - now;
  return {
    hours: Math.floor(diff / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function pad(n) { return String(n).padStart(2, '0'); }

function formatTime(s) {
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

// Flat thresholds for a v1 — grid size varies 5x5 to 9x9 across the week so
// a fixed cutoff is a rougher fit on harder days. Tune after playtesting,
// same as everything else in GAME_DESIGN.md's open questions.
function getRating(seconds) {
  if (seconds < 60) return { emoji: '🏆', label: 'Lightning Rule' };
  if (seconds < 150) return { emoji: '👑', label: 'Crowned' };
  if (seconds < 300) return { emoji: '🏰', label: 'Claimed' };
  return { emoji: '🗺️', label: 'Charted' };
}

export default function WinScreen({ puzzle, puzzleNumber, elapsedSeconds, generateShareText, stats, winPct, onDismiss }) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(getTimeToMidnight());
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getTimeToMidnight()), 1000);
    return () => clearInterval(interval);
  }, []);

  const rating = getRating(elapsedSeconds);
  const shareText = generateShareText();

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ text: shareText }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(shareText); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = shareText;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={`${styles.overlay} ${showContent ? styles.visible : ''}`}>
      <div className={styles.modal}>
        <div className={styles.sparkContainer} aria-hidden="true">
          {Array.from({ length: puzzle.size }).map((_, i) => (
            <span key={i} className={styles.spark} style={{
              left: `${10 + i * (80 / Math.max(puzzle.size - 1, 1))}%`,
              top: `${Math.random() * 100}%`,
              background: i % 2 === 0 ? '#14b8a6' : '#2dd4bf',
              boxShadow: '0 0 4px #14b8a6, 0 0 8px #14b8a688',
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1.5 + Math.random() * 2}s`,
            }} />
          ))}
        </div>

        <div className={styles.resultHeader}>
          <button className={styles.dismissBtn} onClick={onDismiss} aria-label="Close">✕</button>
          <span className={styles.ratingEmoji}>{rating.emoji}</span>
          <h2 className={styles.title}>{rating.label}!</h2>
          <p className={styles.subtitle}>Realm #{puzzleNumber} — claimed</p>
        </div>

        <div className={styles.metricsRow}>
          <div className={styles.metric}>
            <span className={styles.metricValue}>{formatTime(elapsedSeconds)}</span>
            <span className={styles.metricLabel}>Time</span>
          </div>
          <div className={styles.metricDivider} />
          <div className={styles.metric}>
            <span className={styles.metricValue}>{puzzle.size}×{puzzle.size}</span>
            <span className={styles.metricLabel}>Grid</span>
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.gamesPlayed}</span>
            <span className={styles.statLabel}>Played</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{winPct}%</span>
            <span className={styles.statLabel}>Win %</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.currentStreak}</span>
            <span className={styles.statLabel}>Streak</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.maxStreak}</span>
            <span className={styles.statLabel}>Best</span>
          </div>
        </div>

        <div className={styles.sharePreview}>
          <p className={styles.sharePreviewLabel}>Share text</p>
          <div className={styles.sharePreviewBox}>
            {shareText.split('\n').map((line, i) => (
              <span key={i} className={styles.sharePreviewLine}>{line}</span>
            ))}
          </div>
        </div>

        <button
          className={`${styles.shareButton} ${copied ? styles.copied : ''}`}
          onClick={handleShare}
        >
          {copied ? '✓ Copied to clipboard' : '⬆ Share your result'}
        </button>

        <div className={styles.countdown}>
          <span className={styles.countdownLabel}>Next puzzle in</span>
          <span className={styles.countdownTime}>
            {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
          </span>
        </div>
      </div>
    </div>
  );
}
