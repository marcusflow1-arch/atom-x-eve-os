/**
 * Connected Test movement-intent transport. No positions, actor IDs, receipts,
 * rewards, time deltas, or trusted flags are ever sent from the browser.
 * Requires a mounted authenticated same-origin G5 movement route.
 */
const API = '/api/game5/movement';
export function createGame5MovementTransport({ fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('Fetch implementation required');
  let sessionId = null;
  let seq = 0;
  let busy = false;
  let lastAck = null;
  async function post(path, input) {
    const response = await fetchImpl(`${API}/${path}`, {
      method: 'POST', credentials:'same-origin',cache:'no-store',
      headers:{'content-type':'application/json'},body:JSON.stringify(input),
    });
    let payload;
    try {payload=await response.json();} catch {payload=null;}
    if (!response.ok || !payload) {
      const err=new Error(payload?.error || 'MOVEMENT_BACKEND_UNAVAILABLE');
      err.code=payload?.error||'MOVEMENT_BACKEND_UNAVAILABLE';
      err.status=response.status;
      throw err;
    }
    if (payload.isolatedTestOnly !== true) throw Error('Invalid server movement response');
    return payload;
  }
  return Object.freeze({
    getState:()=>({connected:Boolean(sessionId),sequence:seq,lastAck:lastAck?structuredClone(lastAck):null}),
    connect:async()=>{
      if (busy) return null;
      busy=true;
      try {
        sessionId=null;seq=0;lastAck=null;
        const answer=await post('connect',{});
        if (typeof answer.sessionId!=='string'||!answer.sessionId||answer.worldId!=='game5-lost-card-world' ||
          !Number.isFinite(answer.position?.x)||!Number.isFinite(answer.position?.z)) throw Error('Invalid movement session');
        sessionId=answer.sessionId;
        return answer;
      } finally {busy=false;}
    },
    submit:async({moveX,moveZ,sprint})=>{
      if (busy || !sessionId) return null;
      busy=true;
      try {
        const response=await post('input',{sessionId,seq:seq+1,moveX,moveZ,sprint});
        if (response.ackSeq!==seq+1 || response.worldId!=='game5-lost-card-world' ||
            !Number.isFinite(response.position?.x)||!Number.isFinite(response.position?.z)||
            !Number.isFinite(response.observedAt)) throw Error('Invalid movement acknowledgment');
        seq=response.ackSeq;
        lastAck={position:response.position,observedAt:response.observedAt};
        return lastAck;
      } catch(error) {
        // Sequence may have committed before a connection dropped; force an
        // authenticated reconnection, never resend uncertain movement blindly.
        sessionId=null;
        throw error;
      } finally {busy=false;}
    },
    disconnect:async()=>{
      const old=sessionId;
      sessionId=null;seq=0;lastAck=null;
      if (old) await post('disconnect',{sessionId:old});
    },
  });
}