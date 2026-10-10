import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { makeGame2Coordinator, validPeerForUser } from './coordinator.mjs';

// One backend-controlled room registry for the entire Atom XE app.
// In particular, an editor-preview user and a published-site user MUST be able
// to discover each other's room despite row-level permissions on Game2Room.
Deno.serve(async req => {
  try {
    const client = createClientFromRequest(req);
    const user = await client.auth.me();
    if (!user?.id) return Response.json({ error: 'Sign in to join Game 2 online.' }, { status: 401 });
    const data = await req.json().catch(() => ({}));
    const action = String(data.action || 'list');
    const coordinator = makeGame2Coordinator(client.asServiceRole.entities.Game2Room);
    if (action === 'list') {
      const rooms = await coordinator.list();
      return Response.json({ rooms, server_time: Date.now() });
    }
    if (!validPeerForUser(data.peer, String(user.id))) {
      return Response.json({ error: 'Invalid or missing Game 2 peer identity.' }, { status: 400 });
    }
    if (action === 'claim') {
      const outcome = await coordinator.claim(String(user.id), data.peer, data.fields);
      return Response.json(outcome);
    }
    const id = String(data.id || '');
    if (!id || id.length > 160) return Response.json({ error: 'Invalid Game 2 room.' }, { status: 400 });
    if (action === 'heartbeat') {
      const room = await coordinator.heartbeat(id, String(user.id), data.peer, data.fields);
      return Response.json({ room });
    }
    if (action === 'leave') {
      await coordinator.leave(id, String(user.id), data.peer);
      return Response.json({ success: true });
    }
    return Response.json({ error: 'Unknown Game 2 arena action.' }, { status: 400 });
  } catch (error) {
    console.error('[game2Arena]', error);
    const message = String(error?.message || error);
    return Response.json({
      error: message.includes('Only the current arena host') ? message : 'Shared Game 2 arena service unavailable.',
    }, { status: message.includes('Only the current arena host') ? 403 : 503 });
  }
});
