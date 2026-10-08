/**
 * Dashboard social discovery and party slot selectors.
 * Presence is not party membership: only accepted PartyMember rows occupy slots.
 */
export function buildPartySlots(members, maxSize = 5) {
  const confirmed = Array.isArray(members) ? members : [];
  return Array.from({ length: maxSize }, (_, index) => confirmed[index] || null);
}

export function filterSocialPlayers(onlinePlayers, {
  mode = 'online',
  genreFilter = 'all',
  search = '',
  partyMemberIds = new Set(),
  limit = 75,
} = {}) {
  const query = String(search || '').trim().toLocaleLowerCase();
  const genre = String(genreFilter || 'all').toLocaleLowerCase();
  return (Array.isArray(onlinePlayers) ? onlinePlayers : [])
    .filter(player => mode === 'online' || (
      player.friend && (mode !== 'party' || !partyMemberIds.has(String(player.id)))
    ))
    .filter(player => mode !== 'online' || genre === 'all' || (
      Array.isArray(player.genres) && player.genres.some(item => String(item).toLocaleLowerCase() === genre)
    ))
    .filter(player => !query || String(player.name || '').toLocaleLowerCase().includes(query))
    .slice(0, limit);
}
