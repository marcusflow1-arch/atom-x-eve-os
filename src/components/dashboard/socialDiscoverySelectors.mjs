/**
 * Dashboard social discovery and party slot selectors.
 * Presence is not party membership. Accepted PartyMember rows are members;
 * outgoing invitations are shown distinctly as PENDING placeholders so a
 * freshly invited friend's name appears without granting membership early.
 */
export function buildPartySlots(members, maxSize = 5, outgoingInvites = []) {
  const confirmed = Array.isArray(members) ? members.slice(0, maxSize) : [];
  const occupied = new Set(confirmed.map(member => String(member.user_id)));
  const pending = [];
  for (const invite of Array.isArray(outgoingInvites) ? outgoingInvites : []) {
    const userId = String(invite?.invitee_id || '');
    if (!userId || invite.status !== 'pending' || occupied.has(userId)) continue;
    occupied.add(userId);
    pending.push({
      user_id: userId, user_name: invite.invitee_name || 'Invited player',
      user_avatar: invite.invitee_avatar || '', pending: true, invite_id: invite.id,
    });
  }
  const slots = [...confirmed, ...pending].slice(0, maxSize);
  return Array.from({ length: maxSize }, (_, index) => slots[index] || null);
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
