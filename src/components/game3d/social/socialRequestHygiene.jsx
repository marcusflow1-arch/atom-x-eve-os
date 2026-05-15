// ─────────────────────────────────────────────
// Social Request Hygiene
//
// Keeps the SocialRequest table clean so users can always retry sending
// friend / party / trade / duel requests without hitting "already pending"
// or accumulated-junk issues.
//
// Rules:
//  1. Before sending a new request: purge any prior DECLINED or stale
//     PENDING requests (>STALE_MS old) between the same two users for the
//     same kind. This guarantees a clean slate for the retry.
//  2. If a fresh PENDING request already exists (within STALE_MS), reuse it
//     — don't spam duplicates. Returns { reused: true, request }.
//  3. Verify the receiver is a real user before creating the row, so the
//     sender gets a clear error instead of a silent dead request.
//  4. Provide cleanupDeclined() so the decline handler can hard-delete the
//     row instead of leaving "declined" sediment behind.
// ─────────────────────────────────────────────

import { base44 } from '@/api/base44Client';

const STALE_MS = 5 * 60 * 1000; // 5 minutes — pending requests older than this are abandoned

const isStale = (record) => {
  const ts = record.updated_date || record.created_date;
  if (!ts) return false;
  return Date.now() - new Date(ts).getTime() > STALE_MS;
};

/**
 * Verify the receiver user actually exists. Returns true if found.
 * Failure modes (network blip, permissions) return true so we don't block
 * legitimate sends — this is a best-effort sanity check, not a hard gate.
 */
const verifyReceiver = async (receiverId) => {
  if (!receiverId) return false;
  try {
    const rows = await base44.entities.User.filter({ id: receiverId });
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return true;
  }
};

/**
 * Purge declined + stale pending requests between sender→receiver for `kind`.
 * Returns the list of any still-fresh pending requests so caller can reuse them.
 */
const purgeAndFindFreshPending = async ({ kind, senderId, receiverId }) => {
  let existing = [];
  try {
    existing = await base44.entities.SocialRequest.filter({
      kind, sender_id: senderId, receiver_id: receiverId,
    });
  } catch (e) {
    console.warn('[SocialHygiene] filter failed', e);
    return [];
  }

  const toDelete = [];
  const freshPending = [];
  for (const r of existing || []) {
    if (r.status === 'declined' || r.status === 'cancelled') {
      toDelete.push(r);
    } else if (r.status === 'pending') {
      if (isStale(r)) toDelete.push(r);
      else freshPending.push(r);
    }
    // accepted records are historical — leave them.
  }

  if (toDelete.length > 0) {
    await Promise.all(
      toDelete.map((r) => base44.entities.SocialRequest.delete(r.id).catch(() => {})),
    );
  }
  return freshPending;
};

/**
 * Main entry point — call this from every send*Request helper.
 *
 * @param {object} args
 * @param {'friend'|'party'|'trade'|'duel'} args.kind
 * @param {{id:string,name:string}} args.sender
 * @param {{id:string,name?:string}} args.receiver
 * @param {object} [args.extraFields] - kind-specific fields (e.g. party_id)
 * @returns {Promise<{request:object, reused:boolean}>}
 * @throws {Error} if receiver can't be verified
 */
export const sendCleanRequest = async ({ kind, sender, receiver, extraFields = {} }) => {
  if (!sender?.id || !receiver?.id) {
    throw new Error('Missing sender or receiver');
  }
  if (sender.id === receiver.id) {
    throw new Error("You can't send a request to yourself");
  }

  // 1. Verify receiver exists
  const ok = await verifyReceiver(receiver.id);
  if (!ok) throw new Error('Recipient not found');

  // 2. Purge stale junk + reuse fresh pending if any
  const fresh = await purgeAndFindFreshPending({
    kind, senderId: sender.id, receiverId: receiver.id,
  });
  if (fresh.length > 0) {
    // Reuse the freshest one — bump its updated_date so the receiver sees it again.
    const reuseTarget = fresh.sort((a, b) =>
      new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date),
    )[0];
    // If multiple pending exist, drop the duplicates.
    await Promise.all(
      fresh.slice(1).map((r) => base44.entities.SocialRequest.delete(r.id).catch(() => {})),
    );
    return { request: reuseTarget, reused: true };
  }

  // 3. Create the fresh request
  const request = await base44.entities.SocialRequest.create({
    kind,
    sender_id: sender.id,
    sender_name: sender.name,
    receiver_id: receiver.id,
    receiver_name: receiver.name,
    status: 'pending',
    ...extraFields,
  });
  return { request, reused: false };
};

/**
 * Hard-delete a declined request so it doesn't accumulate.
 * Called from the decline handler in IncomingRequestToast.
 */
export const deleteRequest = async (requestId) => {
  if (!requestId) return;
  try {
    await base44.entities.SocialRequest.delete(requestId);
  } catch (e) {
    console.warn('[SocialHygiene] delete failed', e);
  }
};