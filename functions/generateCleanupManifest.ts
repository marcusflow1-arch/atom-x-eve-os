import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    let body = {};
    try { body = await req.json(); } catch {}
    const days = Math.max(1, Number(body?.days || 30));
    const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Fetch all usage records
    const all = await base44.entities.UIUsage.list();

    const stale = (all || []).filter((u) => {
      const d = u.last_used_date ? new Date(u.last_used_date) : null;
      return !d || d < threshold;
    });

    const manifest = stale
      .map((u) => ({
        id: u.id,
        name: u.name,
        type: u.type,
        file_path: u.file_path || (u.type === 'page' ? `pages/${u.name}` : null),
        last_used_date: u.last_used_date || null,
        use_count: u.use_count || 0,
      }))
      .filter((m) => !!m.file_path);

    return Response.json({
      generated_at: now.toISOString(),
      threshold_days: days,
      count: manifest.length,
      items: manifest,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});