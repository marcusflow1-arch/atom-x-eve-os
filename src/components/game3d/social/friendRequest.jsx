// ─────────────────────────────────────────────
// FRIEND REQUEST — independent pipeline
//
// Owns:
//   • sendFriendRequest(sender, receiver)
//   • acceptFriendRequest(req, myName)
//   • declineFriendRequest(req)
//
// Rules unique to friends:
//   • If a SocialFriendship already exists between the two users, we reject
//     with code='already_friends' instead of creating a duplicate request.
//   • On accept, ONE SocialFriendship row is created (a ↔ b is symmetric).
// ─────────────────────────────────────────────

import { base44 } from '@/api/base44Client';
import { sendCleanRequest, deleteRequest } from './socialRequestHygiene';

const FRIEND_COOLDOWN_BUCKET = 'friend';

/**
 * Pre-check: are these two users already friends?
 * One small filter; failure is non-fatal (we just skip the check).
 */
const alreadyFriends = async (senderId, receiverId) => {
  try {
    const [a, b] = await Promise.all([
      base44.entities.SocialFriendship.filter({ user_a_id: senderId, user_b_id: receiverId }),
      base44.entities.SocialFriendship.filter({ user_a_id: receiverId, user_b_id: senderId }),
    ]);
    return (a?.length || 0) + (b?.length || 0) > 0;
  } catch {
    return false;
  }
};

export const sendFriendRequest = async (sender, receiver) => {
  if (await alreadyFriends(sender.id, receiver.id)) {
    const err = new Error(`${receiver.name || 'They'} is already your friend`);
    err.code = 'already_friends';
    throw err;
  }
  return sendCleanRequest({
    kind: FRIEND_COOLDOWN_BUCKET,
    sender,
    receiver,
  });
};

export const acceptFriendRequest = async (req, myName) => {
  await base44.entities.SocialRequest.update(req.id, { status: 'accepted' });
  await base44.entities.SocialFriendship.create({
    user_a_id: req.sender_id,
    user_a_name: req.sender_name,
    user_b_id: req.receiver_id,
    user_b_name: req.receiver_name || myName,
  });
};

export const declineFriendRequest = async (req) => {
  await base44.entities.SocialRequest.update(req.id, { status: 'declined' });
  // Hard-delete shortly after so the sender sees the decline event then
  // the row gets cleaned up — friend retries always work.
  setTimeout(() => deleteRequest(req.id), 2500);
};