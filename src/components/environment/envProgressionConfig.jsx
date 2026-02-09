// ── Environment Hub Progression Configuration ──
// This is the single source of truth for all progression rules.
// Props, market, and AI systems should read from here.

// ── Global Hub Level Unlocks ──
// These features become AVAILABLE (system access) at a given global hub level.
// Per-environment structure levels still control depth/upgrades within each feature.
export const GLOBAL_HUB_UNLOCKS = [
  { level: 1,  featureId: 'shop',        name: 'Shop',              icon: 'ShoppingBag',  description: 'Buy decorations, expansions, cosmetics.' },
  { level: 3,  featureId: 'blacksmith',   name: 'Blacksmith',        icon: 'Hammer',        description: 'Upgrade gear from games. Modify AI loadouts.' },
  { level: 5,  featureId: 'arena',        name: 'Battle Arena',      icon: 'Swords',        description: 'AI vs AI simulations, PvE challenges.' },
  { level: 7,  featureId: 'trophy_room',  name: 'Trophy Room',       icon: 'Trophy',        description: 'Display achievements. 3D trophies grant buffs.' },
  { level: 10, featureId: 'guild_hall',   name: 'Guild Hall',        icon: 'Crown',         description: 'Shared clan space, co-op bonuses.' },
  { level: 12, featureId: 'enchanting',   name: 'Enchantment Table', icon: 'Sparkles',      description: 'Apply modifiers tied to achievements.' },
  { level: 15, featureId: 'vault',        name: 'The Vault',         icon: 'Shield',        description: 'Secure storage for high-value items.' },
  { level: 20, featureId: 'portal',       name: 'Dimension Portal',  icon: 'Layers',        description: 'Travel between unlocked environments.' },
  { level: 25, featureId: 'env_achievements', name: 'Environment Achievements', icon: 'Award', description: 'Unique achievements per environment.' },
  { level: 30, featureId: 'ai_coop',      name: 'AI Co-Op Instances', icon: 'Bot',          description: 'Run AI instances collaboratively.' },
];

// ── Environment Rarity Rules ──
export const RARITY_CONFIG = {
  Common:    { maxRank: 10, tradable: false, soulbound: false, imprintable: false, color: 'slate',  label: 'Common',    xpMultiplier: 1.0 },
  Rare:      { maxRank: 15, tradable: true,  soulbound: false, imprintable: false, color: 'blue',   label: 'Rare',      xpMultiplier: 1.2 },
  Epic:      { maxRank: 15, tradable: true,  soulbound: false, imprintable: false, color: 'purple', label: 'Epic',      xpMultiplier: 1.5 },
  Legendary: { maxRank: 20, tradable: false, soulbound: true,  imprintable: false, color: 'amber',  label: 'Legendary', xpMultiplier: 2.0 },
  Mythical:  { maxRank: 20, tradable: false, soulbound: true,  imprintable: true,  color: 'red',    label: 'Mythical',  xpMultiplier: 3.0 },
};

// ── XP Tables ──
// XP required to reach the NEXT global hub level
export function xpForGlobalLevel(level) {
  return Math.floor(500 * Math.pow(1.15, level - 1));
}

// XP required to reach the NEXT environment rank
export function xpForEnvRank(rank) {
  return Math.floor(300 * Math.pow(1.2, rank - 1));
}

// ── Rarity Visual Styles ──
export const RARITY_STYLES = {
  Common:    { text: 'text-slate-300',  bg: 'bg-slate-500/10',  border: 'border-slate-500/30',  glow: '',                                              ring: 'ring-slate-400/20'  },
  Rare:      { text: 'text-blue-300',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   glow: 'shadow-[0_0_12px_rgba(59,130,246,0.3)]',        ring: 'ring-blue-400/30'   },
  Epic:      { text: 'text-purple-300', bg: 'bg-purple-500/10', border: 'border-purple-500/30', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]',        ring: 'ring-purple-400/40' },
  Legendary: { text: 'text-amber-300',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  glow: 'shadow-[0_0_20px_rgba(251,191,36,0.5)]',        ring: 'ring-amber-400/50'  },
  Mythical:  { text: 'text-red-300',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    glow: 'shadow-[0_0_25px_rgba(239,68,68,0.5)]',         ring: 'ring-red-400/50'    },
};

// ── Mastery Flags ──
export const MASTERY_FLAGS = {
  ForgeMastery:     { label: 'Forge Mastery',     icon: 'Hammer',   description: '+10% crafting speed' },
  ArenaChampion:    { label: 'Arena Champion',     icon: 'Swords',   description: '+5% AI battle power' },
  VaultKeeper:      { label: 'Vault Keeper',       icon: 'Shield',   description: '+1 secure storage slot' },
  PortalWalker:     { label: 'Portal Walker',      icon: 'Layers',   description: 'Instant environment switching' },
  EnchantmentAdept: { label: 'Enchantment Adept',  icon: 'Sparkles', description: '+1 enchantment slot' },
  GuildCommander:   { label: 'Guild Commander',    icon: 'Crown',    description: '+2 clan member slots' },
};

// ── Helper: Check if a feature is globally unlocked ──
export function isFeatureUnlocked(featureId, globalHubLevel) {
  const unlock = GLOBAL_HUB_UNLOCKS.find(u => u.featureId === featureId);
  if (!unlock) return false;
  return globalHubLevel >= unlock.level;
}

// ── Helper: Check if environment can be imprinted ──
export function canImprint(rarity, envRank) {
  const config = RARITY_CONFIG[rarity];
  if (!config) return false;
  return config.imprintable && envRank >= config.maxRank;
}