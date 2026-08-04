// Shared rarity theming for the card detail views (Record / Forge / Skills)
export const RARITY_THEME = {
  Common:    { grad: 'from-slate-400 to-slate-600',   text: 'text-slate-200',  ring: 'rgba(148,163,184,0.55)', glow: 'rgba(148,163,184,0.35)' },
  Uncommon:  { grad: 'from-emerald-400 to-teal-600',  text: 'text-emerald-200',ring: 'rgba(52,211,153,0.55)',  glow: 'rgba(52,211,153,0.35)' },
  Rare:      { grad: 'from-sky-400 to-blue-600',      text: 'text-sky-200',    ring: 'rgba(56,189,248,0.6)',   glow: 'rgba(56,189,248,0.4)' },
  Epic:      { grad: 'from-fuchsia-400 to-purple-600',text: 'text-fuchsia-200',ring: 'rgba(232,121,249,0.6)',  glow: 'rgba(232,121,249,0.4)' },
  Legendary: { grad: 'from-amber-300 to-orange-600',  text: 'text-amber-200',  ring: 'rgba(251,191,36,0.65)',  glow: 'rgba(251,146,60,0.45)' },
  Mythic:    { grad: 'from-rose-400 to-red-600',      text: 'text-rose-200',   ring: 'rgba(251,113,133,0.65)', glow: 'rgba(244,63,94,0.45)' },
  Mythical:  { grad: 'from-rose-400 to-red-600',      text: 'text-rose-200',   ring: 'rgba(251,113,133,0.65)', glow: 'rgba(244,63,94,0.45)' },
  Godlike:   { grad: 'from-violet-400 via-pink-500 to-amber-400', text: 'text-white', ring: 'rgba(244,114,182,0.7)', glow: 'rgba(236,72,153,0.5)' },
};

export const getRarity = (rarity) => RARITY_THEME[rarity] || RARITY_THEME.Common;