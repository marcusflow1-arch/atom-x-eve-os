import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { normalizedCardBaseStats, effectiveCardStats } from '../../shared/cardStats.ts';
import { loadCombatProfile } from '../../shared/combatProfile.ts';
import { abilityOutput } from '../../shared/combatStats.ts';
import { skillStats } from '../../shared/pvpSkills.ts';
import { hasLivePvpMatch } from '../../shared/matchLock.ts';
import {
  addStats, ASCENSION_CAP, CARD_SYSTEM_VERSION, cardMasteryState, cycleStatGain,
  ENHANCEMENT_CAP, enhancementMaterialValue, normalizeProgression, STACK_CAP,
} from '../../shared/cardSystem.ts';
import {
  appendProvenanceEvent, ensureCardPassport, publicPassport,
  recordAscensionMilestone, recordStackMilestone,
} from '../../shared/cardProvenance.ts';

type AnyObj = Record<string, any>;
const json = (body: unknown, status = 200) => Response.json(body, { status });
const fail = (message: string, status = 400) => { throw Object.assign(new Error(message), { status }); };
const now = () => new Date().toISOString();

function progressionPatch(p: AnyObj) {
  const normalized = normalizeProgression(p);
  return {
    system_version: CARD_SYSTEM_VERSION,
    enhancement_percent: normalized.enhancement_percent,
    ascension: normalized.ascension,
    stack_level: normalized.stack_level,
    permanent_stats: normalized.permanent_stats,
    current_cycle_stats: normalized.current_cycle_stats,
    migration_power_multiplier: normalized.migration_power_multiplier,
    mastery_visual: normalized.mastery_visual,
    migrated_from_legacy: normalized.migrated_from_legacy,
  };
}

function publicProgression(p: AnyObj) {
  const normalized = normalizeProgression(p);
  const effective = effectiveCardStats(normalized);
  return {
    ...normalized,
    power_score: effective.power_score,
    effective_stats: effective.stats,
    growth_multiplier: effective.growth_multiplier,
    stat_multiplier: effective.stat_multiplier,
    mastery: cardMasteryState(normalized),
  };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || 'getState');
    const payload = body?.payload || {};
    const supported = new Set(['getState', 'enhance', 'ascend', 'stack', 'combine']);
    const retired = new Set(['train', 'levelUp', 'enchant', 'overEnchant', 'unlockSkill', 'togglePerk']);
    if (retired.has(action)) return json({
      error: 'This upgrade path was retired by Card System v2. Use Enhance, Ascend, or Stack.',
      retired_action: action,
    }, 409);
    if (!supported.has(action)) return json({ error: 'Invalid card progression action' }, 400);

    const svc = base44.asServiceRole.entities;
    if (action !== 'getState' && await hasLivePvpMatch(svc, user.id)) {
      return json({ error: 'Finish your match before changing card progression.' }, 409);
    }

    const userCardId = String(body?.userCardId || payload?.userCardId || '').trim();
    const requestedAchievementId = String(body?.achievementId || payload?.achievementId || '').trim();
    let userCard: AnyObj | null = null;

    if (userCardId) {
      userCard = await svc.UserCard.get(userCardId).catch(() => null);
      if (!userCard || String(userCard.user_id) !== String(user.id)) return json({ error: 'Card not found in your collection.' }, 404);
    } else if (requestedAchievementId) {
      const owned = await svc.UserCard.filter({ user_id: user.id, achievement_id: requestedAchievementId }, '-created_date', 10);
      userCard = (owned || []).find((row: AnyObj) => Number(row.quantity ?? 1) > 0) || null;
      if (!userCard) {
        const achievement = await svc.Achievement.get(requestedAchievementId).catch(() => null);
        if (achievement?.card_id) {
          const linked = await svc.UserCard.filter({ user_id: user.id, trading_card_id: achievement.card_id }, '-created_date', 10);
          userCard = (linked || []).find((row: AnyObj) => Number(row.quantity ?? 1) > 0) || null;
        }
      }
    }
    if (!userCard) return json({ error: 'You must own this card before upgrading it.' }, 403);
    if (Number(userCard.quantity ?? 1) < 1) return json({ error: 'This card is no longer available in your collection.' }, 409);
    if (action !== 'getState' && userCard.trade_status === 'locked_in_trade') return json({ error: 'This card is locked in a trade.' }, 409);

    const definition = userCard.trading_card_id ? await svc.TradingCard.get(String(userCard.trading_card_id)).catch(() => null) : null;
    if (userCard.trading_card_id && !definition) return json({ error: 'Card definition is unavailable.' }, 409);
    const achievementId = String(userCard.achievement_id || definition?.achievement_id || requestedAchievementId || '');
    const achievement = achievementId ? await svc.Achievement.get(achievementId).catch(() => null) : null;
    const baseStats = normalizedCardBaseStats(userCard, achievement || {}, definition);

    let rows = await svc.CardProgression.filter({ user_id: user.id, user_card_id: userCard.id }, '-updated_date', 2);
    if ((rows || []).length > 1) return json({ error: 'Multiple progression records exist for this card and must be reconciled.' }, 409);
    let progression: AnyObj = rows?.[0] || null;

    if (!progression) {
      progression = await svc.CardProgression.create({
        user_id: user.id,
        user_card_id: userCard.id,
        trading_card_id: userCard.trading_card_id || '',
        achievement_id: achievementId,
        card_name: userCard.card_name || definition?.name || 'Card',
        game_id: userCard.game_id || definition?.game_id || achievement?.game_id || '',
        game_name: userCard.game_name || achievement?.game || '',
        system_version: CARD_SYSTEM_VERSION,
        enhancement_percent: 0,
        ascension: 0,
        stack_level: 1,
        permanent_stats: {},
        current_cycle_stats: {},
        base_stats: baseStats,
        migration_power_multiplier: 1,
        migrated_from_legacy: false,
        mastery_visual: 'standard',
        power_score: effectiveCardStats({ base_stats: baseStats, system_version: CARD_SYSTEM_VERSION }).power_score,
        level: 1,
        stage: 1,
        stars: 1,
        last_action: 'created_v2',
        last_action_at: now(),
        revision: 1,
      });
      await svc.CardProgressionEvent.create({
        user_id: user.id, user_card_id: userCard.id, progression_id: progression.id,
        event_type: 'created_v2', summary: 'Card System v2 progression initialized', before: {}, after: publicProgression(progression), metadata: {},
      });
    } else if (Number(progression.system_version || 0) < CARD_SYSTEM_VERSION) {
      const before = { ...progression };
      const patch = progressionPatch(progression);
      const preview = { ...progression, ...patch, base_stats: progression.base_stats && Object.keys(progression.base_stats).length ? progression.base_stats : baseStats };
      patch.base_stats = preview.base_stats;
      patch.power_score = effectiveCardStats(preview).power_score;
      patch.last_action = 'migrated_to_v2';
      patch.last_action_at = now();
      patch.revision = Number(progression.revision || 0) + 1;
      progression = await svc.CardProgression.update(progression.id, patch);
      await svc.CardProgressionEvent.create({
        user_id: user.id, user_card_id: userCard.id, progression_id: progression.id,
        event_type: 'migrated_to_v2', summary: 'Legacy card investment preserved in Card System v2', before, after: publicProgression(progression), metadata: { legacy_preserved: true },
      });
    }

    let passport = await ensureCardPassport(svc, userCard, { card_name: userCard.card_name || definition?.name });
    if (String(progression.passport_id || '') !== String(passport.passport_id)) {
      progression = await svc.CardProgression.update(progression.id, { passport_id: passport.passport_id });
    }
    if (String(userCard.passport_id || '') !== String(passport.passport_id)) {
      userCard = await svc.UserCard.update(userCard.id, { passport_id: passport.passport_id });
    }

    const record = async (eventType: string, before: AnyObj, after: AnyObj, summary: string, metadata: AnyObj = {}) => {
      await svc.CardProgressionEvent.create({
        user_id: user.id, user_card_id: userCard.id, progression_id: progression.id,
        event_type: eventType, summary, before, after, metadata,
      });
    };

    const commit = async (patch: AnyObj, eventType: string, summary: string, metadata: AnyObj = {}) => {
      const before = publicProgression(progression);
      const next = normalizeProgression({ ...progression, ...patch });
      const calculated = effectiveCardStats(next, baseStats);
      progression = await svc.CardProgression.update(progression.id, {
        ...patch,
        system_version: CARD_SYSTEM_VERSION,
        power_score: calculated.power_score,
        last_action: eventType,
        last_action_at: now(),
        revision: Number(progression.revision || 0) + 1,
      });
      await record(eventType, before, publicProgression(progression), summary, metadata);
      return progression;
    };

    const materialState = async () => {
      const [stacks, definitions] = await Promise.all([
        svc.UserMaterial.filter({ user_id: user.id }, '-updated_date', 500),
        svc.Material.list('name', 500),
      ]);
      const byId = new Map((definitions || []).map((row: AnyObj) => [String(row.id), row]));
      return (stacks || []).map((stack: AnyObj) => {
        const material = byId.get(String(stack.material_id)) || null;
        return {
          ...stack,
          definition: material,
          enhancement_value: material ? enhancementMaterialValue(material) : 0,
          can_enhance: Boolean(material && enhancementMaterialValue(material) > 0 && Number(stack.quantity || 0) > 0),
        };
      });
    };

    const duplicatesState = async () => {
      if (!userCard.trading_card_id) return [];
      const copies = await svc.UserCard.filter({ user_id: user.id, trading_card_id: userCard.trading_card_id }, 'created_date', 100);
      return (copies || []).filter((card: AnyObj) =>
        String(card.id) !== String(userCard.id)
        && Number(card.quantity ?? 1) > 0
        && card.trade_status !== 'locked_in_trade'
        && !card.is_equipped
        && String(card.card_rarity || '') === String(userCard.card_rarity || ''),
      ).map((card: AnyObj) => ({
        id: card.id,
        card_name: card.card_name,
        card_rarity: card.card_rarity,
        card_image: card.card_image || '',
        acquired_at: card.acquired_at || card.unlocked_date || '',
      }));
    };

    if (action === 'enhance') {
      const state = normalizeProgression(progression);
      if (state.ascension >= ASCENSION_CAP) fail('This card has completed all five Ascensions.', 409);
      if (state.enhancement_percent >= ENHANCEMENT_CAP) fail('Enhancement is already at 120%. Ascend the card to continue.', 409);
      const stackId = String(payload.userMaterialId || payload.user_material_id || '').trim();
      if (!stackId) fail('Choose an enhancement material.');
      const stack = await svc.UserMaterial.get(stackId).catch(() => null);
      if (!stack || String(stack.user_id) !== String(user.id)) fail('Enhancement material not found.', 404);
      const material = await svc.Material.get(String(stack.material_id || '')).catch(() => null);
      if (!material) fail('Enhancement material definition is unavailable.', 409);
      const value = enhancementMaterialValue(material);
      if (value <= 0) fail('That material cannot enhance cards.', 409);
      const requested = Math.max(1, Math.min(100, Math.floor(Number(payload.quantity || 1))));
      const available = Math.max(0, Math.floor(Number(stack.quantity || 0)));
      if (available < requested) fail(`You only have ${available} of that material.`, 409);
      const remaining = ENHANCEMENT_CAP - state.enhancement_percent;
      const neededCount = Math.max(1, Math.ceil(remaining / value));
      const consume = Math.min(requested, neededCount);
      const rawGain = consume * value;
      const applied = Math.min(remaining, rawGain);
      const waste = Math.max(0, rawGain - applied);
      const cycleGain = cycleStatGain(progression.base_stats || baseStats, applied);
      await svc.UserMaterial.update(stack.id, { quantity: available - consume });
      progression = await commit({
        enhancement_percent: state.enhancement_percent + applied,
        current_cycle_stats: addStats(state.current_cycle_stats, cycleGain),
      }, 'enhance', `Enhancement increased by ${applied}%`, {
        user_material_id: stack.id, material_id: material.id, material_name: material.name,
        rarity: material.rarity, quantity: consume, enhancement_value_each: value, applied_percent: applied, overflow_wasted: waste,
      });
      passport = await ensureCardPassport(svc, userCard);
      await appendProvenanceEvent(svc, passport, 'enhancement', {
        enhancement_percent: normalizeProgression(progression).enhancement_percent,
        applied_percent: applied,
        material_name: material.name,
        material_rarity: material.rarity,
      });
    } else if (action === 'ascend') {
      const state = normalizeProgression(progression);
      if (state.ascension >= ASCENSION_CAP) fail('This card is already at Ascension 5.', 409);
      if (state.enhancement_percent < ENHANCEMENT_CAP) fail(`Enhance this card to 120% before Ascending. Current: ${state.enhancement_percent}%.`, 409);
      const nextAscension = state.ascension + 1;
      progression = await commit({
        enhancement_percent: 0,
        ascension: nextAscension,
        permanent_stats: addStats(state.permanent_stats, state.current_cycle_stats),
        current_cycle_stats: {},
        mastery_visual: nextAscension >= ASCENSION_CAP ? 'holographic_3d' : 'standard',
      }, 'ascend', `Card reached Ascension ${nextAscension}`, {
        ascension: nextAscension,
        stats_preserved: true,
        mastery_unlocked: nextAscension >= ASCENSION_CAP,
      });
      passport = await recordAscensionMilestone(svc, userCard, publicProgression(progression), nextAscension);
    } else if (action === 'stack' || action === 'combine') {
      const state = normalizeProgression(progression);
      if (state.stack_level >= STACK_CAP) fail('This card is already at Stack Level 4.', 409);
      const duplicateId = String(payload.duplicateUserCardId || payload.sacrificeUserCardId || (Array.isArray(payload.sacrificeUserCardIds) ? payload.sacrificeUserCardIds[0] : '') || '').trim();
      let duplicate: AnyObj | null = null;
      let legacyQuantity = false;
      if (duplicateId) {
        duplicate = await svc.UserCard.get(duplicateId).catch(() => null);
        if (!duplicate || String(duplicate.user_id) !== String(user.id)) fail('Duplicate card not found.', 404);
        if (String(duplicate.id) === String(userCard.id)) fail('A card cannot stack into itself.');
        if (!userCard.trading_card_id || String(duplicate.trading_card_id || '') !== String(userCard.trading_card_id)) fail('Stacking requires an exact duplicate card.');
        if (String(duplicate.card_rarity || '') !== String(userCard.card_rarity || '')) fail('Stacking requires the same card tier.');
        if (duplicate.is_equipped || duplicate.equipped_to !== 'none' && duplicate.equipped_to) fail('Unequip the duplicate before stacking it.', 409);
        if (duplicate.trade_status === 'locked_in_trade') fail('That duplicate is locked in a trade.', 409);
        if (duplicate.starter_grant_user_id) fail('Starter cards cannot be consumed by stacking.', 409);
      } else if (Number(userCard.quantity || 1) > 1) {
        legacyQuantity = true;
      } else {
        fail('Choose a duplicate copy of this card to Stack.');
      }

      const nextStack = state.stack_level + 1;
      if (legacyQuantity) {
        await svc.UserCard.update(userCard.id, { quantity: Number(userCard.quantity || 1) - 1 });
      } else if (duplicate) {
        passport = await recordStackMilestone(svc, userCard, { ...publicProgression(progression), stack_level: nextStack }, duplicate);
        const duplicateProgress = await svc.CardProgression.filter({ user_card_id: duplicate.id }, '-updated_date', 10).catch(() => []);
        for (const row of duplicateProgress || []) await svc.CardProgression.delete(row.id);
        await svc.UserCard.delete(duplicate.id);
      }
      progression = await commit({
        stack_level: nextStack,
        stage: nextStack,
        stars: Math.min(5, nextStack),
      }, 'stack', `Card reached Stack Level ${nextStack}`, {
        duplicate_user_card_id: duplicate?.id || '',
        legacy_quantity_consumed: legacyQuantity,
      });
      if (legacyQuantity) {
        passport = await ensureCardPassport(svc, userCard);
        await appendProvenanceEvent(svc, passport, 'stack_upgrade', { stack_level: nextStack, legacy_quantity_consumed: true });
      }
    }

    progression = await svc.CardProgression.get(progression.id);
    userCard = await svc.UserCard.get(userCard.id);
    passport = await ensureCardPassport(svc, userCard);
    const avatar = await loadCombatProfile(svc, user.id);
    const effective = effectiveCardStats(progression, baseStats);
    const effect = userCard.animation_effect || definition?.animation_effect || {};
    const skill = skillStats(String(effect.id || ''), userCard.card_rarity || definition?.rarity || 'Rare');
    const combatPreview = String(userCard.card_type || definition?.card_type || '').toLowerCase() === 'ability'
      ? abilityOutput(avatar.combat, { ...skill, base_damage: Number(effect.base_damage || skill.base_damage), cooldown_ms: Number(effect.cooldown_ms || skill.cooldown_ms) }, effective)
      : null;
    const [materials, duplicates, events, passportPublic] = await Promise.all([
      materialState(),
      duplicatesState(),
      svc.CardProgressionEvent.filter({ user_card_id: userCard.id }, '-created_date', 100),
      publicPassport(svc, userCard),
    ]);

    return json({
      success: true,
      system_version: CARD_SYSTEM_VERSION,
      progression: publicProgression(progression),
      mastery: cardMasteryState(progression),
      userCard,
      definition,
      achievement,
      materials,
      duplicates,
      passport: passportPublic,
      events,
      combat_preview: combatPreview,
      avatar_level: avatar.combat.level,
      retired_actions: ['train', 'levelUp', 'enchant', 'overEnchant', 'unlockSkill', 'togglePerk'],
      compatibility: { combine_aliases_to_stack: true, legacy_power_preserved: true },
      skill_tree: [],
      enchantments: [],
    });
  } catch (error: any) {
    console.error('cardProgression failed', error);
    return json({ error: error?.message || String(error) }, Number(error?.status || 400));
  }
});
