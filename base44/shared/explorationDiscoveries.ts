// Exploration discoveries (docs/game3d/EXPLORATION_DISCOVERIES.md), shared by the
// explorationDiscovery function, the Character Vault and the game.
//
// Discoveries are placed out in the land: material nodes a hero gathers, and elite finds that
// teach a skill. For a character the server keeps, the server decides each reward and records
// it (Game3DDiscoveryClaim): a one-time find is claimed once, a respawning node waits out its
// cooldown, and the Character Vault puts every save right to the ledger, so a reloaded or
// edited save can neither claim a find twice nor invent its rewards.

type Rec = Record<string, any>;
type Save = Record<string, string>;
type Vec3 = [number, number, number];

export type MaterialReward = { type: 'material'; itemId: string; min: number; max: number; chance: number };
export type SkillReward = { type: 'skill'; skillId: string };
export type DiscoveryDefinition = {
  id: string;
  name: string;
  region: string; // a region of the world manifest (axe/world/AXEWorldStreamingSystem.js)
  position: Vec3; // metres, world space
  kind: 'material_node' | 'elite_find';
  interaction: 'Gather' | 'Inspect';
  gatherMs: number; // how long the hero works at it before the reward
  range: number; // metres from the position within which the prompt shows
  respawnMs: number | null; // null: found once per character, ever
  rewards: Array<MaterialReward | SkillReward>;
  minLevel?: number;
  placeholder?: boolean; // stands in for content the owner has not chosen yet
};

export const DISCOVERY_KINDS = Object.freeze(['material_node', 'elite_find']);
export const DISCOVERY_STATE_KEY = 'axe_exploration_discoveries_v1';
export const LEARNED_SKILLS_KEY = 'game_learned_skills_v2';
const LOOT_KEY = 'game_loot_inventory_v2';
// every unit the server grants has a dropId with this prefix
export const DISCOVERY_DROP_PREFIX = 'disc_';

export const DISCOVERY_RULES = Object.freeze({
  reachToleranceM: 2, // the browser reports the hero's position; a little slack for lag
  minClaimIntervalMs: 1000, // per character, across all discoveries; a gather takes longer
  grantHistory: 50, // grants kept per row, so a restore can deliver the newer ones again
});

// Elite skills found out in the land. The owner has not chosen them yet (gap map §12):
// one placeholder carries the grant path. It has no combat effect and no numbers.
export const ELITE_SKILLS: Readonly<Record<string, { id: string; name: string; placeholder: boolean }>> = Object.freeze({
  elite_placeholder_unwritten: Object.freeze({ id: 'elite_placeholder_unwritten', name: 'Unwritten Technique (placeholder)', placeholder: true }),
});

// The materials discoveries give, as the loot store lists them (lootStore.jsx LOOT_TABLE; a test
// keeps the two equal). A unit the server delivers into a save carries these, as a picked-up one does.
export const DISCOVERY_MATERIALS: Readonly<Record<string, { name: string; rarity: string; icon: string }>> = Object.freeze({
  mat_crystal: { name: 'Spirit Crystal', rarity: 'rare', icon: '◆' },
  mat_starlight: { name: 'Starlight Dust', rarity: 'epic', icon: '✦' },
  mat_reinforce: { name: 'Reinforcement Stone', rarity: 'uncommon', icon: '⬟' },
  mat_elite_temper: { name: 'Elite Tempering Stone', rarity: 'elite', icon: '🔷' },
  mat_soul_fragment: { name: 'Soul Fragment', rarity: 'rare', icon: '💠' },
  mat_aura_shard: { name: 'Aura Shard', rarity: 'rare', icon: '🌟' },
  mat_divine_essence: { name: 'Divine Essence', rarity: 'legendary', icon: '✨' },
  mat_heroic_core: { name: 'Heroic Core', rarity: 'heroic', icon: '💎' },
});

// one granted unit, as the loot inventory keeps it
export const discoveryUnit = (itemId: string, dropId: string, collectedAt: number): DiscoveryUnit => ({
  id: itemId, ...(DISCOVERY_MATERIALS[itemId] || { name: itemId, rarity: 'common', icon: '◈' }), category: 'material', dropId, source: 'discovery', collectedAt,
});

const MIN = 60_000;
const material = (itemId: string, min: number, max: number, chance = 1): MaterialReward => ({ type: 'material', itemId, min, max, chance });

// First Faction Territory spans the playable plane (±200 m around the capital start).
export const EXPLORATION_DISCOVERIES: readonly DiscoveryDefinition[] = Object.freeze([
  {
    id: 'ft_spirit_vein', name: 'Spirit Crystal Vein', region: 'AXE_Region_FirstTerritory', position: [48, 0, -62],
    kind: 'material_node', interaction: 'Gather', gatherMs: 1500, range: 3, respawnMs: 20 * MIN,
    rewards: [material('mat_crystal', 1, 2), material('mat_starlight', 1, 1, 0.15)],
  },
  {
    id: 'ft_reinforce_outcrop', name: 'Reinforcement Stone Outcrop', region: 'AXE_Region_FirstTerritory', position: [-84, 0, 36],
    kind: 'material_node', interaction: 'Gather', gatherMs: 1500, range: 3, respawnMs: 15 * MIN,
    rewards: [material('mat_reinforce', 2, 3), material('mat_elite_temper', 1, 1, 0.05)],
  },
  {
    id: 'ft_soul_bloom', name: 'Soul Fragment Bloom', region: 'AXE_Region_FirstTerritory', position: [122, 0, 104],
    kind: 'material_node', interaction: 'Gather', gatherMs: 1500, range: 3, respawnMs: 30 * MIN,
    rewards: [material('mat_soul_fragment', 1, 2), material('mat_aura_shard', 1, 1, 0.25)],
  },
  {
    id: 'ft_hidden_divine_cache', name: 'Hidden Divine Cache', region: 'AXE_Region_FirstTerritory', position: [-158, 0, -146],
    kind: 'material_node', interaction: 'Gather', gatherMs: 2500, range: 3, respawnMs: null,
    rewards: [material('mat_divine_essence', 2, 2), material('mat_heroic_core', 1, 1)],
  },
  {
    id: 'ft_weathered_tablet', name: 'Weathered Stone Tablet', region: 'AXE_Region_FirstTerritory', position: [170, 0, -175],
    kind: 'elite_find', interaction: 'Inspect', gatherMs: 3000, range: 3, respawnMs: null, placeholder: true,
    rewards: [{ type: 'skill', skillId: 'elite_placeholder_unwritten' }],
  },
].map((d) => Object.freeze(d as DiscoveryDefinition)));

export const getDiscovery = (id: string): DiscoveryDefinition | null => EXPLORATION_DISCOVERIES.find((d) => d.id === id) || null;

// ---- rewards and availability: the same rules for the server's roll and a local one ----

export type RolledReward = { materials: Array<{ id: string; category: string; count: number }>; skills: string[] };

// the reward for one claim; rng() is uniform in [0, 1)
export function rollDiscoveryRewards(def: DiscoveryDefinition, rng: () => number): RolledReward {
  const materials: RolledReward['materials'] = [];
  const skills: string[] = [];
  for (const reward of def.rewards) {
    if (reward.type === 'skill') { if (ELITE_SKILLS[reward.skillId]) skills.push(reward.skillId); continue; }
    if (reward.chance < 1 && rng() >= reward.chance) continue;
    const count = reward.max > reward.min ? reward.min + Math.floor(rng() * (reward.max - reward.min + 1)) : reward.min;
    if (count > 0) materials.push({ id: reward.itemId, category: 'material', count });
  }
  return { materials, skills };
}

export type DiscoveryClaim = { count: number; firstClaimedAt: string; lastClaimedAt: string; nextAvailableAt: string | null };

// can this character take it now? `claim` is its last claim, or null
export function discoveryAvailability(def: DiscoveryDefinition, claim: DiscoveryClaim | null | undefined, now = Date.now()) {
  if (!claim || !claim.count) return { available: true as const };
  if (def.respawnMs == null) return { available: false as const, reason: 'already_claimed' as const };
  const next = claim.nextAvailableAt ? Date.parse(claim.nextAvailableAt) : 0;
  if (now < next) return { available: false as const, reason: 'respawning' as const, nextAvailableAt: claim.nextAvailableAt };
  return { available: true as const };
}

// the claim after taking it at `now`
export function nextDiscoveryClaim(def: DiscoveryDefinition, claim: DiscoveryClaim | null | undefined, now = Date.now()): DiscoveryClaim {
  const iso = new Date(now).toISOString();
  return {
    count: Number(claim?.count || 0) + 1,
    firstClaimedAt: claim?.firstClaimedAt || iso,
    lastClaimedAt: iso,
    nextAvailableAt: def.respawnMs == null ? null : new Date(now + def.respawnMs).toISOString(),
  };
}

// the hero is close enough (the position is the browser's, so this only stops a careless script)
export function withinReach(def: DiscoveryDefinition, position: Rec | null | undefined) {
  const x = Number(position?.x), z = Number(position?.z);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
  return Math.hypot(x - def.position[0], z - def.position[2]) <= def.range + DISCOVERY_RULES.reachToleranceM;
}

// ---- the ledger: one Game3DDiscoveryClaim row per character and discovery ----

export type DiscoveryUnit = { id: string; name: string; rarity: string; icon: string; category: string; dropId: string; source: 'discovery'; collectedAt: number };
export type DiscoveryRow = {
  id?: string; discovery_id: string; claims: number; first_claimed_at: string; last_claimed_at: string;
  next_available_at?: string | null; skills?: string[]; pending?: DiscoveryUnit[]; granted?: DiscoveryUnit[];
};

export const claimFromRow = (row: DiscoveryRow): DiscoveryClaim => ({
  count: Number(row.claims || 0),
  firstClaimedAt: row.first_claimed_at,
  lastClaimedAt: row.last_claimed_at,
  nextAvailableAt: row.next_available_at ?? null,
});

const parse = (raw: unknown): any => { try { return typeof raw === 'string' ? JSON.parse(raw) : null; } catch { return null; } };
const sorted = (rec: Rec | null | undefined): string => JSON.stringify(Object.keys(rec || {}).sort().map((k) => [k, (rec as Rec)[k]]));

// The Vault's rule. For every save of a character the server keeps:
//  • the claim state is the ledger's (a reloaded save can't make a claimed find available);
//  • an elite skill is learned exactly when the ledger granted it;
//  • a unit with a discovery dropId must be one the server granted: still pending, or already in
//    the previous server save; each at most once (no copies, and a spent one can't come back);
//  • granted units the save doesn't have yet are delivered (an answer lost on the way, a device
//    that closed before saving).
// Returns the save to keep, what was put right, and the rows whose rewards it now holds.
export function enforceDiscoveryLedger(save: Save, previous: Save | null, rows: DiscoveryRow[] = []) {
  const corrections: string[] = [];
  let data = save;

  // claim state
  const state = parse(data[DISCOVERY_STATE_KEY]);
  const claims = (state?.claims && typeof state.claims === 'object') ? state.claims : {};
  const ledgerClaims = Object.fromEntries(rows.filter((r) => r && Number(r.claims) > 0).map((r) => [r.discovery_id, claimFromRow(r)]));
  const ids = new Set([...Object.keys(claims), ...Object.keys(ledgerClaims)]);
  const wrong = [...ids].filter((id) => sorted(claims[id]) !== sorted(ledgerClaims[id]));
  if (wrong.length) {
    data = { ...data, [DISCOVERY_STATE_KEY]: JSON.stringify({ ...(state || {}), claims: ledgerClaims }) };
    corrections.push(`discovery claims put back: ${wrong.join(', ')}`);
  }

  // elite skills
  const granted = new Set(rows.flatMap((r) => r?.skills || []).filter((id) => ELITE_SKILLS[id]));
  const learned = parse(data[LEARNED_SKILLS_KEY]);
  const learnedList: string[] = Array.isArray(learned) ? learned.map(String) : [];
  const forged = learnedList.filter((id) => ELITE_SKILLS[id] && !granted.has(id));
  const missing = [...granted].filter((id) => !learnedList.includes(id));
  if (forged.length || missing.length) {
    data = { ...data, [LEARNED_SKILLS_KEY]: JSON.stringify([...learnedList.filter((id) => !forged.includes(id)), ...missing]) };
    forged.forEach((id) => corrections.push(`${id}: elite skill not found by this character`));
    missing.forEach((id) => corrections.push(`${id}: elite skill found, learned again`));
  }

  // granted units
  const pending = rows.flatMap((r) => r?.pending || []);
  const pendingIds = new Set(pending.map((u) => u.dropId));
  const before = new Set<string>();
  for (const list of Object.values(parse(previous?.[LOOT_KEY]) || {})) {
    if (Array.isArray(list)) for (const u of list) if (String(u?.dropId || '').startsWith(DISCOVERY_DROP_PREFIX)) before.add(String(u.dropId));
  }
  const inv = parse(data[LOOT_KEY]) || {};
  const seen = new Set<string>();
  let removed = 0;
  const cleaned: Rec = Object.fromEntries(Object.entries(inv).map(([category, list]: [string, any]) => [category, Array.isArray(list) ? list.filter((u: any) => {
    const dropId = String(u?.dropId || '');
    if (!dropId.startsWith(DISCOVERY_DROP_PREFIX)) return true;
    const keep = !seen.has(dropId) && (before.has(dropId) || pendingIds.has(dropId));
    seen.add(dropId);
    if (!keep) removed += 1;
    return keep;
  }) : list]));
  let added = 0;
  for (const unit of pending) {
    if (seen.has(unit.dropId)) continue;
    seen.add(unit.dropId);
    cleaned[unit.category] = [...(Array.isArray(cleaned[unit.category]) ? cleaned[unit.category] : []), { ...unit }];
    added += 1;
  }
  if (removed || added) {
    data = { ...data, [LOOT_KEY]: JSON.stringify(cleaned) };
    if (removed) corrections.push(`${removed} discovery unit(s) the server did not grant removed`);
    if (added) corrections.push(`${added} discovery unit(s) delivered`);
  }
  // every pending unit is in the save now
  const delivered = rows.filter((r) => (r?.pending || []).length).map((r) => r.id).filter(Boolean) as string[];
  // what another device or a lost answer can't explain: flagged for review
  const flagged = removed + forged.length;
  return { data, corrections, delivered, deliveredDropIds: [...pendingIds], flagged };
}

// A restore puts back an older save. What the hero found stays found (the ledger is kept), and
// units granted after that backup are delivered again with the next save.
export function pendingAfterRestore(restored: Save, rows: DiscoveryRow[], backupTakenAt: string) {
  const since = Date.parse(backupTakenAt) || 0;
  const present = new Set<string>();
  for (const list of Object.values(parse(restored?.[LOOT_KEY]) || {})) if (Array.isArray(list)) for (const u of list) present.add(String(u?.dropId || ''));
  return rows.map((row) => ({
    row,
    pending: (row.granted || []).filter((g) => Number(g.collectedAt) > since && !present.has(g.dropId)),
  })).filter((r) => r.pending.length);
}
