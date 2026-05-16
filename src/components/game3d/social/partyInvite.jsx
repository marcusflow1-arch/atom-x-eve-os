// ─────────────────────────────────────────────
// PARTY INVITE — independent pipeline
//
// Owns:
//   • sendPartyInvite(sender, receiver, currentPartyId)
//   • acceptPartyInvite(req, myName)
//   • declinePartyInvite(req)
//
// Rules unique to parties:
//   • If sender already has an active party that's FULL, reject locally with
//     code='party_full' rather than spamming the receiver with an invite that
//     can't be accepted.
//   • If sender has no party, the accept path creates a fresh PartySession.
//   • If sender already has a party, the accept path appends the receiver.
//   • PARTY_MAX = 4 is enforced on accept too.
// ─────────────────────────────────────────────

import { base44 } from '@/api/base44Client';
import { sendCleanRequest, deleteRequest } from './socialRequestHygiene';

export const PARTY_MAX = 4;
const PARTY_BUCKET = 'party';

/** If a partyId is passed, verify it has room before sending. */
const partyHasRoom = async (partyId) => {
  if (!partyId) return true;
  try {
    const rows = await base44.entities.PartySession.filter({ id: partyId });
    const session = (rows || [])[0];
    if (!session) return true;
    return (session.member_ids || []).length < PARTY_MAX;
  } catch {
    return true;
  }
};

export const sendPartyInvite = async (sender, receiver, currentPartyId) => {
  if (!(await partyHasRoom(currentPartyId))) {
    const err = new Error('Your party is full');
    err.code = 'party_full';
    throw err;
  }
  return sendCleanRequest({
    kind: PARTY_BUCKET,
    sender,
    receiver,
    extraFields: { party_id: currentPartyId || null },
  });
};

export const acceptPartyInvite = async (req, myName) => {
  await base44.entities.SocialRequest.update(req.id, { status: 'accepted' });

  let session = null;
  if (req.party_id) {
    const found = await base44.entities.PartySession.filter({ id: req.party_id });
    session = (found || [])[0];
  }

  if (!session) {
    // Sender had no party yet — create one with both members.
    await base44.entities.PartySession.create({
      leader_id: req.sender_id,
      member_ids: [req.sender_id, req.receiver_id],
      members: [
        { id: req.sender_id, name: req.sender_name },
        { id: req.receiver_id, name: req.receiver_name || myName },
      ],
      active: true,
    });
    return { joined: true };
  }

  // Existing party — enforce cap then append.
  if ((session.member_ids || []).length >= PARTY_MAX) {
    const err = new Error('Party is full');
    err.code = 'party_full';
    throw err;
  }
  const newMemberIds = Array.from(new Set([...(session.member_ids || []), req.receiver_id]));
  const newMembers = [
    ...(session.members || []),
    { id: req.receiver_id, name: req.receiver_name || myName },
  ];
  await base44.entities.PartySession.update(session.id, {
    member_ids: newMemberIds,
    members: newMembers,
  });
  return { joined: true };
};

export const declinePartyInvite = async (req) => {
  await base44.entities.SocialRequest.update(req.id, { status: 'declined' });
  setTimeout(() => deleteRequest(req.id), 2500);
};