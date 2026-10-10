import { createPvPGateway } from './gateway.js';
const gateway = createPvPGateway({ secret: Bun.env.RAILWAY_PVP_TICKET_SECRET || '' });
const origins = new Set((Bun.env.PVP_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean));
export const server = Bun.serve({
  port: Number(Bun.env.PORT || 3000),
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === '/health') return Response.json(gateway.health());
    if (url.pathname !== '/ws') return new Response('Not found', { status: 404 });
    if (req.headers.get('upgrade')?.toLowerCase() !== 'websocket') return new Response('WebSocket required', { status: 426 });
    // Explicit browser-origin allowlist; native diagnostics have no Origin.
    const origin = req.headers.get('origin');
    if (origin && !origins.has(origin)) return new Response('Origin not allowed', { status: 403 });
    return server.upgrade(req) ? undefined : new Response('Upgrade failed', { status: 400 });
  },
  websocket: { open: gateway.open, message: gateway.message, close: gateway.close,
    maxPayloadLength: 65536, idleTimeout: 30, backpressureLimit: 131072, closeOnBackpressureLimit: true },
});
console.log('PvP gateway listening', server.port, gateway.health().mode);
