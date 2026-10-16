import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Game 3D world and party chat (docs/game3d/BACKEND_AUDIT.md §3.E).
// Messages are ChatMessage rows on game channels; this function is the game's only way to
// write them, so every message is length-capped, cleaned, rate-limited and, for party
// chat, checked against the partySystem party.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
const nameOf = (user: any) => user?.full_name || user?.username || user?.email?.split?.('@')?.[0] || 'Player';

export const CHAT_RULES = Object.freeze({
  maxLength: 200,
  minIntervalMs: 1000, // one message a second
  burstCount: 6, // and no more than six in twenty seconds
  burstWindowMs: 20_000,
  duplicateWindowMs: 15_000, // the same line twice in fifteen seconds is refused
  maxHistory: 50,
});
export const WORLD_CHANNEL = 'game3d_world';
const ACTIVE_PARTY = new Set(['forming', 'full', 'active']);

// strip control characters, fold whitespace, cap the length
export function cleanChatText(raw: unknown): string {
  return String(raw ?? '')
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CHAT_RULES.maxLength);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const payload = await req.json().catch(() => ({}));
    const action = String(payload?.action || '');
    const data = payload?.data || {};
    const svc = base44.asServiceRole.entities;
    const me = String(user.id);

    // the channel a request is about: the world, or my current party
    const channelFor = async (channel: string) => {
      if (channel === 'world') return { id: WORLD_CHANNEL };
      if (channel !== 'party') return { error: 'Unknown channel', status: 400 };
      const memberships = await svc.PartyMember.filter({ user_id: me });
      for (const m of memberships || []) {
        const party = await svc.Party.get(m.party_id).catch(() => null);
        if (party && ACTIVE_PARTY.has(party.status || 'forming')) return { id: `game3d_party_${party.id}`, partyId: party.id };
      }
      return { error: 'You are not in a party', code: 'no_party', status: 403 };
    };

    if (action === 'recent') {
      const channel = await channelFor(String(data.channel || 'world'));
      if (channel.error) return json({ error: channel.error, code: channel.code }, channel.status);
      const limit = Math.max(1, Math.min(CHAT_RULES.maxHistory, Number(data.limit) || CHAT_RULES.maxHistory));
      const rows = await svc.ChatMessage.filter({ channel_id: channel.id }, '-created_date', limit);
      const messages = (rows || []).filter((m: any) => !m.is_deleted).reverse();
      return json({ success: true, channel_id: channel.id, messages });
    }

    if (action === 'send') {
      const channel = await channelFor(String(data.channel || 'world'));
      if (channel.error) return json({ error: channel.error, code: channel.code }, channel.status);
      const content = cleanChatText(data.content);
      if (!content) return json({ error: 'Message is empty', code: 'empty' }, 400);

      const now = Date.now();
      const mine = await svc.ChatMessage.filter({ sender_id: me }, '-created_date', CHAT_RULES.burstCount);
      const ageOf = (m: any) => now - Date.parse(m?.created_date || 0);
      if (mine?.length && ageOf(mine[0]) < CHAT_RULES.minIntervalMs) {
        return json({ error: 'Slow down', code: 'too_fast', retryAfterMs: CHAT_RULES.minIntervalMs - ageOf(mine[0]) }, 429);
      }
      if ((mine?.length || 0) >= CHAT_RULES.burstCount && ageOf(mine[CHAT_RULES.burstCount - 1]) < CHAT_RULES.burstWindowMs) {
        return json({ error: 'You are sending messages too quickly', code: 'too_fast', retryAfterMs: CHAT_RULES.burstWindowMs - ageOf(mine[CHAT_RULES.burstCount - 1]) }, 429);
      }
      if (mine?.length && mine[0].channel_id === channel.id && mine[0].content === content && ageOf(mine[0]) < CHAT_RULES.duplicateWindowMs) {
        return json({ error: 'You just said that', code: 'duplicate' }, 409);
      }

      const message = await svc.ChatMessage.create({
        channel_id: channel.id,
        sender_id: me,
        sender_name: nameOf(user).slice(0, 60),
        sender_role: 'member',
        content,
        type: 'text',
      });
      return json({ success: true, message });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    console.error('[worldChat]', error);
    return json({ error: (error as Error)?.message || 'Chat failed' }, 500);
  }
});
