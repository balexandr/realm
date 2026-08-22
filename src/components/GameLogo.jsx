export function GameLogo() {
  const teal = '#14b8a6';
  const light = '#2dd4bf';

  return (
    <svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true" style={{ flexShrink: 0 }}>
      {/* Crown band */}
      <rect x="8" y="30" width="32" height="8" rx="2" fill={teal} />
      {/* Crown peaks */}
      <path
        d="M 8 30 L 11 14 L 18 24 L 24 10 L 30 24 L 37 14 L 40 30 Z"
        fill={light}
      />
      {/* Jewels on each peak */}
      <circle cx="11" cy="14" r="2.6" fill={teal} />
      <circle cx="24" cy="10" r="2.8" fill={teal} />
      <circle cx="37" cy="14" r="2.6" fill={teal} />
    </svg>
  );
}
