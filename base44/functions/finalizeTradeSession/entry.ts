import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tradeSessionId } = await req.json();
    if (!tradeSessionId) return Response.json({ error: 'tradeSessionId is required' }, { status: 400 });

    const session = await base44.asServiceRole.entities.TradeSession.get(tradeSessionId).catch(() => null);
    if (!session) return Response.json({ error: 'Trade not found' }, { status: 404 });
    if (![session.initiator_id, session.recipient_id].includes(user.id)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (session.status === 'completed') return Response.json({ success: true, tradeSession: session });
    if (session.status !== 'accepted' || !session.initiator_confirmed || !session.recipient_confirmed) {
      return Response.json({ error: 'Trade is not ready to finalize' }, { status: 400 });
    }

    const transfers = [
      { ids: session.initiator_offer_card_ids || [], from: session.initiator_id, to: session.recipient_id },
      { ids: session.recipient_offer_card_ids || [], from: session.recipient_id, to: session.initiator_id },
    ];

    for (const group of transfers) {
      for (const id of group.ids) {
        const card = await base44.asServiceRole.entities.UserCard.get(id).catch(() => null);
        if (!card || card.user_id !== group.from) throw new Error('Card ownership changed before finalization');
        if (card.is_equipped) throw new Error(`${card.card_name || 'A card'} is equipped and cannot be traded`);
        if (card.trade_status !== 'locked_in_trade' || card.last_trade_id !== session.id) throw new Error(`${card.card_name || 'A card'} is not reserved for this trade`);
      }
    }

    for (const group of transfers) {
      for (const id of group.ids) {
        await base44.asServiceRole.entities.UserCard.update(id, {
          user_id: group.to,
          acquisition_method: 'traded',
          trade_status: 'available',
          last_trade_id: session.id,
        });
        const progressions = await base44.asServiceRole.entities.CardProgression.filter({ user_card_id: id }, '-created_date', 10);
        for (const progression of progressions || []) {
          await base44.asServiceRole.entities.CardProgression.update(progression.id, {
            user_id: group.to,
            last_action: 'trade_transfer',
            last_action_at: new Date().toISOString(),
            revision: Number(progression.revision || 0) + 1,
          });
        }
      }
    }

    const completed = await base44.asServiceRole.entities.TradeSession.update(session.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
    return Response.json({ success: true, tradeSession: completed });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 400 });
  }
});