import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { finalizeCardTradeSession } from '../../shared/cardTradeFinalizer.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tradeSessionId } = await req.json();
    if (!tradeSessionId) return Response.json({ error: 'tradeSessionId is required' }, { status: 400 });
    const svc = base44.asServiceRole.entities;
    const session = await svc.TradeSession.get(tradeSessionId).catch(() => null);
    if (!session) return Response.json({ error: 'Trade not found' }, { status: 404 });
    if (![session.initiator_id, session.recipient_id].includes(user.id)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const completed = await finalizeCardTradeSession(svc, session, {
      method: 'player_trade',
      progression_action: 'trade_transfer',
    });
    return Response.json({ success: true, tradeSession: completed });
  } catch (error) {
    return Response.json(
      { error: error?.message || String(error) },
      { status: Number(error?.status || 400) },
    );
  }
});