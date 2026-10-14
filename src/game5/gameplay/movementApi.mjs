/**
 * G5-0004-B server-only movement API. This is an UNMOUNTED, framework-neutral
 * Request/Response handler, to be composed with the SAME trusted authenticate
 * callback used by G5-0003-A. It is never a standalone public HTTP server.
 */
import { MovementAuthorityError } from './authoritativeMovement.mjs';

const routes = Object.freeze({
  '/api/game5/movement/connect': 'connect',
  '/api/game5/movement/input': 'input',
  '/api/game5/movement/disconnect': 'disconnect',
});
const MAX_BYTES = 1024;
function reply(status, data) {
  return new Response(JSON.stringify(data), {status, headers: {
    'content-type': 'application/json; charset=utf-8', 'cache-control':'no-store',
    'x-content-type-options':'nosniff', vary:'origin, authorization',
  }});
}
function invalid(code, status=400) { throw new MovementAuthorityError(code,status); }

async function receiveJson(request) {
  const contentType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') invalid('JSON_REQUIRED',415);
  const announced = request.headers.get('content-length');
  if (announced != null && Number(announced) > MAX_BYTES) invalid('REQUEST_TOO_LARGE',413);
  const reader = request.body?.getReader();
  if (!reader) invalid('INVALID_JSON');
  let size=0;
  const pieces=[];
  try {
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size>MAX_BYTES) { await reader.cancel(); invalid('REQUEST_TOO_LARGE',413); }
      pieces.push(value);
    }
  } finally { reader.releaseLock(); }
  const payload = new Uint8Array(size);
  let offset=0;
  for (const part of pieces) {payload.set(part,offset);offset+=part.byteLength;}
  let data;
  try { data = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(payload)); }
  catch { invalid('INVALID_JSON'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) invalid('INVALID_JSON');
  return data;
}

export function createGame5MovementApi({ authority, authenticate, allowedOrigins = [] } = {}) {
  if (typeof authority?.connect !== 'function' || typeof authority?.input !== 'function' ||
      typeof authority?.disconnect !== 'function' || typeof authority?.getAuthoritativePosition !== 'function') {
    throw new TypeError('Game 5 server-owned movement authority required');
  }
  if (typeof authenticate !== 'function') throw new TypeError('Verified server authenticator required');
  if (!Array.isArray(allowedOrigins) || !allowedOrigins.length ||
      allowedOrigins.some(x=>typeof x !== 'string' || !/^https?:\/\/[^/]+$/.test(x))) {
    throw new TypeError('Explicit Game 5 allowed origins required');
  }
  async function handleMovementRequest(request) {
    try {
      const url = new URL(request.url);
      const action = routes[url.pathname];
      if (!action) return reply(404,{error:'UNKNOWN_ROUTE'});
      if (request.method !== 'POST') return reply(405,{error:'METHOD_NOT_ALLOWED'});
      if (url.search) return reply(400,{error:'UNEXPECTED_QUERY'});
      // Cookie-based game sessions require CSRF defenses beyond CORS. Mandatory
      // exact Origin here; hosted gateway must additionally enforce its CSRF policy.
      if (!allowedOrigins.includes(request.headers.get('origin'))) return reply(403,{error:'ORIGIN_FORBIDDEN'});
      let actor;
      try { actor = await authenticate(request); }
      catch(error) {
        if (error?.status===401 || error?.code==='UNAUTHORIZED') return reply(401,{error:'UNAUTHORIZED'});
        return reply(503,{error:'AUTH_BACKEND_UNAVAILABLE'});
      }
      if (actor?.authenticated!==true || typeof actor.playerId !== 'string' ||
          !/^base44:[^\s]{1,200}$/.test(actor.playerId)) return reply(401,{error:'UNAUTHORIZED'});
      const data = await receiveJson(request);
      const keys=Object.keys(data);
      const expected = action==='connect'?[]:action==='disconnect'?['sessionId']:
        ['sessionId','seq','moveX','moveZ','sprint'];
      if (keys.some(k=>!expected.includes(k)) || keys.length!==expected.length ||
          expected.some(k=>!Object.prototype.hasOwnProperty.call(data,k))) invalid('FORBIDDEN_OR_INVALID_FIELDS');
      const result = action==='connect'? authority.connect({playerId:actor.playerId}) :
        action==='disconnect'? authority.disconnect({playerId:actor.playerId,sessionId:data.sessionId}) :
        authority.input({playerId:actor.playerId,intent:data});
      return reply(200,{...result, isolatedTestOnly:true});
    } catch (error) {
      if (error instanceof MovementAuthorityError) return reply(error.status,{error:error.code});
      return reply(503,{error:'MOVEMENT_BACKEND_UNAVAILABLE'});
    }
  }
  // Supply the SAME instance in the future Game 5 hosted backend to both
  // handlers, never pass client positions or allow per-request fresh authority.
  return Object.freeze({ handleMovementRequest,
    getAuthoritativePosition: ({playerId})=>authority.getAuthoritativePosition({playerId}),
  });
}