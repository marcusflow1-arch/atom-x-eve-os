// Deterministic skill paths per genre — 3 lanes, 6 tiers each.
const LANES = [
  {
    id: 'offense',
    name: 'Offense',
    accent: '#f97316',
    nodes: ['Precision Strike', 'Momentum', 'Critical Focus', 'Rupture', 'Overdrive', 'Apex Predator'],
  },
  {
    id: 'defense',
    name: 'Defense',
    accent: '#38bdf8',
    nodes: ['Iron Stance', 'Deflection', 'Second Wind', 'Bulwark', 'Retribution', 'Unbreakable'],
  },
  {
    id: 'utility',
    name: 'Utility',
    accent: '#a78bfa',
    nodes: ['Quick Hands', 'Scavenger', 'Field Sense', 'Tactician', 'Time Dilation', 'Grandmaster'],
  },
];

export function buildSkillPaths(genre) {
  const level = Number(genre?.level) || 0;
  // Points spread across lanes as the player levels (20 levels → 18 nodes).
  return LANES.map((lane, laneIndex) => ({
    ...lane,
    nodes: lane.nodes.map((name, tier) => {
      const requiredLevel = tier * 3 + laneIndex + 1;
      return {
        id: `${lane.id}-${tier}`,
        name,
        tier: tier + 1,
        requiredLevel,
        unlocked: level >= requiredLevel,
        description: `Tier ${tier + 1} ${lane.name.toLowerCase()} node for ${genre?.name || 'this genre'}. Unlocks at level ${requiredLevel}.`,
      };
    }),
  }));
}

export function countUnlocked(paths) {
  return paths.reduce((sum, p) => sum + p.nodes.filter(n => n.unlocked).length, 0);
}

export function countTotal(paths) {
  return paths.reduce((sum, p) => sum + p.nodes.length, 0);
}