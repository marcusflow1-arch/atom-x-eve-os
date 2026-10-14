import { base44 } from '@/api/base44Client';
import { queryClientInstance } from '@/lib/query-client';
import { aiBattleQueryKey, createBattleTransport } from './battleSync';

const dismissedResults = new Set();
export function dismissAIBattleResult(matchId) {
  if (matchId) dismissedResults.add(String(matchId));
}
export const withoutDismissed = (body) => (
  body?.match?.status === 'ended' && dismissedResults.has(String(body.match.id)) ? { ...body, match: null } : body
);
const transport = createBattleTransport({
  read: (userId) => queryClientInstance.getQueryData(aiBattleQueryKey(userId)),
  write: (userId, body) => queryClientInstance.setQueryData(aiBattleQueryKey(userId), body),
  sanitize: withoutDismissed,
  invoke: async (action, data) => {
    const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
    let succeeded = false;
    try {
      const response = await base44.functions.invoke('aiBattleMatchmaker', { action, data });
      const body = response?.data ?? response ?? {};
      if (body?.error) throw Object.assign(new Error(body.error), { status: response?.status || 400, body });
      succeeded = true;
      return body;
    } catch (error) {
      const body = error?.response?.data?.data ?? error?.response?.data ?? error?.body ?? null;
      throw Object.assign(new Error(body?.error || body?.message || error?.message || 'AI Battle request failed.'), {
        status: error?.response?.status || error?.status || 500, body,
      });
    } finally {
      // Read-only opt-in queue/attack latency evidence. Never record identifiers,
      // auth tokens, damage values, player state or other request/response data.
      if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('aibattledebug') === '1') {
        const elapsedMs = Math.max(0, (typeof performance !== 'undefined' ? performance.now() : Date.now()) - started);
        const samples = window.__atomxeAIBattleTimings || (window.__atomxeAIBattleTimings = []);
        samples.push({ action, durationMs: Math.round(elapsedMs), success: succeeded });
        if (samples.length > 60) samples.shift();
      }
    }
  },
});
export const requestAIBattle = (userId, action, data, options) => transport.request(userId, action, data, options);
