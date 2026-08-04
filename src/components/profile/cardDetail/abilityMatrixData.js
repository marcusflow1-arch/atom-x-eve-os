import { Zap, Shield, Activity, Flame, Swords, Crosshair, Heart, Anchor, Ghost, Cpu, Eye, Target, Wind, Snowflake } from 'lucide-react';

// Three ability paths. Node unlock state is preserved from the original design:
// the Power path root is active, everything else starts locked.
export const ABILITY_PATHS = [
  {
    id: 'power',
    name: 'Power Path',
    tagline: 'Raw strength & combat',
    accent: '#c084fc',
    root: { name: 'Thunder Strike', kind: 'Active', icon: Zap, desc: 'Calls down a chained bolt that arcs to nearby targets.', unlocked: true },
    nodes: [
      { name: 'Overload', icon: Flame, cost: 100, desc: '+12% attack while above 70% power.' },
      { name: 'Cleave', icon: Swords, cost: 100, desc: 'Strikes hit a second adjacent target for 40%.' },
      { name: 'Precision', icon: Crosshair, cost: 100, desc: '+8% critical strike chance.' },
      { name: 'Momentum', icon: Wind, cost: 150, desc: 'Each hit stacks +2% damage, up to 10 stacks.' },
      { name: 'Rupture', icon: Activity, cost: 150, desc: 'Critical hits apply a bleed for 5 seconds.' },
      { name: 'Ascendance', icon: Ghost, cost: 250, desc: 'Ultimate: doubles attack for one exchange.' },
    ],
  },
  {
    id: 'neutral',
    name: 'Neutral Path',
    tagline: 'Defense & utility',
    accent: '#fbbf24',
    root: { name: 'Iron Skin', kind: 'Passive', icon: Shield, desc: 'Reduces all incoming damage by a flat amount.' },
    nodes: [
      { name: 'Bulwark', icon: Shield, cost: 100, desc: '+15% defense while stationary.' },
      { name: 'Second Wind', icon: Heart, cost: 100, desc: 'Recover 10% health after a won exchange.' },
      { name: 'Anchor', icon: Anchor, cost: 100, desc: 'Immune to knockback effects.' },
      { name: 'Frostguard', icon: Snowflake, cost: 150, desc: 'Chills attackers, slowing their next action.' },
      { name: 'Vigil', icon: Eye, cost: 150, desc: 'Reveals enemy intent one step ahead.' },
      { name: 'Aegis', icon: Shield, cost: 250, desc: 'Ultimate: negates the next lethal blow.' },
    ],
  },
  {
    id: 'ai',
    name: 'AI Path',
    tagline: 'Adaptation & tactics',
    accent: '#22d3ee',
    root: { name: 'Neural Link', kind: 'Passive', icon: Activity, desc: 'Learns from each match to refine future tactics.' },
    nodes: [
      { name: 'Pattern Read', icon: Eye, cost: 100, desc: 'Predicts repeated enemy actions.' },
      { name: 'Adaptive Core', icon: Cpu, cost: 100, desc: 'Shifts stats toward the current threat.' },
      { name: 'Target Lock', icon: Target, cost: 100, desc: '+10% accuracy against marked foes.' },
      { name: 'Overclock', icon: Zap, cost: 150, desc: 'Acts twice on the opening exchange.' },
      { name: 'Ghost Protocol', icon: Ghost, cost: 150, desc: 'Avoids the first attack of each round.' },
      { name: 'Singularity', icon: Cpu, cost: 250, desc: 'Ultimate: copies the strongest enemy ability.' },
    ],
  },
];