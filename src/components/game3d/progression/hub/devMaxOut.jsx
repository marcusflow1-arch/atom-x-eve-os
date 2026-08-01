// ─── Dev / Editor "Max Out" helper ──────────────────────────────────────────
// A "Max Contribution" control that lets the builder instantly max out a
// progression system (Halo / Aura / Wings / Title) while editing or play-testing
// the project. It is available in GAME MODE (the in-game Character Progression
// menu) and in EDIT / PREVIEW mode (the Base44 builder preview), but is HIDDEN
// in the LIVE / PUBLISHED app so real players never see it.
//
// Detection mirrors Layout.jsx's isEditorMode check: localhost, *.base44.app,
// and any hostname containing "preview" are treated as edit/preview; everything
// else (the published custom domain) is "live" and the control is suppressed.

export function isEditorMode() {
  try {
    const h = window.location.hostname || '';
    return (
      h === 'localhost' ||
      h.includes('base44.app') ||
      h.includes('preview')
    );
  } catch {
    return false;
  }
}

// Shared button — small, accent-tinted, uppercase. Renders null when not in
// edit/preview/game-dev context so the published app never shows it.
export default function MaxOutButton({ onClick, accent = '#ffd86b', label = 'Max Out', title }) {
  if (!isEditorMode()) return null;
  return (
    <button
      onClick={onClick}
      title={title || 'Editor only — instantly max out this system'}
      className="ml-2 py-2 px-3 rounded-sm text-[10px] tracking-[0.2em] uppercase font-bold transition-all whitespace-nowrap"
      style={{
        background: `${accent}1f`,
        border: `1px solid ${accent}`,
        color: accent,
        boxShadow: `0 0 10px ${accent}33`,
      }}
    >
      ⚡ {label}
    </button>
  );
}