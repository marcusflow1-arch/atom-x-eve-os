// Canonical, authenticated Game 2 arena rendezvous.
// This helper is shared by the Base44 service-role endpoint and Node regression tests.
export const GAME2_ARENA = 'lightsaber-training';
export const GAME2_VERSION = 2;
export const GAME2_MAX_PLAYERS = 10;
export const GAME2_STALE_MS = 15000;

const born = room => Date.parse(room.created_date || '') || 0;
export function liveGame2Rooms(rows, now = Date.now()) {
  return (rows || []).filter(room => room &&
    room.version === GAME2_VERSION &&
    room.status !== 'closed' &&
    Number.isFinite(Number(room.last_seen)) &&
    Number(room.last_seen) > now - GAME2_STALE_MS &&
    Number(room.last_seen) <= now + GAME2_STALE_MS)
    .sort((a, b) => born(a) - born(b) ||
      String(a.host_peer || '').localeCompare(String(b.host_peer || '')));
}

const count = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : fallback;
};

export function validPeerForUser(peer, userId) {
  if (typeof peer !== 'string' || typeof userId !== 'string') return false;
  const prefix = userId + '~';
  return peer.startsWith(prefix) && /^[a-z0-9]{4,16}$/.test(peer.slice(prefix.length));
}

export function safeGame2Fields(fields = {}) {
  const players = count(fields.players, 1, GAME2_MAX_PLAYERS, 1);
  return {
    name: 'Lightsaber Training',
    host_name: String(fields.host_name || 'Jedi').slice(0, 20),
    players,
    max_players: GAME2_MAX_PLAYERS,
    light: count(fields.light, 0, GAME2_MAX_PLAYERS, 0),
    dark: count(fields.dark, 0, GAME2_MAX_PLAYERS, 0),
    ai: count(fields.ai, 0, 3, 1),
    status: players >= GAME2_MAX_PLAYERS ? 'full' : 'open',
  };
}

// rooms: authenticated server-side service-role entity. There is no player-controlled
// read filter; all signed-in players must discover the SAME room across account RLS.
export function makeGame2Coordinator(rooms, { now = Date.now, pause = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  const list = async () => liveGame2Rooms(await rooms.filter({}, '-updated_date', 200), now());
  const checkHost = async (id, userId, peer) => {
    const room = await rooms.get(id);
    if (!room || room.host_id !== userId || room.host_peer !== peer) throw new Error('Only the current arena host can modify this room');
    return room;
  };
  return {
    list,
    async claim(userId, peer, fields = {}) {
      if (!validPeerForUser(peer, userId)) throw new Error('Invalid Game 2 session');
      const first = (await list())[0];
      if (first) return { room: first, created: false };
      const created = await rooms.create({
        ...safeGame2Fields(fields), host_id: userId, host_peer: peer,
        version: GAME2_VERSION, last_seen: now(),
      });
      // Two browsers may discover an empty arena simultaneously. Both candidates
      // re-read the server-owned room set and choose the oldest surviving beacon.
      await pause(500);
      const elected = (await list())[0] || created;
      if (elected.id !== created.id) {
        await rooms.delete(created.id).catch(() => {});
        return { room: elected, created: false };
      }
      return { room: created, created: true };
    },
    async heartbeat(id, userId, peer, fields) {
      await checkHost(id, userId, peer);
      return rooms.update(id, { ...safeGame2Fields(fields), last_seen: now() });
    },
    async leave(id, userId, peer) {
      await checkHost(id, userId, peer);
      await rooms.delete(id);
      return true;
    },
  };
}
