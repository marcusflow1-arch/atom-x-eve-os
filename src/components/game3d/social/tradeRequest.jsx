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
  await base44.entities.SocialRequest.update(req.id, { status: 'accepted' });
  // Open the receiver-side trade panel with the sender as partner.
  openTrade({ id: req.sender_id, name: req.sender_name });
};

export const declineTradeRequest = async (req) => {
  await base44.entities.SocialRequest.update(req.id, { status: 'declined' });
  setTimeout(() => deleteRequest(req.id), 2500);
};