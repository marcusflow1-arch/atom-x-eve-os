// Hybrid Attribute + Specialization System Config
// Each attribute has base bonuses (always applied) and specialization choices.

export const ATTRIBUTE_CONFIG = {
  strength: {
    key: 'strength',
    label: 'Strength',
    abbr: 'STR',
    color: '#f87171',
    icon: '⚔️',
    identity: 'Physical power / melee dominance',
    baseEffects: [
      { label: 'Physical Damage', perPoint: 4 },
      { label: 'Accuracy', perPoint: 0.8 },
      { label: 'Stagger Power', perPoint: 0.5 },
    ],
    specializations: [
      { id: 'heavy_damage',  label: 'Heavy Damage',     desc: '↑ Raw damage scaling' },
      { id: 'armor_break',   label: 'Armor Penetration', desc: '↑ % armor penetration' },
      { id: 'stagger',       label: 'Knockback / Stagger', desc: '↑ CC impact on enemies' },
      { id: 'hybrid',        label: 'Hybrid Boost',     desc: 'Small increase to all (60–70% efficiency)', isHybrid: true },
    ],
  },
  dexterity: {
    key: 'dexterity',
    label: 'Dexterity',
    abbr: 'DEX',
    color: '#34d399',
    icon: '🏹',
    identity: 'Precision / speed / crit gameplay',
    baseEffects: [
      { label: 'Critical Chance', perPoint: 0.5 },
      { label: 'Critical Damage', perPoint: 1.0 },
      { label: 'Ranged Attack Speed', perPoint: 0.3 },
    ],
    specializations: [
      { id: 'crit_chance',   label: 'Crit Chance Focus',   desc: '↑ Critical hit chance' },
      { id: 'crit_damage',   label: 'Crit Damage Focus',   desc: '↑ Critical hit multiplier' },
      { id: 'attack_speed',  label: 'Attack Speed Focus',  desc: '↑ Overall attack speed' },
      { id: 'evasion',       label: 'Evasion',             desc: 'Small dodge chance bonus' },
      { id: 'hybrid',        label: 'Hybrid Boost',        desc: 'Small increase to all (60–70% efficiency)', isHybrid: true },
    ],
  },
  constitution: {
    key: 'constitution',
    label: 'Constitution',
    abbr: 'CON',
    color: '#fb923c',
    icon: '🛡️',
    identity: 'Survivability / sustain',
    baseEffects: [
      { label: 'Max HP', perPoint: 20 },
      { label: 'HP Regen', perPoint: 0.4 },
      { label: 'Tenacity (CC Resist)', perPoint: 0.6 },
    ],
    specializations: [
      { id: 'max_hp',          label: 'Max HP Focus',        desc: '↑ Maximum health pool' },
      { id: 'regen',           label: 'Regen Focus',         desc: '↑ HP regeneration rate' },
      { id: 'tenacity',        label: 'Tenacity Focus',      desc: '↑ Resistance to stun/CC' },
      { id: 'dmg_reduction',   label: 'Damage Reduction',    desc: 'Flat % incoming damage reduction' },
      { id: 'hybrid',          label: 'Hybrid Boost',        desc: 'Small increase to all (60–70% efficiency)', isHybrid: true },
    ],
  },
  defense: {
    key: 'defense',
    label: 'Defense',
    abbr: 'DEF',
    color: '#60a5fa',
    icon: '🔰',
    identity: 'Avoidance + mitigation',
    baseEffects: [
      { label: 'Armor', perPoint: 3 },
      { label: 'Evasion', perPoint: 0.4 },
      { label: 'Critical Resistance', perPoint: 0.5 },
    ],
    specializations: [
      { id: 'armor_focus',    label: 'Armor Focus',          desc: '↑ Flat damage reduction armor' },
      { id: 'evasion_focus',  label: 'Evasion Focus',        desc: '↑ Chance to dodge attacks' },
      { id: 'crit_resist',    label: 'Crit Resistance',      desc: '↑ Resistance to critical hits' },
      { id: 'block',          label: 'Block Efficiency',     desc: '↑ Shield block value (if equipped)' },
      { id: 'hybrid',         label: 'Hybrid Boost',         desc: 'Small increase to all (60–70% efficiency)', isHybrid: true },
    ],
  },
  focus: {
    key: 'focus',
    label: 'Focus',
    abbr: 'FOC',
    color: '#a78bfa',
    icon: '✨',
    identity: 'Energy / healing / elemental resistance',
    baseEffects: [
      { label: 'Healing Power', perPoint: 2 },
      { label: 'Chi / Mana Regen', perPoint: 0.5 },
      { label: 'Max Chi / Mana', perPoint: 8 },
      { label: 'Elemental Resistance', perPoint: 0.4 },
    ],
    specializations: [
      { id: 'healing',       label: 'Healing Power Focus',   desc: '↑ All healing output' },
      { id: 'regen',         label: 'Resource Regen Focus',  desc: '↑ Chi/Mana regeneration' },
      { id: 'max_resource',  label: 'Max Resource Focus',    desc: '↑ Max Chi/Mana pool' },
      { id: 'elem_defense',  label: 'Elemental Defense',     desc: '↑ Resistance to elemental damage' },
      { id: 'hybrid',        label: 'Hybrid Boost',          desc: 'Small increase to all (60–70% efficiency)', isHybrid: true },
    ],
  },
  intelligence: {
    key: 'intelligence',
    label: 'Intelligence',
    abbr: 'INT',
    color: '#38bdf8',
    icon: '🔮',
    identity: 'Magic damage / elemental offense',
    baseEffects: [
      { label: 'Elemental Damage', perPoint: 3.5 },
      { label: 'Ability Power', perPoint: 2 },
      { label: 'Status Effect Strength', perPoint: 0.7 },
    ],
    specializations: [
      { id: 'raw_damage',   label: 'Raw Elemental Damage',  desc: '↑ Direct elemental hit damage' },
      { id: 'dot',          label: 'DoT / Status Effects',  desc: '↑ Burn, freeze, poison strength' },
      { id: 'ability',      label: 'Ability Scaling',       desc: '↑ Skill and ability power' },
      { id: 'cdr',          label: 'Cooldown Reduction',    desc: '↑ Ability cooldown reduction' },
      { id: 'hybrid',       label: 'Hybrid Boost',          desc: 'Small increase to all (60–70% efficiency)', isHybrid: true },
    ],
  },
};

export const ATTRIBUTE_ORDER = [
  'strength', 'dexterity', 'constitution', 'defense', 'focus', 'intelligence'
];

// Diminishing returns: the more points past threshold, the less gain per point.
export function applyDiminishingReturns(points, threshold = 20, falloff = 0.65) {
  if (points <= threshold) return points;
  const excess = points - threshold;
  return threshold + excess * falloff;
}

// Specialization multiplier for a given spec vs. hybrid
export function getSpecMultiplier(specId, isHybrid) {
  if (isHybrid) return 0.65; // hybrid = 65% efficiency
  return 1.0;                // focused = 100%
}