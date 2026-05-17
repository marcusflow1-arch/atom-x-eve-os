// ─── MMORPG Shop Catalog ──────────────────────────────────────────────
// Every item below is tied to a real gameplay effect (consumed via
// shopEffectsBridge.js). Cosmetics are toggled visuals via shopCosmeticsLayer.

export const SHOP_CATEGORIES = [
  { id: 'consumables',  label: 'Consumables',      icon: '🧪', desc: 'Potions and elixirs — use to gain temporary combat buffs.' },
  { id: 'materials',    label: 'Enhancement',      icon: '💠', desc: 'Materials for upgrading gear and weapons.' },
  { id: 'companion',    label: 'Companion Gear',   icon: '🐺', desc: 'Equipment and treats for your companion.' },
  { id: 'cosmetics',    label: 'Cosmetic Overlays',icon: '👑', desc: 'Wearable visuals over your armor — purely cosmetic.' },
];

// effect.kind values are consumed by shopEffectsBridge.js:
//   'heal'         — restore HP by `amount`
//   'damage_buff'  — adds N stacks of focus damage buff (mult per stack)
//   'crit_buff'    — adds N stacks of crit chance (1.0% per stack)
//   'gold_grant'   — instantly adds gold (joke item, but works)

export const SHOP_ITEMS = [
  // ── Consumables ─────────────────────────────────────────────────
  { id: 'pot_health_minor', name: 'Minor Healing Potion', category: 'consumables', price: 80,    icon: '🧪', rarity: 'common',    desc: 'Restore 40 HP instantly.',                                  effect: { kind: 'heal', amount: 40 } },
  { id: 'pot_health_major', name: 'Major Healing Potion', category: 'consumables', price: 250,   icon: '⚗️',  rarity: 'rare',      desc: 'Restore 120 HP instantly.',                                 effect: { kind: 'heal', amount: 120 } },
  { id: 'pot_kill_streak',  name: 'Hunter\'s Elixir',     category: 'consumables', price: 600,   icon: '🩸',  rarity: 'epic',      desc: '+25% damage on your next 5 attacks (kill more, kill faster).', effect: { kind: 'damage_buff', stacks: 5, multPerStack: 1.25 } },
  { id: 'pot_crit_charm',   name: 'Crit Charm',           category: 'consumables', price: 900,   icon: '✨',  rarity: 'epic',      desc: '+15% critical strike chance for your next 10 attacks.',     effect: { kind: 'crit_buff', stacks: 10, critPctPerStack: 15 } },
  { id: 'pot_loot_charm',   name: 'Lucky Coin',           category: 'consumables', price: 1500,  icon: '🍀', rarity: 'legendary', desc: 'Instantly gain 500 gold (one-time use).',                   effect: { kind: 'gold_grant', amount: 500 } },

  // ── Enhancement Materials (added to lootInventory misc bucket) ──
  { id: 'mat_iron_ingot',   name: 'Iron Ingot',           category: 'materials',   price: 120,   icon: '🪨',  rarity: 'common',    desc: 'Basic enhancement material. Stacks in your inventory.',     effect: { kind: 'add_material', materialId: 'iron_ingot' } },
  { id: 'mat_mythril',      name: 'Mythril Bar',          category: 'materials',   price: 480,   icon: '⛏️', rarity: 'rare',      desc: 'Mid-tier upgrade material for rare gear.',                  effect: { kind: 'add_material', materialId: 'mythril_bar' } },
  { id: 'mat_starforged',   name: 'Starforged Steel',     category: 'materials',   price: 1800,  icon: '💎', rarity: 'epic',      desc: 'Rare enhancement ingredient — high-tier crafting.',         effect: { kind: 'add_material', materialId: 'starforged_steel' } },
  { id: 'mat_dragon_scale', name: 'Dragon Scale',         category: 'materials',   price: 5000,  icon: '🐉', rarity: 'legendary', desc: 'Legendary tempering material from slain dragons.',          effect: { kind: 'add_material', materialId: 'dragon_scale' } },

  // ── Companion Gear ──────────────────────────────────────────────
  { id: 'comp_collar',      name: 'Reinforced Collar',    category: 'companion',   price: 700,   icon: '🦮',  rarity: 'rare',      desc: 'Companion gains 50 bonus HP permanently.',                  effect: { kind: 'companion_stat', stat: 'hp', amount: 50 } },
  { id: 'comp_fangs',       name: 'Steel Fangs',          category: 'companion',   price: 1200,  icon: '🦷', rarity: 'epic',      desc: 'Companion deals +20% damage permanently.',                 effect: { kind: 'companion_stat', stat: 'attack', amount: 20 } },
  { id: 'comp_amulet',      name: 'Bond Amulet',          category: 'companion',   price: 2500,  icon: '🔱',  rarity: 'legendary', desc: 'Boosts every companion ability cooldown by 15%.',          effect: { kind: 'companion_stat', stat: 'cdr', amount: 15 } },
  { id: 'comp_treats',      name: 'Premium Treats x10',   category: 'companion',   price: 300,   icon: '🍖', rarity: 'common',    desc: 'Restores companion to full HP instantly.',                  effect: { kind: 'companion_heal' } },

  // ── Cosmetic Overlays (toggle on/off, no stats) ─────────────────
  { id: 'cos_cloak_crimson',name: 'Crimson Cloak',        category: 'cosmetics',   price: 1500,  icon: '🧥',  rarity: 'rare',      desc: 'Flowing red cloak overlay. Equips to back slot.',           effect: { kind: 'cosmetic', slot: 'back',  tint: '#dc2626' } },
  { id: 'cos_cloak_void',   name: 'Voidwoven Cape',       category: 'cosmetics',   price: 4200,  icon: '🦇', rarity: 'epic',      desc: 'Dark, shifting cape. Equips to back slot.',                effect: { kind: 'cosmetic', slot: 'back',  tint: '#7c3aed' } },
  { id: 'cos_aura_gold',    name: 'Golden Halo Aura',     category: 'cosmetics',   price: 6000,  icon: '👑', rarity: 'legendary', desc: 'Golden particle aura that follows you.',                    effect: { kind: 'cosmetic', slot: 'aura',  tint: '#f59e0b' } },
  { id: 'cos_helm_horns',   name: 'Demon Horns',          category: 'cosmetics',   price: 2200,  icon: '😈', rarity: 'epic',      desc: 'Demonic horns overlay over your helmet.',                   effect: { kind: 'cosmetic', slot: 'helm',  tint: '#b91c1c' } },
];

export function getItemsByCategory(catId) {
  return SHOP_ITEMS.filter((i) => i.category === catId);
}
export function getItemById(id) {
  return SHOP_ITEMS.find((i) => i.id === id);
}

export const RARITY_COLORS = {
  common:    '#9ca3af',
  rare:      '#60a5fa',
  epic:      '#a78bfa',
  legendary: '#f59e0b',
  mythic:    '#f43f5e',
};