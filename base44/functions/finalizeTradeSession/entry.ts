import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tradeSessionId } = await req.json();
    if (!tradeSessionId) {
      return Response.json({ error: 'tradeSessionId is required' }, { status: 400 });
    }

    const sessions = await base44.asServiceRole.entities.TradeSession.filter({ id: tradeSessionId });
    const session = sessions[0];

    if (!session) {
      return Response.json({ error: 'Trade not found' }, { status: 404 });
    }

    const allowedUsers = [session.initiator_id, session.recipient_id];
    if (!allowedUsers.includes(user.id)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (session.status !== 'accepted' || !session.initiator_confirmed || !session.recipient_confirmed) {
      return Response.json({ error: 'Trade is not ready to finalize' }, { status: 400 });
    }

    const initiatorCards = session.initiator_offer_snapshot || [];
    const recipientCards = session.recipient_offer_snapshot || [];

    for (const card of initiatorCards) {
      if (!card.id) continue;
      await base44.asServiceRole.entities.UserCard.update(card.id, {
        user_id: session.recipient_id,
        acquisition_method: 'traded',
        trade_status: 'available',
        last_trade_id: session.id,
        game_name: card.game_name,
        game_id: card.game_id,
      });
    }

    for (const card of recipientCards) {
      if (!card.id) continue;
      await base44.asServiceRole.entities.UserCard.update(card.id, {
        user_id: session.initiator_id,
        acquisition_method: 'traded',
        trade_status: 'available',
        last_trade_id: session.id,
        game_name: card.game_name,
        game_id: card.game_id,
      });
    }

    await base44.asServiceRole.entities.TradeSession.update(session.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});