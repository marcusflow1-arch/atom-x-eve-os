import assert from 'node:assert/strict';
import Module from 'node:module';
import { buildSync } from 'esbuild';

function bundle(entry) {
  const filename = process.cwd() + '/tests/__card_material_settlement_bundle.cjs';
  const result = buildSync({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    target: 'node20',
    external: ['npm:*'],
  });
  const mod = new Module(filename);
  mod.paths = Module._nodeModulePaths(process.cwd());
  mod._compile(result.outputFiles[0].text, filename);
  return mod.exports;
}

function matches(value, query) {
  if (query && typeof query === 'object' && !Array.isArray(query)) {
    if ('$gte' in query && !(Number(value || 0) >= Number(query.$gte))) return false;
    if ('$nin' in query && Array.isArray(value) && query.$nin.some((item) => value.includes(item))) return false;
    return true;
  }
  return String(value ?? '') === String(query ?? '');
}

function userMaterialEntity(initial) {
  let row = structuredClone(initial);
  return {
    async get(id) {
      if (String(id) !== String(row.id)) throw Object.assign(new Error('not found'), { status: 404 });
      return structuredClone(row);
    },
    async updateMany(query, changes) {
      const ok = Object.entries(query).every(([key, value]) => matches(row[key], value));
      if (!ok) return { success: true, updated: 0 };
      for (const [key, value] of Object.entries(changes.$inc || {})) row[key] = Number(row[key] || 0) + Number(value || 0);
      for (const [key, value] of Object.entries(changes.$addToSet || {})) {
        const current = Array.isArray(row[key]) ? [...row[key]] : [];
        if (!current.includes(value)) current.push(value);
        row[key] = current;
      }
      for (const [key, value] of Object.entries(changes.$set || {})) row[key] = value;
      return { success: true, updated: 1 };
    },
    snapshot() { return structuredClone(row); },
  };
}

const settlement = bundle('./base44/shared/cardMaterialSettlement.ts');

const entity = userMaterialEntity({
  id: 'mat-stack-1',
  user_id: 'player-1',
  material_id: 'precision-shard',
  quantity: 1,
  card_consumption_receipts: [],
});
const svc = { UserMaterial: entity };

const spendA = {
  user_id: 'player-1',
  user_material_id: 'mat-stack-1',
  material_id: 'precision-shard',
  receipt: 'progression:card-a:req-a:material:mat-stack-1',
  quantity: 1,
};

await settlement.applyCardMaterialSpend(svc, spendA);
assert.equal(entity.snapshot().quantity, 0, 'first card consumes the final material');
assert.deepEqual(entity.snapshot().card_consumption_receipts, [spendA.receipt], 'the debit and its receipt commit together');

await settlement.applyCardMaterialSpend(svc, spendA);
assert.equal(entity.snapshot().quantity, 0, 'retrying the same request never spends twice');
assert.deepEqual(entity.snapshot().card_consumption_receipts, [spendA.receipt], 'idempotent retry does not duplicate the receipt');

const spendB = { ...spendA, receipt: 'progression:card-b:req-b:material:mat-stack-1' };
await assert.rejects(
  settlement.applyCardMaterialSpend(svc, spendB),
  /Not enough enhancement material remains/,
  'a second card cannot claim another request\'s post-spend quantity as its own debit',
);
assert.equal(entity.snapshot().quantity, 0);
assert.equal(entity.snapshot().card_consumption_receipts.includes(spendB.receipt), false, 'failed competing spend never receives a receipt');

const entity2 = userMaterialEntity({
  id: 'mat-stack-2',
  user_id: 'player-1',
  material_id: 'precision-shard',
  quantity: 3,
  card_consumption_receipts: [],
});
const svc2 = { UserMaterial: entity2 };
await settlement.applyCardMaterialSpend(svc2, {
  user_id: 'player-1', user_material_id: 'mat-stack-2', material_id: 'precision-shard', receipt: 'r1', quantity: 2,
});
await settlement.applyCardMaterialSpend(svc2, {
  user_id: 'player-1', user_material_id: 'mat-stack-2', material_id: 'precision-shard', receipt: 'r2', quantity: 1,
});
assert.equal(entity2.snapshot().quantity, 0, 'independent receipts can consume distinct remaining units safely');
assert.deepEqual(entity2.snapshot().card_consumption_receipts.sort(), ['r1', 'r2']);

console.log('PASS: Card material settlement atomically debits quantity, records request receipts, retries idempotently, and rejects cross-card double spend.');
