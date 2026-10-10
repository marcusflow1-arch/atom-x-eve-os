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
    try {
      const response = await base44.functions.invoke('aiBattleMatchmaker', { action, data });
      const body = response?.data ?? response ?? {};
      if (body?.error) throw Object.assign(new Error(body.error), { status: response?.status || 400, body });
      if (typeof window !== 'undefined' && body?.railway_receipt && body?.match?.id) {
        window.dispatchEvent(new CustomEvent('atomxePvPReceipt', {
          detail: { matchId: body.match.id, receipt: body.railway_receipt },
        }));
      }
      // Signed bearer material is transient; it must not enter the query cache.
      delete body.railway_receipt;
      return body;
    } catch (error) {
      const body = error?.response?.data?.data ?? error?.response?.data ?? error?.body ?? null;
      throw Object.assign(new Error(body?.error || body?.message || error?.message || 'AI Battle request failed.'), {
        status: error?.response?.status || error?.status || 500, body,
      });
    }
  },
});
export const requestAIBattle = (userId, action, data, options) => transport.request(userId, action, data, options);
