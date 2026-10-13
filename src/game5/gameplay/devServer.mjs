/**
 * Local-only Game 5 test server. Do not deploy. Vite is an already installed dependency.
 * Start: node src/game5/gameplay/devServer.mjs
 * Open: http://127.0.0.1:4178/src/game5/client/index.html
 */
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLostCardGameplayController } from './lostCardGameplayController.mjs';
import { DevQuestRepository } from './devQuestRepository.mjs';
import { GameplayInputError } from './world.mjs';
const PORT = 4178;
const HOST = '127.0.0.1';
const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const FILE = join(tmpdir(), 'game5-dev-only', 'lost-card-prototype.json');
const CLIENT_ROOT = resolve(ROOT, 'src/game5/client');
const GAMEPLAY_ROOT = resolve(ROOT, 'src/game5/gameplay');
const MAX_BODY_BYTES = 4096;
function json(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(JSON.stringify(payload));
}
async function readJson(req) {
  let size = 0; const chunks = [];
  for await (const part of req) {
    size += part.length;
    if (size > MAX_BODY_BYTES) throw new GameplayInputError('Request too large', 413);
    chunks.push(part);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || Array.isArray(value) || typeof value !== 'object') throw Error();
    return value;
  } catch { throw new GameplayInputError('Expected JSON object'); }
}
/** Exported separately so tests can exercise real HTTP without Vite. */
export function createDevApiHandler(controller, { port = null } = {}) {
  return async (req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (!path.startsWith('/api/game5/')) return false;
    // Compare against the ACTUAL listening port (including ephemeral test ports).
    // Never derive allowed origins from the untrusted Host header.
    const boundPort = port || req.socket.localPort;
    const expectedHost = `${HOST}:${boundPort}`;
    const origin = req.headers.origin;
    if (req.headers.host !== expectedHost || (origin && origin !== `http://${expectedHost}`)) {
      json(res, 403, { error: 'Cross-origin or Host request rejected' }); return true;
    }
    try {
      if (req.method === 'GET' && path === '/api/game5/state') {
        json(res, 200, { snapshot: await controller.snapshot() }); return true;
      }
      if (req.method !== 'POST') { json(res, 405, { error: 'Method not allowed' }); return true; }
      if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') throw new GameplayInputError('JSON content-type required', 415);
      const input = await readJson(req);
      const action = path === '/api/game5/accept' ? controller.accept :
        path === '/api/game5/pickup' ? controller.pickup :
        path === '/api/game5/complete' ? controller.complete : null;
      if (!action) { json(res, 404, { error: 'Unknown Game 5 command' }); return true; }
      json(res, 200, await action(input));
    } catch (error) {
      const status = error instanceof GameplayInputError ? error.status : 500;
      json(res, status, { error: status === 500 ? 'Development quest service unavailable' : error.message });
    }
    return true;
  };
}
/**
 * Vite uses a dedicated Game 5 document root, NOT the app repository root.
 * Only Game 5 client/gameplay imports and existing installed dependencies may
 * be resolved via /@fs. This is defense in depth for a localhost-only tool.
 */
export function createDevViteConfig() {
  return {
    root: CLIENT_ROOT,
    configFile: false,
    publicDir: false,
    cacheDir: join(tmpdir(), 'game5-dev-only', 'vite-cache'),
    server: {
      middlewareMode: true,
      host: HOST,
      fs: {
        strict: true,
        allow: [CLIENT_ROOT, GAMEPLAY_ROOT, resolve(ROOT, 'node_modules')],
        deny: ['**/.env', '**/.env.*', '**/.git/**'],
      },
    },
    appType: 'mpa',
  };
}

export async function startDevServer({ port = Number(process.env.GAME5_DEV_PORT ?? PORT), file = FILE } = {}) {
  if (process.env.NODE_ENV === 'production') throw Error('Game 5 development server cannot run in production mode');
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new TypeError('Invalid development server port');
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer(createDevViteConfig());
  const controller = createLostCardGameplayController({ repository: new DevQuestRepository({ file }) });
  const api = createDevApiHandler(controller, { port });
  const server = createHttpServer(async (req, res) => {
    if (await api(req, res)) return;
    const path = new URL(req.url, 'http://localhost').pathname;
    // Preserve the previous bookmark without exposing the repository as Vite root.
    if (path === '/src/game5/client/index.html') {
      res.writeHead(302, { location: '/index.html' }); res.end(); return;
    }
    vite.middlewares(req, res, () => { res.writeHead(404); res.end('Not found'); });
  });
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject); server.listen(port, HOST, resolve);
    });
  } catch (error) {
    await vite.close();
    throw error;
  }
  const listeningPort = server.address().port;
  console.log(`Game 5 LOCAL DEVELOPMENT ONLY: http://${HOST}:${listeningPort}/index.html`);
  return { server, vite };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  startDevServer().catch((e) => { console.error(e); process.exitCode = 1; });
}
