import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { type = 'game', title = 'Untitled', id = null } = body || {};

    // Simulate creating a launch session (stub for real integration)
    const sessionId = crypto.randomUUID();
    const launchedAt = new Date().toISOString();


    return Response.json({
      status: 'ready',
      session_id: sessionId,
      launched_at: launchedAt,
      type,
      title,
      id,
      launch_url: `/play?type=${encodeURIComponent(type)}&title=${encodeURIComponent(title)}`
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Internal Error' }, { status: 500 });
  }
});