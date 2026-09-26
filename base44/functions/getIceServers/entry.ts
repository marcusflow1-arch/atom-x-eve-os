import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const iceServers: any[] = [{ urls: 'stun:stun.l.google.com:19302' }];
  const urls = String(Deno.env.get('TURN_URLS') || '').split(',').map(v => v.trim()).filter(Boolean);
  const username = String(Deno.env.get('TURN_USERNAME') || '');
  const credential = String(Deno.env.get('TURN_CREDENTIAL') || '');
  if (urls.length && username && credential) iceServers.push({ urls, username, credential });

  return Response.json({ iceServers });
});
