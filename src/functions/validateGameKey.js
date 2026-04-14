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
    const { key_code } = body;

    if (!key_code) {
      return Response.json({ error: 'key_code is required' }, { status: 400 });
    }

    const db = base44.asServiceRole;

    // Find the key
    const keys = await db.entities.GameKey.filter({ key_code: key_code.trim().toUpperCase() });
    if (!keys || keys.length === 0) {
      return Response.json({ error: 'Invalid key. Please check and try again.' }, { status: 404 });
    }

    const gameKey = keys[0];

    if (gameKey.status === 'revoked') {
      return Response.json({ error: 'This key has been revoked.' }, { status: 403 });
    }

    if (gameKey.status === 'activated') {
      if (gameKey.activated_by === user.id) {
        return Response.json({ error: 'You already used this key.' }, { status: 409 });
      }
      return Response.json({ error: 'This key has already been activated by another user.' }, { status: 409 });
    }

    // Check if user already owns the game
    const existing = await db.entities.UserLibrary.filter({ user_id: user.id, game_id: gameKey.game_id });
    if (existing && existing.length > 0) {
      return Response.json({ error: 'You already own this game.' }, { status: 409 });
    }

    // Get game details
    const games = await db.entities.Game.filter({ id: gameKey.game_id });
    const game = games?.[0];

    // Activate the key
    await db.entities.GameKey.update(gameKey.id, {
      status: 'activated',
      activated_by: user.id,
      activated_at: new Date().toISOString(),
    });

    // Add to library
    const libraryEntry = await db.entities.UserLibrary.create({
      user_id: user.id,
      game_id: gameKey.game_id,
      game_title: gameKey.game_title,
      game_cover: game?.cover_image || '',
      game_genre: game?.genre || '',
      key_id: gameKey.id,
      key_code: key_code.trim().toUpperCase(),
      acquisition_method: 'key_registration',
      purchase_price: 0,
      install_status: 'not_installed',
      download_url: game?.play_link || '',
      play_time_minutes: 0,
      last_played: null,
    });

    return Response.json({
      success: true,
      message: `${gameKey.game_title} has been added to your library!`,
      game_title: gameKey.game_title,
      library_entry: libraryEntry,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});