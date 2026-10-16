// World and party chat through the server (worldChat): length caps, cleaning, rate limits
// and the party-membership check all happen there (docs/game3d/BACKEND_AUDIT.md §3.E).
import { callGameServer } from './socialServer';

export const WORLD_CHAT_CHANNEL = 'game3d_world';
export const partyChatChannel = (partyId) => `game3d_party_${partyId}`;

// channel: 'world' | 'party'
export const sendChatMessage = (channel, content) => callGameServer('worldChat', 'send', { channel, content });

// -> { channel_id, messages } oldest first
export const fetchChatHistory = (channel) => callGameServer('worldChat', 'recent', { channel });
