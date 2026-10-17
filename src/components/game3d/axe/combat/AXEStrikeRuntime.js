// Every hit in the world, through the one resolution (axeStrikeOutcomes in AXEPowerBudget;
// docs/game3d/BUILD_BALANCE.md): the hero's swing at an enemy, a rogue or a boss, and their
// swings at the hero. The build effects are already on both sheets; this adds what is true
// only for this swing: temporary buffs, a momentum chain, a forced critical, execute.
//
// Before this, GameWorld3D multiplied five damage buffs on top of the hit, rolled a second and
// a third crit (shop buff, weapon mastery), had an instant-kill proc, and ran four extra dodge
// rolls, a reflect roll and the mastery's own dodge, block, deflect and reduction on incoming
// hits, none of them capped together.
import { axeStrikeOutcomes, rollAXEStrike, AXE_COMBAT_RULES } from '../balance/AXEPowerBudget';
import { consumeForcedCriticalHit } from '../../combat/forcedCriticalBridge';
import { consumeAXEPowerCharge, consumeFocusHit, getBuffs, isBuffActive } from '../../skills/buffEngine';
import { consumeShopCritBuff, consumeShopDamageBuff, getShopBuffSnapshot } from '../../shop/shopEffectsBridge';

// all temporary bonuses on one swing (Focus, Power Charge, a shop elixir, a momentum chain) together
export const AXE_TEMPORARY_BONUS_CAP = 2;
const MOMENTUM_WINDOW_MS = 2500;
const MOMENTUM_MAX_PCT = 25; // a bow's five on-hit stacks
// a finishing blow (Brutal Force's Lethal Blow) works on ordinary enemies only
const FINISHABLE_TIERS = new Set(['normal', 'champion']);
// situational class bonuses: a weak-spot hit is a hit from this far (Sniper), and a hit from
// stealth is the first after this long out of combat (Shadow Ranger)
export const AXE_WEAKSPOT_RANGE_M = 10;
export const AXE_STEALTH_AFTER_MS = 5000;
let lastCombatAt = 0;
const markCombat = () => { lastCombatAt = Date.now(); };

const n = (v) => Number(v) || 0;
const momentum = { count: 0, lastAt: 0 };

function peekTemporaryBonus(hero) {
  const buffs = getBuffs() || {};
  const focus = isBuffActive('focus') && n(buffs.focus?.hitsRemaining) > 0 ? 1 + n(buffs.focus?.values?.damage_bonus_pct) : 1;
  const charge = isBuffActive('axe_power_charge') ? Math.max(1, n(buffs.axe_power_charge?.values?.next_hit_multiplier) || 1) : 1;
  const shop = getShopBuffSnapshot();
  const elixir = n(shop?.damage?.stacks) > 0 ? Math.max(1, n(shop.damage.mult) || 1) : 1;
  const now = Date.now();
  const chain = now - momentum.lastAt <= MOMENTUM_WINDOW_MS ? momentum.count : 0;
  const combo = 1 + Math.min(MOMENTUM_MAX_PCT, n(hero.comboPctPerHit) * chain) / 100;
  // temporary crit chance: Decisive Blow and a shop crit elixir, inside the crit cap
  const critBonus = (isBuffActive('decisive_blow') ? n(buffs.decisive_blow?.values?.crit_chance_flat) : 0)
    + (n(shop?.crit?.stacks) > 0 ? n(shop.crit.pct) : 0);
  return {
    multiplier: Math.min(AXE_TEMPORARY_BONUS_CAP, focus * charge * elixir * combo),
    critBonus,
    consume: () => {
      if (focus > 1) consumeFocusHit();
      if (charge > 1) consumeAXEPowerCharge();
      if (elixir > 1) consumeShopDamageBuff();
      if (n(shop?.crit?.stacks) > 0) consumeShopCritBuff();
    },
    charged: charge > 1,
  };
}

function landMomentum() {
  const now = Date.now();
  momentum.count = now - momentum.lastAt <= MOMENTUM_WINDOW_MS ? momentum.count + 1 : 1;
  momentum.lastAt = now;
}

export function resetAXEMomentum() {
  momentum.count = 0;
  momentum.lastAt = 0;
}

// The hero's swing. target: the enemy's derived stats (with level), plus its hp / maxHp / tier.
// A miss or a dodge spends no buff and no forced critical.
export function resolveAXEHeroStrike(hero, target, {
  skillMultiplier = 1, targetHp = null, targetMaxHp = null, tier = null, pve = true, distance = null, roll = Math.random(),
} = {}) {
  const temp = peekTemporaryBonus(hero);
  const far = Number.isFinite(Number(distance)) ? Number(distance) : 0;
  const fromStealth = Date.now() - lastCombatAt >= AXE_STEALTH_AFTER_MS;
  // the class's situational bonuses (sheet fields, each capped), inside the temporary cap
  const situational = (1 + (temp.charged ? n(hero.chargeDamagePct) : 0) / 100)
    * (1 + (far >= AXE_WEAKSPOT_RANGE_M ? n(hero.weakspotDamagePct) : 0) / 100)
    * (1 + (fromStealth ? n(hero.stealthDamagePct) : 0) / 100);
  const rangeCrit = n(hero.rangeUnit) > 0 && far > n(hero.rangeUnit) ? n(hero.rangeCritPct) : 0;
  const attacker = { ...hero, critChance: Math.min(AXE_COMBAT_RULES.critChanceCapPct, n(hero.critChance) + temp.critBonus + rangeCrit) };
  const targetHpPct = targetMaxHp ? Math.max(0, n(targetHp) / Math.max(1, n(targetMaxHp))) : 1;
  const forcedCritical = consumeForcedCriticalHit();
  const strike = rollAXEStrike(axeStrikeOutcomes(attacker, target, {
    skillMultiplier, isSkill: skillMultiplier !== 1, bonusMultiplier: Math.min(AXE_TEMPORARY_BONUS_CAP, temp.multiplier * situational), targetHpPct, forcedCritical,
  }), roll);
  markCombat();
  if (strike.kind !== 'hit') return { ...strike, lethal: false, charged: false };
  temp.consume();
  landMomentum();
  // Lethal Blow: a finishing blow on ordinary enemies, never on bosses or players
  const lethal = pve && FINISHABLE_TIERS.has(String(tier || target?.tier || '')) && Math.random() * 100 < n(hero.lethalBlowPct);
  return { ...strike, damage: lethal ? Math.max(strike.damage, Math.ceil(n(targetHp))) : strike.damage, lethal, charged: temp.charged };
}

// A swing at the hero. God's Deflection makes crits rarer and softer and Heaven's Riposte
// turns hits back, inside the same crit-defense and deflect caps as every other source.
export function resolveAXEStrikeOnHero(enemy, hero, { fromBoss = false, bossReductionPct = 0, roll = Math.random() } = {}) {
  const buffs = getBuffs() || {};
  const deflection = isBuffActive('gods_deflection') ? buffs.gods_deflection?.values || {} : {};
  const riposte = isBuffActive('heavens_riposte') ? n(buffs.heavens_riposte?.values?.reflect_chance) * 100 : 0;
  const defender = {
    ...hero,
    critChanceReductionPct: n(hero.critChanceReductionPct) + n(deflection.crit_resist_pct) * 100,
    criticalDefense: n(hero.criticalDefense) + n(deflection.crit_damage_reduction_pct),
    deflectPct: n(hero.deflectPct) + riposte,
    damageReductionPct: n(hero.damageReductionPct) + (fromBoss ? n(bossReductionPct) : 0),
  };
  markCombat();
  return rollAXEStrike(axeStrikeOutcomes(enemy, defender), roll);
}

// Swings per second scale with attack speed (negative for slow, heavy specializations).
export function getAXEAttackSpeedMult(hero) {
  return Math.max(0.25, 1 + n(hero?.attackSpeedPct) / 100);
}
