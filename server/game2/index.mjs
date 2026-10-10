import { createClient } from '@base44/sdk';
import { createGame2ArenaServer } from './arena.mjs';

// Every connection is authenticated once through Base44; real-time player data
// stays on Railway after admission. No Base44 entity polling during combat.
const appId = String(process.env.BASE44_APP_ID || '');
if (!appId) throw new Error('BASE44_APP_ID must be configured on Railway');
const serverUrl = String(process.env.BASE44_BACKEND_URL || 'https://base44.app');
const port = Number(process.env.PORT || 3000);

async function authenticate(token) {
  const client = createClient({ appId, serverUrl, token, requiresAuth: true });
  const user = await client.auth.me();
  return user?.id ? { id: String(user.id) } : null;
}

const arena = createGame2ArenaServer({ authenticate, port });
const address = await arena.listen();
console.log('[Game 2 Railway] Arena WebSocket ready on port', address.port, '| protocol 2 | max 10 players');
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, async () => {
    console.log('[Game 2 Railway] Shutting down arena');
    await arena.close();
    process.exit(0);
  });
}
