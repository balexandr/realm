// Small line-art icon set replacing emoji in Realm's UI. Matches the
// 24x24 viewBox / stroke / currentColor style the rest of the suite
// uses, except IconCrown which reuses GameLogo.jsx's exact two-tone
// teal paths (hardcoded fill, not currentColor) so the actual crown
// game piece visually matches the logo rather than being a generic
// gold emoji crown. Share text is NOT touched by this: generateShareText()
// in useGameState.js builds the actual shared result string (🏰
// header), plain text sent via SMS/clipboard, a custom icon can't
// survive that trip, so it stays real Unicode there. The "×" in
// WinScreen.jsx ("puzzle.size×puzzle.size") is board-dimension
// notation, not a UI icon, also left alone.
function base(props) {
  return { viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true, ...props };
}

export function IconDrag({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} {...base(props)}>
      <path d="M9 3v8M9 11l-2.5-2M9 11l2.5-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="12" width="10" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M15 15.5c2.2-1 4 .3 4 2.3s-1.8 3.3-4 2.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconTarget({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} {...base(props)}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function IconNoEntry({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} {...base(props)}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M6.5 17.5l11-11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconCastle({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} {...base(props)}>
      <path d="M5 10V5h2.5v2h2V5h2v2.5h1v-2H15V5h2.5v5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M4 10h16v10H4V10Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 20v-5a2 2 0 0 1 4 0v5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMap({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} {...base(props)}>
      <path d="M9 4L4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 4v14M15 6v14" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
    </svg>
  );
}

export function IconClose({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} {...base(props)}>
      <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheckmark({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} {...base(props)}>
      <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconShare({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} {...base(props)}>
      <path d="M12 15V4M12 4l-3.5 3.5M12 4l3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconTrophy({ size = 40, ...props }) {
  return (
    <svg width={size} height={size} {...base(props)}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M7 5H4.5A2.5 2.5 0 0 0 5 10h2M17 5h2.5A2.5 2.5 0 0 1 19 10h-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 14v3.5M9 21h6M10 17.5h4l.6 3.5H9.4l.6-3.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

// The actual game piece and logo mark: GameLogo.jsx's exact crown
// paths, same two-tone teal fill, so the piece you place on the board
// matches the brand mark pixel-for-pixel in spirit.
export function IconCrown({ size = 22, ...props }) {
  const teal = '#14b8a6';
  const light = '#2dd4bf';
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" {...props}>
      <rect x="8" y="30" width="32" height="8" rx="2" fill={teal} />
      <path d="M 8 30 L 11 14 L 18 24 L 24 10 L 30 24 L 37 14 L 40 30 Z" fill={light} />
      <circle cx="11" cy="14" r="2.6" fill={teal} />
      <circle cx="24" cy="10" r="2.8" fill={teal} />
      <circle cx="37" cy="14" r="2.6" fill={teal} />
    </svg>
  );
}
