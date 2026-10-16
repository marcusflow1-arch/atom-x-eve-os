// What a Game 3D character save may contain, checked by the server (characterVault) before
// it keeps a copy. docs/game3d/CHARACTER_VAULT.md.
//
// A save is the character's browser storage: { baseKey: rawStoredString }. Hard limits
// reject an upload (impossible values, oversize data). Suspicious changes since the last
// save (a level or Silver jump faster than play allows) are accepted but flagged for
// review, so an honest player is never blocked by a guess.
import { AXE_LEVEL_CAP } from './axePowerBudget.ts';

type Save = Record<string, string>;

export const CHARACTER_SAVE_LIMITS = Object.freeze({
  maxBytes: 1_000_000,
  maxKeys: 150,
  maxKeyBytes: 400_000,
  keyPattern: /^[a-z][a-z0-9_]{2,63}$/,
});

// keys the sync engine keeps for itself; never part of a save
export const CHARACTER_SAVE_EXCLUDED_KEYS = Object.freeze(['axe_character_vault_meta', 'axe_character_vault_local_backup']);

const RATE_STATS = new Set(['critChance', 'criticalChance', 'critDamage', 'criticalDamage', 'critDefense', 'criticalDefense',
  'attackPct', 'damagePct', 'defensePct', 'hpPct', 'maxHPPct', 'chiPct', 'maxChiPct']);
const parse = (raw?: string) => { try { return raw == null ? undefined : JSON.parse(raw); } catch { return undefined; } };
const isInt = (v: unknown) => Number.isInteger(v);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : NaN);

export type SaveCheck = { ok: boolean; errors: string[]; flags: string[]; bytes: number };

export function checkCharacterSave(data: unknown, previous: Save | null = null, { minutesSincePrevious = Infinity } = {}): SaveCheck {
  const errors: string[] = [];
  const flags: string[] = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, errors: ['save must be an object of stored values'], flags, bytes: 0 };
  const save = data as Record<string, unknown>;
  const keys = Object.keys(save);
  let bytes = 0;
  if (keys.length > CHARACTER_SAVE_LIMITS.maxKeys) errors.push(`too many keys (${keys.length})`);
  for (const k of keys) {
    const v = save[k];
    if (!CHARACTER_SAVE_LIMITS.keyPattern.test(k)) { errors.push(`bad key ${k.slice(0, 40)}`); continue; }
    if (CHARACTER_SAVE_EXCLUDED_KEYS.includes(k)) { errors.push(`reserved key ${k}`); continue; }
    if (typeof v !== 'string') { errors.push(`${k} must be a stored string`); continue; }
    bytes += k.length + v.length;
    if (v.length > CHARACTER_SAVE_LIMITS.maxKeyBytes) errors.push(`${k} is too large`);
  }
  if (bytes > CHARACTER_SAVE_LIMITS.maxBytes) errors.push(`save is too large (${bytes} bytes)`);
  if (errors.length) return { ok: false, errors, flags, bytes };
  const s = save as Save;

  // the hero: level, attribute points
  const hero = parse(s.wwm_player_progression_v1);
  const level = hero ? num(hero.level) : 1;
  if (hero !== undefined) {
    if (!isInt(hero.level) || hero.level < 1 || hero.level > AXE_LEVEL_CAP) errors.push(`level ${hero.level} is outside 1–${AXE_LEVEL_CAP}`);
    if (!(num(hero.xp) >= 0)) errors.push('xp must be a number of 0 or more');
    const base = hero.baseStats || {};
    const values = ['strength', 'dexterity', 'constitution', 'focus'].map((k) => num(base[k]));
    if (values.some((v) => !(v >= 0))) errors.push('attributes must be numbers of 0 or more');
    if (!(isInt(hero.unspentPoints) && hero.unspentPoints >= 0)) errors.push('unspent points must be a whole number of 0 or more');
    // 12 starting points, 3 per level, and headroom for points granted by quests and events
    const allowed = 12 + 3 * (Math.max(1, level) - 1) + 150;
    const spent = values.reduce((a, b) => a + (b || 0), 0) + (num(hero.unspentPoints) || 0);
    if (spent > allowed) errors.push(`${spent} attribute points at level ${level} (at most ${allowed})`);
  }
  // prestige levels
  for (const [k, max] of [['halo_progression_v3', 200], ['aura_progression_v1', 200]] as const) {
    const v = parse(s[k]);
    if (v !== undefined && !(isInt(v.level) && v.level >= 0 && v.level <= max)) errors.push(`${k} level ${v.level} is outside 0–${max}`);
  }
  const wings = parse(s.wings_progression_v1);
  for (const [id, p] of Object.entries((wings?.paths || {}) as Record<string, any>)) {
    if (!(isInt(p?.level) && p.level >= 0 && p.level <= 200)) errors.push(`wing path ${id} level ${p?.level} is outside 0–200`);
    if (p?.reinforcementPercent != null && !(num(p.reinforcementPercent) >= 0 && p.reinforcementPercent <= 120)) errors.push(`wing path ${id} reinforcement is outside 0–120%`);
  }
  const titles = parse(s.title_progression_v2);
  for (const [id, p] of Object.entries((titles?.paths || {}) as Record<string, any>)) {
    if (!(isInt(p?.level) && p.level >= 0 && p.level <= 15)) errors.push(`title path ${id} level ${p?.level} is outside 0–15`);
  }
  const pets = parse(s.axe_pet_progression_v1);
  for (const pet of (pets?.pets || []) as any[]) {
    if (!(num(pet?.level) >= 1 && pet.level <= 200)) errors.push(`pet level ${pet?.level} is outside 1–200`);
    if (pet?.overEnchantPercent != null && !(num(pet.overEnchantPercent) >= 0 && pet.overEnchantPercent <= 200)) errors.push('pet over-enchant is outside 0–200%');
  }
  const elixirs = parse(s.axe_elixir_progression_v1);
  if (elixirs) {
    const used = Object.values(elixirs.allocations || {}).reduce((a: number, b) => a + (num(b) || 0), 0);
    const bonus = Object.values(elixirs.bonusCapacity || {}).reduce((a: number, b) => a + (num(b) || 0), 0);
    if (bonus > 200) errors.push(`elixir bonus capacity ${bonus} (at most 200)`);
    if (used > 200 + Math.min(200, bonus)) errors.push(`${used} elixirs used (at most ${200 + Math.min(200, bonus)})`);
  }
  const ascension = parse(s.axe_ascension_v1);
  if (ascension?.ascended && level < 100) errors.push(`ascended at level ${level} (Ascension opens at 100)`);
  // gear: a fully built level-100 heroic item stays far below these
  const inventory = parse(s.axe_equipment_inventory_v2);
  const items = (inventory?.items || []) as any[];
  if (items.length > 600) errors.push(`${items.length} items (at most 600)`);
  for (const item of items) {
    for (const [stat, v] of Object.entries((item?.baseStats || {}) as Record<string, unknown>)) {
      const n = num(v);
      if (Number.isNaN(n)) continue;
      const max = RATE_STATS.has(stat) ? 25 : 5000;
      if (Math.abs(n) > max) { errors.push(`item ${String(item?.name || item?.id || '?').slice(0, 40)}: ${stat} ${n} (at most ${max})`); break; }
    }
  }
  const shop = parse(s.axe_shop_state_v1);
  if (shop && !(num(shop.gold) >= 0 && shop.gold <= 1e9)) errors.push(`Silver ${shop.gold} is outside 0–1,000,000,000`);

  // faster than play allows since the last save: accepted, flagged for review
  if (previous) {
    const minutes = Math.max(0, minutesSincePrevious);
    const before = parse(previous.wwm_player_progression_v1);
    if (hero && before && num(hero.level) - num(before.level) > 2 + 6 * minutes) flags.push(`level_rate: ${before.level} -> ${hero.level} in ${minutes.toFixed(1)} min`);
    const goldBefore = num(parse(previous.axe_shop_state_v1)?.gold);
    if (shop && Number.isFinite(goldBefore) && num(shop.gold) - goldBefore > 5000 + 30000 * minutes) flags.push(`silver_rate: +${num(shop.gold) - goldBefore} in ${minutes.toFixed(1)} min`);
    const haloBefore = num(parse(previous.halo_progression_v3)?.level);
    const haloNow = num(parse(s.halo_progression_v3)?.level);
    if (Number.isFinite(haloBefore) && haloNow - haloBefore > 5 + 20 * minutes) flags.push(`halo_rate: ${haloBefore} -> ${haloNow} in ${minutes.toFixed(1)} min`);
  }
  return { ok: errors.length === 0, errors: errors.slice(0, 20), flags, bytes };
}

// a stable fingerprint of a save, for "is this the same save" checks on both sides
export function fingerprintCharacterSave(save: Save = {}): string {
  const text = Object.keys(save).sort().map((k) => `${k}\u0000${save[k]}`).join('\u0001');
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return `${text.length.toString(36)}-${h.toString(36)}`;
}
