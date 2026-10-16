// ─────────────────────────────────────────────
// DUEL — through the duel server (duelSystem)
//
// Owns:
//   • sendDuelChallenge(sender, receiver)
//   • acceptDuelChallenge(req) / declineDuelChallenge(req)
//   • strikeInDuel(duelId, swing), forfeitDuel(duelId), fetchDuelState()
//
// The server owns the whole duel: who may challenge whom, the accept, every hit (rolled
// and resolved with the game's combat rules against each duelist's stats) and the result.
// `req` is a pending DuelSession shaped by IncomingRequestToast ({ id, sender_id, … }).
// ─────────────────────────────────────────────

import { callGameServer, myDuelStats } from './socialServer';

export const sendDuelChallenge = (sender, receiver) =>
  callGameServer('duelSystem', 'challenge', { opponentId: receiver.id, opponentName: receiver.name, stats: myDuelStats() });

export const acceptDuelChallenge = (req) =>
  callGameServer('duelSystem', 'respond', { duelId: req.id, decision: 'accept', stats: myDuelStats() });

export const declineDuelChallenge = (req) =>
  callGameServer('duelSystem', 'respond', { duelId: req.id, decision: 'decline' });

// One swing at the duel opponent: { distance, weaponPath, skillMultiplier } -> { hit, duel }
export const strikeInDuel = (duelId, swing) => callGameServer('duelSystem', 'hit', { duelId, ...swing });

export const forfeitDuel = (duelId) => callGameServer('duelSystem', 'forfeit', { duelId });

// { active, incoming, outgoing }
export const fetchDuelState = () => callGameServer('duelSystem', 'state', {});
