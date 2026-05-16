// ─────────────────────────────────────────────
// DUEL CHALLENGE — independent pipeline
//
// Owns:
//   • sendDuelChallenge(sender, receiver)
//   • acceptDuelChallenge(req, myName)
//   • declineDuelChallenge(req)
//
// Rules unique to duels:
//   • If either player is already in an active duel, reject with
//     code='already_dueling' so we don't end up with overlapping sessions.
//   • On accept, a fresh DuelSession row is created and its id is written
//     back onto the SocialRequest so the sender's listener can pick it up.
//   • Default HP = 100 (matches the existing DuelSession schema defaults).
// ─────────────────────────────────────────────

import { base44 } from '@/api/base44Client';
import { sendCleanRequest, deleteRequest } from './socialRequestHygiene';

const DUEL_BUCKET = 'duel';
const DEFAULT_HP = 100;

const inActiveDuel = async (userId) => {
  try {
    const [asChallenger, asOpponent] = await Promise.all([
      base44.entities.DuelSession.filter({ challenger_id: userId, status: 'active' }),
      base44.entities.DuelSession.filter({ opponent_id: userId, status: 'active' }),
    ]);
    return (asChallenger?.length || 0) + (asOpponent?.length || 0) > 0;
  } catch {
    return false;
  }
};

export const sendDuelChallenge = async (sender, receiver) => {
  if (await inActiveDuel(sender.id)) {
    const err = new Error("You're already in a duel");
    err.code = 'already_dueling';
    throw err;
  }
  if (await inActiveDuel(receiver.id)) {
    const err = new Error(`${receiver.name || 'They'} is already in a duel`);
    err.code = 'already_dueling';
    throw err;
  }
  return sendCleanRequest({
    kind: DUEL_BUCKET,
    sender,
    receiver,
  });
};

export const acceptDuelChallenge = async (req, myName) => {
  await base44.entities.SocialRequest.update(req.id, { status: 'accepted' });
  const duel = await base44.entities.DuelSession.create({
    challenger_id: req.sender_id,
    challenger_name: req.sender_name,
    opponent_id: req.receiver_id,
    opponent_name: req.receiver_name || myName,
    status: 'active',
    challenger_hp: DEFAULT_HP,
    opponent_hp: DEFAULT_HP,
    max_hp: DEFAULT_HP,
  });
  // Tag the request with the duel id so the sender's listener can pick it up.
  try {
    await base44.entities.SocialRequest.update(req.id, { duel_id: duel.id });
  } catch {
    // Non-fatal — sender can still discover the duel via DuelSession subscribe.
  }
  return duel;
};

export const declineDuelChallenge = async (req) => {
  await base44.entities.SocialRequest.update(req.id, { status: 'declined' });
  setTimeout(() => deleteRequest(req.id), 2500);
};