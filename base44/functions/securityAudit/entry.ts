import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    return Response.json({
        success: true,
        message: 'Security audit is disabled. Run npm audit locally for dependency checks.',
        timestamp: new Date().toISOString()
    });
});