// ─────────────────────────────────────────────
// FRIEND REQUEST — through the shared friends backend (socialActions)
//
// Owns:
//   • sendFriendRequest(sender, receiver)
//   • acceptFriendRequest(req)
//   • declineFriendRequest(req)
//
// The game and Luna share one friends system: a request sent in the world appears on the
// dashboard and the other way round, and accepting writes both the Friend rows and the
// game's SocialFriendship row (the server owns those tables).
// `req` is a pending FriendRequest shaped by IncomingRequestToast ({ id, sender_id, … }).
// ─────────────────────────────────────────────

import { callGameServer } from './socialServer';

export const sendFriendRequest = async (sender, receiver) => {
  const result = await callGameServer('socialActions', 'send_friend_request', { target_user_id: receiver.id });
  if (result.already_friends) {
    throw Object.assign(new Error(`${receiver.name || 'They'} is already your friend`), { code: 'already_friends' });
  }
  return result; // { request, already_pending?, accepted?, mutual? }
};

export const acceptFriendRequest = (req) =>
  callGameServer('socialActions', 'respond_friend_request', { request_id: req.id, decision: 'accept' });

export const declineFriendRequest = (req) =>
  callGameServer('socialActions', 'respond_friend_request', { request_id: req.id, decision: 'decline' });
