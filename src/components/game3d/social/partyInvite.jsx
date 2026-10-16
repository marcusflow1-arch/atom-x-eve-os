// ─────────────────────────────────────────────
// PARTY — through the shared party backend (partySystem)
//
// Owns:
//   • sendPartyInvite(sender, receiver)
//   • acceptPartyInvite(req) / declinePartyInvite(req)
//   • fetchPartyState(), leaveParty(), kickPartyMember(userId)
//
// One party system for Luna and the game: the server checks friendship or presence, the
// cap, expiry and races (two people accepting the last seat). `req` is a pending
// PartyInvite shaped by IncomingRequestToast ({ id, sender_id, … }).
// ─────────────────────────────────────────────

import { callGameServer } from './socialServer';

export const PARTY_MAX = 5; // partySystem's cap (the game used to say 4)

export const sendPartyInvite = (sender, receiver) =>
  callGameServer('partySystem', 'invite_member', { inviteeId: receiver.id, inviteeName: receiver.name });

export const acceptPartyInvite = (req) => callGameServer('partySystem', 'accept_invite', { inviteId: req.id });

export const declinePartyInvite = (req) => callGameServer('partySystem', 'decline_invite', { inviteId: req.id });

// { party, members: PartyMember rows, invitations: my pending PartyInvite rows, … }
export const fetchPartyState = () => callGameServer('partySystem', 'get_state', {});

export const leaveParty = () => callGameServer('partySystem', 'leave_party', {});

// Leader only; the server refuses anyone else.
export const kickPartyMember = (userId) => callGameServer('partySystem', 'remove_member', { userId });
