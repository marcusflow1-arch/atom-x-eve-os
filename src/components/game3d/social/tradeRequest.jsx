// ─────────────────────────────────────────────
// TRADE REQUEST — independent pipeline
//
// Owns:
//   • sendTradeRequest(sender, receiver)
//   • acceptTradeRequest(req)
//   • declineTradeRequest(req)
//
// Rules unique to trades:
//   • Trade is VOLATILE — there is no persistent trade record on the server
//     beyond the SocialRequest itself. Both clients open a local TradePanel
//     when the request flips to 'accepted'.
//   • On accept, the receiver's UI opens immediately. The sender's UI opens
//     reactively via the outgoing-request subscription in IncomingRequestToast.
// ─────────────────────────────────────────────

import { base44 } from '@/api/base44Client';
import { sendCleanRequest, deleteRequest } from './socialRequestHygiene';
import { openTrade } from './socialStores';

const TRADE_BUCKET = 'trade';

export const sendTradeRequest = async (sender, receiver) => {
  return sendCleanRequest({
    kind: TRADE_BUCKET,
    sender,
    receiver,
  });
};

export const acceptTradeRequest = async (req) => {
  // 1. Create the shared TradeSession row FIRST so the sender's
  //    TradeSessionWatcher can discover it. The session is the reliable
  //    source of truth for both clients — the SocialRequest update event
  //    is best-effort only.
  try {
    // Avoid duplicates if one already exists between these two users.
    const existing = await base44.entities.TradeSession.filter({ status: 'accepted' });
    const dup = (existing || []).find((s) =>
      (s.initiator_id === req.sender_id && s.recipient_id === req.receiver_id) ||
      (s.initiator_id === req.receiver_id && s.recipient_id === req.sender_id)
    );
    if (!dup) {
      await base44.entities.TradeSession.create({
        initiator_id: req.sender_id,
        recipient_id: req.receiver_id,
        initiator_offer_card_ids: [],
        recipient_offer_card_ids: [],
        initiator_confirmed: false,
        recipient_confirmed: false,
        status: 'accepted',
      });
    }
  } catch (e) {
    console.warn('[Trade] failed to pre-create TradeSession', e);
  }

  // 2. Mark the SocialRequest accepted (this also notifies the sender if
  //    their realtime subscription is alive — the watcher is the fallback).
  await base44.entities.SocialRequest.update(req.id, { status: 'accepted' });

  // 3. Open trade panel on the RECEIVER's side immediately.
  openTrade({ id: req.sender_id, name: req.sender_name });

  // 4. Cleanup the request after a longer delay so slow clients still
  //    catch the 'accepted' status before it disappears.
  setTimeout(() => deleteRequest(req.id), 8000);
};

export const declineTradeRequest = async (req) => {
  await base44.entities.SocialRequest.update(req.id, { status: 'declined' });
  setTimeout(() => deleteRequest(req.id), 2500);
};