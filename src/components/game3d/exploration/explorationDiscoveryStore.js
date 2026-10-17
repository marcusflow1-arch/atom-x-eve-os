// ─── Exploration discoveries — what this character found out in the land ─────
// Material nodes a hero gathers and elite finds that teach a skill
// (docs/game3d/EXPLORATION_DISCOVERIES.md). Definitions, reward tables and the
// availability rules live in base44/shared/explorationDiscoveries.ts, shared with
// the server.
//
// For a character the server keeps, the server decides each reward
// (explorationDiscovery 'claim', asked through the source CharacterVaultSync
// registers) and the Character Vault keeps every save equal to its ledger. A
// local-only character (anonymous play, the pre-character slot) rolls here with
// the same table, as server-rolled upgrades do.
//
// EVENTS (window):
//   'explorationDiscoveryClaimed' { discoveryId, kind, units, skills, serverGranted }
//   'axeQuestEvent' world_interact (the discovery) and item_collected (each unit),
//   read by useQuestStore.

import { characterScopedStorage, subscribeCharacterChange } from '../characterStorage';
import { LOOT_TABLE, addLootToInventory, getLootInventory, learnSkill } from '../lootStore';
import {
  DISCOVERY_STATE_KEY,
  discoveryAvailability,
  getDiscovery,
  nextDiscoveryClaim,
  rollDiscoveryRewards,
} from '../../../../base44/shared/explorationDiscoveries.ts';

const storage = characterScopedStorage(DISCOVERY_STATE_KEY);

const load = () => {
  try {
    const parsed = JSON.parse(storage.get() || 'null');
    return { ...(parsed || {}), claims: (parsed?.claims && typeof parsed.claims === 'object') ? parsed.claims : {} };
  } catch {
    return { claims: {} };
  }
};

let state = load();
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(state));

subscribeCharacterChange(() => { state = load(); emit(); });

export const getDiscoveryClaims = () => state.claims;
export const getDiscoveryClaim = (id) => state.claims[id] || null;
export function subscribeDiscoveryClaims(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

// { available } or { available: false, reason: 'already_claimed' | 'respawning', nextAvailableAt }
export function getDiscoveryAvailability(id, now = Date.now()) {
  const def = getDiscovery(id);
  if (!def) return { available: false, reason: 'unknown_discovery' };
  return discoveryAvailability(def, state.claims[id], now);
}

// the claim exactly as decided (the server's timestamps, so the Vault finds nothing to put right)
function recordClaim(id, claim) {
  state = { ...state, claims: { ...state.claims, [id]: claim } };
  storage.set(JSON.stringify(state));
  emit();
}

// ── who decides: the server for a character it keeps, this device otherwise ──
let claimSource = null;
export function setDiscoveryClaimSource(source) { claimSource = source || null; }
// CharacterVaultSync is mounted on the login screen and in the world; one leaving never
// removes the other's source
export function releaseDiscoveryClaimSource(source) { if (claimSource === source) claimSource = null; }

const dispatch = (name, detail) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(name, { detail }));
};

// Put a decided reward into this character: units into the loot inventory (the server's dropIds;
// a unit already here is not added twice), elite skills learned, the claim recorded.
export function applyDiscoveryResult(result, { serverGranted = false } = {}) {
  const have = new Set(Object.values(getLootInventory()).flat().map((u) => u?.dropId).filter(Boolean));
  const units = [];
  for (const unit of result.units || []) {
    if (unit.dropId && have.has(unit.dropId)) continue;
    const def = LOOT_TABLE.find((i) => i.id === unit.id) || {};
    units.push(addLootToInventory({ ...def, ...unit, category: unit.category || def.category || 'material' }));
  }
  for (const skillId of result.skills || []) learnSkill({ id: skillId });
  if (result.claim) recordClaim(result.discoveryId, result.claim);
  const detail = { discoveryId: result.discoveryId, kind: result.kind, units, skills: result.skills || [], serverGranted };
  dispatch('explorationDiscoveryClaimed', detail);
  dispatch('axeQuestEvent', { type: 'world_interact', targetId: result.discoveryId, count: 1 });
  units.forEach((u) => dispatch('axeQuestEvent', { type: 'item_collected', itemId: u.id, count: 1 }));
  return { ok: true, ...detail, claim: result.claim };
}

const inFlight = new Set();
let txSeq = 0;

// The hero finished gathering or inspecting. Returns
//   { ok: true, discoveryId, kind, units, skills, claim, serverGranted }
//   { ok: false, reason, nextAvailableAt? }
// A find this device already knows is taken is refused here and never reaches the server.
export async function claimExplorationDiscovery(discoveryId, { position = null, now = Date.now(), rng = Math.random } = {}) {
  const def = getDiscovery(discoveryId);
  if (!def) return { ok: false, reason: 'unknown_discovery' };
  if (inFlight.has(def.id)) return { ok: false, reason: 'busy' };
  const open = discoveryAvailability(def, state.claims[def.id], now);
  if (!open.available) return { ok: false, reason: open.reason, nextAvailableAt: open.nextAvailableAt ?? null };
  inFlight.add(def.id);
  try {
    const source = claimSource;
    const transactionId = `disc_tx_${now.toString(36)}_${(++txSeq).toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const answer = source ? await source({ discoveryId: def.id, position, transactionId }) : { local: true };
    if (answer?.local) {
      // anonymous play and the pre-character slot: rolled here, with the same table
      const rolled = rollDiscoveryRewards(def, rng);
      const units = rolled.materials.flatMap((m) => Array.from({ length: m.count }, () => ({ id: m.id, category: m.category })));
      return applyDiscoveryResult({ discoveryId: def.id, kind: def.kind, units, skills: rolled.skills, claim: nextDiscoveryClaim(def, state.claims[def.id], now) });
    }
    if (!answer?.ok) return { ok: false, reason: answer?.reason || 'discoveries_need_a_server_connection' };
    const result = answer.result || {};
    if (!result.ok) {
      // taken on another device, or still respawning: this device learns the server's claim
      if (result.claim) recordClaim(def.id, result.claim);
      return { ok: false, reason: result.reason, nextAvailableAt: result.nextAvailableAt ?? null };
    }
    const applied = applyDiscoveryResult(result, { serverGranted: true });
    // the reward goes to the server's copy at once, so it is never delivered a second time
    await source.afterApply?.();
    return applied;
  } finally {
    inFlight.delete(def.id);
  }
}
