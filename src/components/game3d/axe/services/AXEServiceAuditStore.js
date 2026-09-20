// Character-scoped service transaction audit.
// This is a prototype-side ledger for debugging, duplicate-submit protection and
// migration verification. A production MMO backend should persist the same
// transaction IDs server-side.

import { characterScopedStorage, subscribeCharacterChange } from '../../characterStorage';

const storage = characterScopedStorage('axe_service_audit_v1');
const MAX_RECORDS = 200;

const load = () => {
  try {
    const raw = storage.get();
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(-MAX_RECORDS) : [];
  } catch {
    return [];
  }
};

let records = load();
const listeners = new Set();

const emit = () => {
  storage.set(JSON.stringify(records.slice(-MAX_RECORDS)));
  const snapshot = getAXEServiceAudit();
  listeners.forEach((fn) => fn(snapshot));
};

subscribeCharacterChange(() => {
  records = load();
  listeners.forEach((fn) => fn(getAXEServiceAudit()));
});

export function createAXEServiceTransactionId(serviceId, itemId = 'none') {
  return [
    'axe_tx',
    String(serviceId || 'service'),
    String(itemId || 'none'),
    Date.now(),
    Math.random().toString(36).slice(2, 8),
  ].join('_');
}

export function appendAXEServiceAudit(record = {}) {
  const entry = {
    transactionId: record.transactionId || createAXEServiceTransactionId(record.serviceId, record.itemId),
    serviceId: record.serviceId || null,
    itemId: record.itemId || null,
    requestedAt: Number(record.requestedAt || Date.now()),
    completedAt: Number(record.completedAt || Date.now()),
    ok: !!record.ok,
    outcome: record.outcome || null,
    reason: record.reason || null,
    authoritative: !!record.authoritative,
    cost: record.cost ? { ...record.cost } : null,
  };
  records = [...records, entry].slice(-MAX_RECORDS);
  emit();
  return entry;
}

export function getAXEServiceAudit() {
  return records.map((entry) => ({
    ...entry,
    cost: entry.cost ? { ...entry.cost } : null,
  }));
}

export function subscribeAXEServiceAudit(fn) {
  listeners.add(fn);
  fn(getAXEServiceAudit());
  return () => listeners.delete(fn);
}
