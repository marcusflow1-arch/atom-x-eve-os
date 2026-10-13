// Detect out-of-order PvP movement without permanently rejecting a peer
// whose sequence counter restarted after refreshing/reconnecting their browser.
// The packet sender is already verified by the WebRTC peer connection.
export function classifyArenaMovement(previous, incoming, receivedAt, retiredSessions = new Set()) {
  const seq = Number(incoming?.seq);
  const x = Number(incoming?.x);
  const z = Number(incoming?.z);
  if (!Number.isSafeInteger(seq) || seq < 0 || !Number.isFinite(x) || !Number.isFinite(z)) {
    return { accept: false, reset: false };
  }
  if (!previous) return { accept: true, reset: false };
  const session = String(incoming?.move_session_id || '');
  const oldSession = String(previous?.move_session_id || '');
  if (session && retiredSessions.has(session)) return { accept: false, reset: false };
  if (session && oldSession && session !== oldSession) {
    retiredSessions.add(oldSession);
    return { accept: true, reset: true };
  }
  if (seq > Number(previous.seq || 0)) return { accept: true, reset: false };
  // Legacy peers don't send a session ID. If all updates went quiet and their
  // counter rolled back, accept a fresh baseline rather than freeze forever.
  const idleMs = receivedAt - Number(previous.receivedAt || 0);
  if ((!session || !oldSession) && idleMs > 1400) {
    return { accept: true, reset: true };
  }
  return { accept: false, reset: false };
}
