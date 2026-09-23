import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

type Row = Record<string, any>;
const json = (body: unknown, status = 200) => Response.json(body, { status });
const num = (value: any, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Sign in to use the AI Battle bot.' }, 401);

    const body = await req.json().catch(() => ({}));
    const encounterId = String(body?.encounter_id || '').trim();
    const expectedRevision = num(body?.expected_revision, -1);
    if (!encounterId || expectedRevision < 0) return json({ error: 'A valid bot turn is required.' }, 400);

    const svc = base44.asServiceRole.entities;
    const room = await svc.AIBattleEncounter.get(encounterId).catch(() => null);
    if (!room || String(room.host_id) !== String(user.id)) return json({ error: 'Bot encounter not found.' }, 404);
    if (String(room.guest_snapshot?.id || '') !== 'luna-demo-bot') return json({ error: 'This encounter does not use the Luna sparring bot.' }, 403);

    const events = await svc.AIBattleTurn.filter({ encounter_id: encounterId }, 'created_date', 1000);
    events.sort((a: Row, b: Row) => String(a.created_date || '').localeCompare(String(b.created_date || '')) || String(a.id || '').localeCompare(String(b.id || '')));

    // Reconstruct only the immutable revision chain. The battle reducer remains
    // the authority for HP, AP and damage; this endpoint merely contributes the
    // bot's next normal command to that chain.
    let revision = 0;
    const applied = new Set<string>();
    for (const event of events) {
      const key = String(event.actor_id || '') + ':' + String(event.request_id || '');
      if (applied.has(key) || num(event.expected_revision, -1) !== revision) continue;
      applied.add(key);
      revision += 1;
    }

    if (revision !== expectedRevision) return json({ stale: true, revision, server_time: Date.now() }, 409);

    const requestId = `demo-bot-${encounterId}-${revision}`.slice(0, 100);
    const duplicate = events.find((event: Row) => String(event.actor_id) === 'luna-demo-bot' && String(event.request_id) === requestId);
    if (duplicate) return json({ success: true, duplicate: true, revision, server_time: Date.now() });

    await svc.AIBattleTurn.create({
      encounter_id: encounterId,
      actor_id: 'luna-demo-bot',
      request_id: requestId,
      expected_revision: revision,
      command: 'strike',
      payload: {},
      received_at: Date.now(),
    });

    return json({ success: true, revision: revision + 1, server_time: Date.now() });
  } catch (error) {
    console.error('[ai-battle-bot-turn]', error);
    return json({ error: error instanceof Error ? error.message : 'The AI Battle bot could not take its turn.' }, 500);
  }
});
