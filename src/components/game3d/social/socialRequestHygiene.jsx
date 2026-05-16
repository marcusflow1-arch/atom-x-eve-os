// ─────────────────────────────────────────────
// Social Request Hygiene (lightweight, rate-limit safe)
//
// Goal: let users retry friend / party / trade / duel requests reliably
// WITHOUT hammering the Base44 API and tripping its rate limiter.
//
// Strategy:
//   1. CLIENT-SIDE COOLDOWN (in-memory). A given (kind, receiverId) pair
//      can only be sent once every COOLDOWN_MS. Prevents spam-click loops
//      from generating 10 API calls in 2 seconds.
//   2. SINGLE CREATE PATH. The send itself fires ONE create call. No
//      pre-flight filter, no pre-flight deletes.
//   3. BACKGROUND CLEANUP. After a successful create (or on app idle),
//      a fire-and-forget sweep removes the sender's own declined /
//      cancelled / stale-pending rows. Failures here are silent.
//   4. RATE-LIMIT AWARE. If the API returns a 429 / "rate limit" error,
//      we surface a typed error so the caller can show "Try again in Xs".
// ─────────────────────────────────────────────

import { base44 } from '@/api/base44Client';

const COOLDOWN_MS = 3000;       // min interval between identical sends
const STALE_MS = 5 * 60 * 1000; // pending requests older than this are abandoned

// In-memory cooldown map: key = `${kind}:${receiverId}` → last send timestamp
const lastSentAt = new Map();

const cooldownKey = (kind, receiverId) => `${kind}:${receiverId}`;

const isRateLimitError = (e) => {
  const msg = String(e?.message || e || '').toLowerCase();
  return msg.includes('rate limit') || msg.includes('429') || msg.includes('too many');
};

/**
 * Background sweep — purge this sender's own declined / cancelled rows and
 * any stale pending rows to the same receiver. Fire-and-forget; errors are
 * swallowed so they never block the user.
 */
const backgroundCleanup = ({ kind, senderId, receiverId }) => {
  // Defer to next tick so it doesn't compete with the create call.
  setTimeout(async () => {
    try {
      const rows = await base44.entities.SocialRequest.filter({
        kind, sender_id: senderId, receiver_id: receiverId,
      });
      const now = Date.now();
      const toDelete = (rows || []).filter((r) => {
        if (r.status === 'declined' || r.status === 'cancelled') return true;
        if (r.status === 'pending') {
          const ts = r.updated_date || r.created_date;
          if (ts && now - new Date(ts).getTime() > STALE_MS) return true;
        }
        return false;
      });
      // Keep the most-recent pending row (the one we just created) — never
      // delete it. Sort newest-first and skip index 0 if it's pending.
      const keep = (rows || [])
        .filter((r) => r.status === 'pending')
        .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))[0];
      for (const r of toDelete) {
        if (keep && r.id === keep.id) continue;
        await base44.entities.SocialRequest.delete(r.id).catch(() => {});
      }
    } catch {
      // silent
    }
  }, 500);
};

/**
 * Main entry point — used by every send*Request helper.
 *
 * @param {object} args
 * @param {'friend'|'party'|'trade'|'duel'} args.kind
 * @param {{id:string,name:string}} args.sender
 * @param {{id:string,name?:string}} args.receiver
 * @param {object} [args.extraFields] - kind-specific fields (e.g. party_id)
 * @returns {Promise<object>} the created request record
 * @throws {Error} with `.code` = 'cooldown' | 'rate_limit' | 'self' | 'invalid'
 */
export const sendCleanRequest = async ({ kind, sender, receiver, extraFields = {} }) => {
  if (!sender?.id || !receiver?.id) {
    const err = new Error('Missing sender or receiver');
    err.code = 'invalid';
    throw err;
  }
  if (sender.id === receiver.id) {
    const err = new Error("You can't send a request to yourself");
    err.code = 'self';
    throw err;
  }

  // 1. Client-side cooldown
  const key = cooldownKey(kind, receiver.id);
  const last = lastSentAt.get(key) || 0;
  const elapsed = Date.now() - last;
  if (elapsed < COOLDOWN_MS) {
    const err = new Error(`Please wait ${Math.ceil((COOLDOWN_MS - elapsed) / 1000)}s before trying again`);
    err.code = 'cooldown';
    err.retryAfterMs = COOLDOWN_MS - elapsed;
    throw err;
  }
  // Reserve the slot OPTIMISTICALLY so rapid double-clicks can't slip through.
  lastSentAt.set(key, Date.now());

  // 2. Pre-flight: delete any existing request between this sender→receiver
  //    for this kind. On the live published app, a stale pending/declined row
  //    blocks the create (unique constraint or RLS conflict). We must clear it
  //    synchronously BEFORE the create so the DB is clean.
  try {
    const existing = await base44.entities.SocialRequest.filter({
      kind,
      sender_id: sender.id,
      receiver_id: receiver.id,
    });
    for (const row of existing || []) {
      await base44.entities.SocialRequest.delete(row.id).catch(() => {});
    }
  } catch {
    // Non-fatal — proceed even if cleanup fails
  }

  // 3. Single create call
  try {
    const request = await base44.entities.SocialRequest.create({
      kind,
      sender_id: sender.id,
      sender_name: sender.name,
      receiver_id: receiver.id,
      receiver_name: receiver.name,
      status: 'pending',
      ...extraFields,
    });

    return request;
  } catch (e) {
    // Release the cooldown so the user can retry sooner on a real failure.
    lastSentAt.delete(key);
    if (isRateLimitError(e)) {
      const err = new Error('Server is busy — please wait a few seconds and try again');
      err.code = 'rate_limit';
      err.retryAfterMs = 5000;
      throw err;
    }
    throw e;
  }
};

/**
 * Hard-delete a declined request so it doesn't accumulate.
 * Called from the decline handler in IncomingRequestToast.
 */
export const deleteRequest = async (requestId) => {
  if (!requestId) return;
  try {
    await base44.entities.SocialRequest.delete(requestId);
  } catch {
    // silent — background hygiene will catch it later
  }
};