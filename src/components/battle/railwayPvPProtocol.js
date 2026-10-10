/** Railway PvP wire protocol, shared by the browser and match server.
 * This module contains no secrets and does not enable the legacy cutover.
 */
export const PVP_PROTOCOL_VERSION = 1;
export const PVP_MESSAGE = Object.freeze({
  AUTH: 'auth',
  AUTH_OK: 'auth.ok',
  QUEUE_JOIN: 'queue.join',
  QUEUE_CANCEL: 'queue.cancel',
  QUEUE_STATUS: 'queue.status',
  MATCH_FOUND: 'match.found',
  MATCH_READY: 'match.ready',
  MATCH_RESUME: 'match.resume',
  MATCH_SNAPSHOT: 'match.snapshot',
  MOVE: 'player.move',
  COMBAT_ACTION: 'combat.action',
  COMBAT_RESULT: 'combat.result',
  MATCH_ENDED: 'match.ended',
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong',
});
export const PVP_SERVER_EVENTS = new Set([
  PVP_MESSAGE.AUTH_OK, PVP_MESSAGE.QUEUE_STATUS, PVP_MESSAGE.MATCH_FOUND,
  PVP_MESSAGE.MATCH_SNAPSHOT, PVP_MESSAGE.COMBAT_RESULT,
  PVP_MESSAGE.MATCH_ENDED, PVP_MESSAGE.ERROR, PVP_MESSAGE.PONG,
]);
export function encodePvPMessage(type, payload = {}, sequence = 0) {
  if (!Object.values(PVP_MESSAGE).includes(type)) throw new Error('Unknown PvP message');
  if (!Number.isSafeInteger(sequence) || sequence < 0) throw new Error('Invalid PvP sequence');
  return JSON.stringify({ v: PVP_PROTOCOL_VERSION, t: type, seq: sequence, payload });
}
export function decodePvPMessage(raw) {
  if (typeof raw !== 'string' || raw.length > 8192) throw new Error('PvP message size exceeded');
  const msg = JSON.parse(raw);
  if (!msg || msg.v !== PVP_PROTOCOL_VERSION || typeof msg.t !== 'string'
      || !Object.values(PVP_MESSAGE).includes(msg.t)
      || !Number.isSafeInteger(msg.seq) || msg.seq < 0
      || typeof msg.payload !== 'object' || msg.payload === null || Array.isArray(msg.payload))
    throw new Error('Invalid PvP message');
  return msg;
}
