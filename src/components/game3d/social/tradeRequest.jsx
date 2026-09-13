import { base44 } from '@/api/base44Client';
import { deleteRequest } from './socialRequestHygiene';
import { openTrade } from './socialStores';

const TRADE_BUCKET = 'trade';
const dataOf = (response) => response?.data || response || {};

// All friend-card trades now bootstrap through the same backend used by the
// Luna Friends panel. That backend creates the pending TradeSession, links the
// SocialRequest, and keeps UserCard ownership as the single source of truth.
export const sendTradeRequest = async (sender, receiver) => {
  const response = await base44.functions.invoke('friendCardTrade', {
    action: 'start',
    payload: { partnerId: receiver.id },
  });
  const data = dataOf(response);
  if (data.error) throw new Error(data.error);
  return data.session;
};

export const acceptTradeRequest = async (req) => {
  const response = await base44.functions.invoke('friendCardTrade', {
    action: 'accept',
    payload: { partnerId: req.sender_id },
  });
  const data = dataOf(response);
  if (data.error) throw new Error(data.error);

  // Open the same real-time trade surface immediately for the receiver. The
  // sender is opened by TradeSessionWatcher / the accepted SocialRequest event.
  openTrade({ id: req.sender_id, name: req.sender_name });
  setTimeout(() => deleteRequest(req.id), 8000);
  return data.session;
};

export const declineTradeRequest = async (req) => {
  const response = await base44.functions.invoke('friendCardTrade', {
    action: 'decline',
    payload: { partnerId: req.sender_id },
  });
  const data = dataOf(response);
  if (data.error) throw new Error(data.error);
  setTimeout(() => deleteRequest(req.id), 2500);
  return data.session;
};

export { TRADE_BUCKET };
