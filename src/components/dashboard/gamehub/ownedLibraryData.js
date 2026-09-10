export const genreParts = game => String(game.genre || 'Uncategorized').split(/\s*[/,]\s*/).filter(Boolean);
export function playedHours(value) {
  if (value == null || value === '') return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? Math.max(0, /min/i.test(String(value)) ? n / 60 : n) : null;
}
export function similarGames(a, b) {
  const words = game => `${game.genre || ''} ${(game.tags || []).join(' ')}`.toLowerCase().replace(/[_-]/g, ' ');
  const families = [/rpg|role playing|adventure|fantasy/, /shooter|shooting|fps|tactical|battle royale/, /strategy|simulation|sandbox/, /racing|sports/, /puzzle|platformer/];
  const left = words(a), right = words(b);
  return genreParts(a).some(g => genreParts(b).some(other => g.toLowerCase() === other.toLowerCase())) || families.some(pattern => pattern.test(left) && pattern.test(right)) || (a.tags || []).some(tag => (b.tags || []).some(other => String(other).toLowerCase() === String(tag).toLowerCase()));
}