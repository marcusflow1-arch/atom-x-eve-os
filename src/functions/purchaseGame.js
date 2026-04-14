/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { game_id } = body;

    if (!game_id) {
      return Response.json({ error: 'game_id is required' }, { status: 400 });
    }

    const db = base44.asServiceRole;

    // Get the game
    const games = await db.entities.Game.filter({ id: game_id });
    if (!games || games.length === 0) {
      return Response.json({ error: 'Game not found' }, { status: 404 });
    }
    const game = games[0];

    // Check if user already owns it
    const existing = await db.entities.UserLibrary.filter({ user_id: user.id, game_id });
    if (existing && existing.length > 0) {
      return Response.json({ error: 'You already own this game' }, { status: 409 });
    }

    // Generate a unique key
    const keyCode = `AXE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create the GameKey record
    const gameKey = await db.entities.GameKey.create({
      key_code: keyCode,
      game_id: game.id,
      game_title: game.title,
      status: 'activated',
      activated_by: user.id,
      activated_at: new Date().toISOString(),
    });

    // Add game to user's library
    const libraryEntry = await db.entities.UserLibrary.create({
      user_id: user.id,
      game_id: game.id,
      game_title: game.title,
      game_cover: game.cover_image || '',
      game_genre: game.genre || '',
      key_id: gameKey.id,
      key_code: keyCode,
      acquisition_method: 'purchased',
      purchase_price: game.price || 0,
      install_status: 'not_installed',
      download_url: game.play_link || '',
      play_time_minutes: 0,
      last_played: null,
    });

    // Create a transaction record
    await db.entities.Transaction.create({
      user_id: user.id,
      item_id: game.id,
      item_type: 'game',
      amount: game.price || 0,
      currency: 'USD',
      status: 'completed',
      transaction_hash: keyCode,
      payment_method: 'platform',
    });

    return Response.json({
      success: true,
      message: `${game.title} added to your library!`,
      key_code: keyCode,
      library_entry: libraryEntry,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});