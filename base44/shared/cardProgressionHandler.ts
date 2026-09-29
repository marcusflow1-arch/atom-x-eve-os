import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { normalizedCardBaseStats, effectiveCardStats } from './cardStats.ts';
import { loadCombatProfile } from './combatProfile.ts';
import { abilityOutput } from './combatStats.ts';
import { skillStats } from './pvpSkills.ts';
import { hasLivePvpMatch } from './matchLock.ts';
import {
  addStats, ASCENSION_CAP, CARD_SYSTEM_VERSION, cardMasteryState, cycleStatGain,
  ENHANCEMENT_CAP, enhancementMaterialValue, normalizeProgression, STACK_CAP,
} from './cardSystem.ts';
import {
  appendProvenanceEvent, ensureCardPassport, publicPassport,
  recordAscensionMilestone, recordStackMilestone,
} from './cardProvenance.ts';
import {
  acquireCardMutationLock, acquireCardMutationLocks, releaseCardMutationLocks,
} from './cardMutationLock.ts';
import { applyCardMaterialSpend, hasCardMaterialReceipt } from './cardMaterialSettlement.ts';
import { conditionalUpdate, rewardError } from './rewardJournal.ts';

type AnyObj = Record<string, any>;
type Lock = { card_id: string; token: string; kind: string; expires_at: string };

const json = (body: unknown, status = 200) => Response.json(body, { status });
const fail = (message: string, status = 400) => { throw Object.assign(new Error(message), { status }); };
const now = () => new Date().toISOString();
const object = (value: any) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

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

function mutationRequestId(body: AnyObj, payload: AnyObj, action: string) {
  if (action === 'getState') return '';
  const supplied = String(
    body?.request_id || body?.requestId || payload?.request_id || payload?.requestId || '',
  ).trim();
  return supplied || `server-${crypto.randomUUID()}`;
}

export function serveCardProgression() {
  Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    let svc: any = null;
    let heldLocks: Lock[] = [];
    try {
      const user = await base44.auth.me();
      if (!user) return json({ error: 'Unauthorized' }, 401);

      const body = await req.json().catch(() => ({}));
      const rawAction = String(body?.action || 'getState');
      const action = rawAction === 'combine' ? 'stack' : rawAction;
      const payload = object(body?.payload);
      const supported = new Set(['getState', 'enhance', 'ascend', 'stack']);
      const retired = new Set(['train', 'levelUp', 'enchant', 'overEnchant', 'unlockSkill', 'togglePerk']);
      if (retired.has(rawAction)) return json({
        error: 'This upgrade path was retired by Card System v2. Use Enhance, Ascend, or Stack.',
        retired_action: rawAction,
      }, 409);
      if (!supported.has(action)) return json({ error: 'Invalid card progression action' }, 400);

      svc = base44.asServiceRole.entities;
      if (action !== 'getState' && await hasLivePvpMatch(svc, user.id)) {
        return json({ error: 'Finish your match before changing card progression.' }, 409);
      }

      const requestId = mutationRequestId(body, payload, action);
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

      const requestedDuplicateId = action === 'stack'
        ? String(
          payload.duplicateUserCardId || payload.sacrificeUserCardId
          || (Array.isArray(payload.sacrificeUserCardIds) ? payload.sacrificeUserCardIds[0] : '') || '',
        ).trim()
        : '';
      if (requestedDuplicateId && requestedDuplicateId === String(userCard.id)) fail('A card cannot stack into itself.');

      if (requestedDuplicateId) {
        const candidate = await svc.UserCard.get(requestedDuplicateId).catch(() => null);
        if (!candidate || String(candidate.user_id) !== String(user.id)) fail('Duplicate card not found.', 404);
        heldLocks = await acquireCardMutationLocks(svc, [
          { id: String(userCard.id), owner_id: String(user.id) },
          { id: requestedDuplicateId, owner_id: String(user.id) },
        ], `progression:${action}`);
      } else {
        heldLocks = [await acquireCardMutationLock(
          svc,
          String(userCard.id),
          String(user.id),
          action === 'getState' ? 'progression:read-repair' : `progression:${action}`,
        )];
      }

      const lockFor = (cardId: string) => heldLocks.find((lock) => lock.card_id === String(cardId)) || null;
      const targetLock = lockFor(String(userCard.id));
      if (!targetLock) throw rewardError('Card mutation lease is unavailable', 409);

      const ensureExtraLock = async (cardId: string, ownerId: string, kind: string) => {
        const existing = lockFor(cardId);
        if (existing) return existing;
        const lock = await acquireCardMutationLock(svc, cardId, ownerId, kind);
        heldLocks.push(lock);
        return lock;
      };

      userCard = await svc.UserCard.get(String(userCard.id)).catch(() => null);
      if (!userCard || String(userCard.user_id) !== String(user.id)) return json({ error: 'Card ownership changed. Reload your collection.' }, 409);
      if (Number(userCard.quantity ?? 1) < 1) return json({ error: 'This card is no longer available in your collection.' }, 409);
      if (action !== 'getState' && userCard.trade_status === 'locked_in_trade') return json({ error: 'This card is locked in a trade.' }, 409);

      const definition = userCard.trading_card_id
        ? await svc.TradingCard.get(String(userCard.trading_card_id)).catch(() => null)
        : null;
      if (userCard.trading_card_id && !definition) return json({ error: 'Card definition is unavailable.' }, 409);
      const achievementId = String(userCard.achievement_id || definition?.achievement_id || requestedAchievementId || '');
      const achievement = achievementId ? await svc.Achievement.get(achievementId).catch(() => null) : null;
      const baseStats = normalizedCardBaseStats(userCard, achievement || {}, definition);

      let rows = await svc.CardProgression.filter({ user_id: user.id, user_card_id: userCard.id }, '-updated_date', 2);
      if ((rows || []).length > 1) return json({ error: 'Multiple progression records exist for this card and must be reconciled.' }, 409);
      let progression: AnyObj = rows?.[0] || null;

      const findProgressionEvent = async (progressionId: string, key: string) => {
        if (!key) return null;
        const matches = await svc.CardProgressionEvent.filter({ progression_id: progressionId, request_id: key }, '-created_date', 2).catch(() => []);
        if ((matches || []).length > 1) throw rewardError('Duplicate progression events require reconciliation', 409);
        return matches?.[0] || null;
      };

      const recordProgressionEvent = async (
        eventType: string, before: AnyObj, after: AnyObj, summary: string, metadata: AnyObj = {}, key = '',
      ) => {
        const existing = await findProgressionEvent(String(progression.id), key);
        if (existing) {
          if (String(existing.event_type || '') !== eventType) throw rewardError('A progression request id was reused for a different action', 409);
          return existing;
        }
        return svc.CardProgressionEvent.create({
          user_id: user.id,
          user_card_id: userCard.id,
          progression_id: progression.id,
          request_id: key,
          event_type: eventType,
          summary,
          before,
          after,
          metadata,
        });
      };

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
          pending_mutation: {},
          pending_provenance: {},
        });
        await recordProgressionEvent(
          'created_v2', {}, publicProgression(progression),
          'Card System v2 progression initialized', {}, `init:${userCard.id}:v2`,
        );
      } else if (Number(progression.system_version || 0) < CARD_SYSTEM_VERSION) {
        const before = { ...progression };
        const patch: AnyObj = progressionPatch(progression);
        const preview = {
          ...progression,
          ...patch,
          base_stats: progression.base_stats && Object.keys(progression.base_stats).length ? progression.base_stats : baseStats,
        };
        patch.base_stats = preview.base_stats;
        patch.power_score = effectiveCardStats(preview).power_score;
        patch.last_action = 'migrated_to_v2';
        patch.last_action_at = now();
        patch.revision = Number(progression.revision || 0) + 1;
        patch.pending_mutation = {};
        patch.pending_provenance = {};
        progression = await svc.CardProgression.update(progression.id, patch);
        await recordProgressionEvent(
          'migrated_to_v2', before, publicProgression(progression),
          'Legacy card investment preserved in Card System v2',
          { legacy_preserved: true }, `migrate:${userCard.id}:v2`,
        );
      }

      let passport = await ensureCardPassport(svc, userCard, {
        card_name: userCard.card_name || definition?.name,
        lock_token: targetLock.token,
      });
      if (String(progression.passport_id || '') !== String(passport.passport_id)) {
        progression = await svc.CardProgression.update(progression.id, { passport_id: passport.passport_id });
      }
      if (String(userCard.passport_id || '') !== String(passport.passport_id)) {
        userCard = await svc.UserCard.update(userCard.id, { passport_id: passport.passport_id });
      }

      const setPendingMutation = async (descriptor: AnyObj) => {
        const livePending = object(progression.pending_mutation);
        if (livePending.request_id && String(livePending.request_id) !== String(descriptor.request_id)) {
          throw rewardError('A previous card mutation still needs recovery before another can begin', 409);
        }
        progression = await svc.CardProgression.update(progression.id, { pending_mutation: descriptor });
      };

      const clearPendingMutation = async () => {
        progression = await svc.CardProgression.update(progression.id, { pending_mutation: {}, pending_provenance: {} });
      };

      const debitLegacyQuantity = async (beforeQuantity: number, afterQuantity: number) => {
        const applied = await conditionalUpdate(svc.UserCard, {
          id: String(userCard.id),
          user_id: String(user.id),
          mutation_lock_id: targetLock.token,
          quantity: beforeQuantity,
        }, {
          $set: { quantity: afterQuantity },
        });
        if (applied) {
          userCard = await svc.UserCard.get(String(userCard.id));
          return;
        }
        const live = await svc.UserCard.get(String(userCard.id)).catch(() => null);
        if (live && String(live.mutation_lock_id || '') === targetLock.token && Number(live.quantity || 0) === afterQuantity) {
          userCard = live;
          return;
        }
        throw rewardError('Legacy card quantity changed while Stack was being completed. Reload and retry.', 409);
      };

      const provenanceEvent = async (passportId: string, eventKey: string) => {
        if (!eventKey) return null;
        const matches = await svc.CardProvenanceEvent.filter({ passport_id: passportId, event_key: eventKey }, '-created_date', 2).catch(() => []);
        if ((matches || []).length > 1) throw rewardError('Duplicate provenance events require reconciliation', 409);
        return matches?.[0] || null;
      };

      const commitPendingProgression = async (descriptor: AnyObj) => {
        const key = String(descriptor.request_id || '');
        const eventType = String(descriptor.action || '');
        if (String(progression.last_request_id || '') === key) {
          if (String(progression.last_request_action || '') !== eventType) throw rewardError('A progression request id was reused for a different action', 409);
          return;
        }
        const patch = object(descriptor.progression_patch);
        const before = publicProgression(progression);
        const calculated = effectiveCardStats(normalizeProgression({ ...progression, ...patch }), baseStats);
        const revision = Number(progression.revision || 0);
        const cleanup = object(descriptor.stack_cleanup);
        const updated = await conditionalUpdate(svc.CardProgression, {
          id: progression.id,
          user_id: user.id,
          revision,
        }, {
          $set: {
            ...patch,
            system_version: CARD_SYSTEM_VERSION,
            power_score: calculated.power_score,
            last_action: eventType,
            last_action_at: now(),
            revision: revision + 1,
            last_request_id: key,
            last_request_action: eventType,
            pending_provenance: object(descriptor.provenance),
            last_stack_consumed_card_id: cleanup.kind === 'duplicate' ? String(cleanup.duplicate_id || '') : '',
            last_stack_cleanup_pending: eventType === 'stack',
            last_stack_legacy_quantity: cleanup.kind === 'legacy_quantity',
          },
        });
        if (!updated) {
          const live = await svc.CardProgression.get(progression.id);
          if (String(live.last_request_id || '') !== key || String(live.last_request_action || '') !== eventType) {
            throw rewardError('Card progression changed while this mutation was being committed', 409);
          }
          progression = live;
        } else {
          progression = await svc.CardProgression.get(progression.id);
        }
        await recordProgressionEvent(
          eventType,
          before,
          publicProgression(progression),
          String(descriptor.summary || `Card ${eventType} completed`),
          object(descriptor.metadata),
          key,
        );
      };

      const finishPendingProvenance = async (descriptor: AnyObj) => {
        const pending = object(descriptor.provenance || progression.pending_provenance);
        if (!pending.kind || !pending.event_key) return;
        passport = await ensureCardPassport(svc, userCard, { lock_token: targetLock.token });
        const existing = await provenanceEvent(passport.passport_id, String(pending.event_key));

        if (pending.kind === 'enhancement') {
          if (!existing) await appendProvenanceEvent(svc, passport, 'enhancement', object(pending.payload), {
            lock_token: targetLock.token,
            event_key: String(pending.event_key),
          });
        } else if (pending.kind === 'ascension') {
          if (!existing) await recordAscensionMilestone(
            svc,
            userCard,
            publicProgression(progression),
            Number(pending.ascension || normalizeProgression(progression).ascension),
            { lock_token: targetLock.token, event_key: String(pending.event_key) },
          );
        } else if (pending.kind === 'stack_legacy') {
          if (!existing) await appendProvenanceEvent(svc, passport, 'stack_upgrade', object(pending.payload), {
            lock_token: targetLock.token,
            event_key: String(pending.event_key),
          });
        } else if (pending.kind === 'stack_duplicate') {
          const duplicateId = String(pending.duplicate_id || '');
          let duplicate = duplicateId ? await svc.UserCard.get(duplicateId).catch(() => null) : null;
          const consumedPassports = duplicateId
            ? await svc.CardPassport.filter({ user_card_id: duplicateId }, '-created_date', 2).catch(() => [])
            : [];
          if ((consumedPassports || []).length > 1) throw rewardError('Duplicate consumed-card passports require reconciliation', 409);
          const consumedPassport = consumedPassports?.[0] || null;
          const consumedEvent = consumedPassport
            ? await provenanceEvent(consumedPassport.passport_id, `consumed:${pending.event_key}`)
            : null;
          if (!existing || !consumedEvent) {
            if (!duplicate) throw rewardError('The Stack duplicate disappeared before its provenance was finalized', 409);
            const duplicateLock = await ensureExtraLock(duplicateId, String(user.id), 'progression:stack-recovery');
            duplicate = await svc.UserCard.get(duplicateId);
            await recordStackMilestone(
              svc,
              userCard,
              { ...publicProgression(progression), stack_level: Number(pending.stack_level || normalizeProgression(progression).stack_level) },
              duplicate,
              {
                target_lock_token: targetLock.token,
                consumed_lock_token: duplicateLock.token,
                event_key: String(pending.event_key),
              },
            );
          }
        } else {
          throw rewardError('Unknown pending Card Passport mutation requires reconciliation', 409);
        }
        progression = await svc.CardProgression.update(progression.id, { pending_provenance: {} });
        passport = await svc.CardPassport.get(passport.id);
      };

      const finishStackCleanup = async (descriptor: AnyObj) => {
        const cleanup = object(descriptor.stack_cleanup);
        if (String(descriptor.action || '') !== 'stack') return;
        if (cleanup.kind === 'duplicate') {
          const duplicateId = String(cleanup.duplicate_id || progression.last_stack_consumed_card_id || '');
          if (duplicateId) {
            const duplicate = await svc.UserCard.get(duplicateId).catch(() => null);
            if (duplicate) {
              await ensureExtraLock(duplicateId, String(user.id), 'progression:stack-cleanup');
              const duplicateProgress = await svc.CardProgression.filter({ user_card_id: duplicateId }, '-updated_date', 20).catch(() => []);
              for (const row of duplicateProgress || []) await svc.CardProgression.delete(row.id);
              await svc.UserCard.delete(duplicateId);
            }
          }
        }
        progression = await svc.CardProgression.update(progression.id, {
          last_stack_consumed_card_id: '',
          last_stack_cleanup_pending: false,
          last_stack_legacy_quantity: false,
        });
      };

      const executePendingMutation = async (descriptor: AnyObj) => {
        const mutation = object(descriptor);
        const pendingRequestId = String(mutation.request_id || '');
        const pendingAction = String(mutation.action || '');
        if (!pendingRequestId || !['enhance', 'ascend', 'stack'].includes(pendingAction)) {
          throw rewardError('Incomplete pending card mutation requires reconciliation', 409);
        }

        const debit = object(mutation.debit);
        if (debit.kind === 'material') {
          const receipt = String(debit.receipt || '');
          try {
            await applyCardMaterialSpend(svc, {
              user_id: String(user.id),
              user_material_id: String(debit.id || ''),
              material_id: String(debit.material_id || ''),
              receipt,
              quantity: Number(debit.quantity || 0),
            });
          } catch (error) {
            const live = await svc.UserMaterial.get(String(debit.id || '')).catch(() => null);
            if (live && receipt && hasCardMaterialReceipt(live, receipt)) {
              // The atomic debit completed; a transient read failed afterward.
            } else if (live) {
              // The debit+receipt pair is atomic. Receipt absence proves this
              // request never spent the stack, so this descriptor is safe to abort.
              await clearPendingMutation();
              throw error;
            } else {
              // Missing storage is ambiguous; keep pending mutation for recovery.
              throw error;
            }
          }
        } else if (debit.kind === 'legacy_quantity') {
          await debitLegacyQuantity(Number(debit.before_quantity), Number(debit.after_quantity));
        }

        await commitPendingProgression(mutation);
        await finishPendingProvenance(mutation);
        await finishStackCleanup(mutation);
        await clearPendingMutation();
      };

      const inheritedPending = object(progression.pending_mutation);
      if (inheritedPending.request_id) {
        await executePendingMutation(inheritedPending);
        progression = await svc.CardProgression.get(progression.id);
        userCard = await svc.UserCard.get(String(userCard.id));
      }

      let idempotentReplay = false;
      if (action !== 'getState') {
        if (String(progression.last_request_id || '') === requestId) {
          if (String(progression.last_request_action || '') !== action) throw rewardError('A progression request id was reused for a different action', 409);
          idempotentReplay = true;
        } else if (action === 'enhance') {
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
          const eventKey = `progression:${progression.id}:${requestId}:enhance`;
          const materialReceipt = `${eventKey}:material:${stack.id}`;
          const descriptor = {
            request_id: requestId,
            action: 'enhance',
            progression_patch: {
              enhancement_percent: state.enhancement_percent + applied,
              current_cycle_stats: addStats(state.current_cycle_stats, cycleGain),
            },
            summary: `Enhancement increased by ${applied}%`,
            metadata: {
              user_material_id: stack.id,
              material_id: material.id,
              material_name: material.name,
              rarity: material.rarity,
              quantity: consume,
              enhancement_value_each: value,
              applied_percent: applied,
              overflow_wasted: waste,
              material_receipt: materialReceipt,
            },
            debit: {
              kind: 'material',
              id: stack.id,
              material_id: stack.material_id || material.id,
              quantity: consume,
              receipt: materialReceipt,
            },
            provenance: {
              kind: 'enhancement',
              event_key: eventKey,
              payload: {
                enhancement_percent: state.enhancement_percent + applied,
                applied_percent: applied,
                material_name: material.name,
                material_rarity: material.rarity,
              },
            },
          };
          await setPendingMutation(descriptor);
          await executePendingMutation(descriptor);
        } else if (action === 'ascend') {
          const state = normalizeProgression(progression);
          if (state.ascension >= ASCENSION_CAP) fail('This card is already at Ascension 5.', 409);
          if (state.enhancement_percent < ENHANCEMENT_CAP) fail(`Enhance this card to 120% before Ascending. Current: ${state.enhancement_percent}%.`, 409);
          const nextAscension = state.ascension + 1;
          const descriptor = {
            request_id: requestId,
            action: 'ascend',
            progression_patch: {
              enhancement_percent: 0,
              ascension: nextAscension,
              permanent_stats: addStats(state.permanent_stats, state.current_cycle_stats),
              current_cycle_stats: {},
              mastery_visual: nextAscension >= ASCENSION_CAP ? 'holographic_3d' : 'standard',
            },
            summary: `Card reached Ascension ${nextAscension}`,
            metadata: {
              ascension: nextAscension,
              stats_preserved: true,
              mastery_unlocked: nextAscension >= ASCENSION_CAP,
            },
            provenance: {
              kind: 'ascension',
              event_key: `progression:${progression.id}:${requestId}:ascend`,
              ascension: nextAscension,
            },
          };
          await setPendingMutation(descriptor);
          await executePendingMutation(descriptor);
        } else if (action === 'stack') {
          const state = normalizeProgression(progression);
          if (state.stack_level >= STACK_CAP) fail('This card is already at Stack Level 4.', 409);
          let duplicate: AnyObj | null = null;
          let legacyQuantity = false;
          const duplicateId = requestedDuplicateId;

          if (duplicateId) {
            duplicate = await svc.UserCard.get(duplicateId).catch(() => null);
            if (!duplicate || String(duplicate.user_id) !== String(user.id)) fail('Duplicate card not found.', 404);
            if (!userCard.trading_card_id || String(duplicate.trading_card_id || '') !== String(userCard.trading_card_id)) fail('Stacking requires an exact duplicate card.');
            if (String(duplicate.card_rarity || '') !== String(userCard.card_rarity || '')) fail('Stacking requires the same card tier.');
            if (duplicate.is_equipped || (duplicate.equipped_to && duplicate.equipped_to !== 'none')) fail('Unequip the duplicate before stacking it.', 409);
            if (duplicate.trade_status === 'locked_in_trade') fail('That duplicate is locked in a trade.', 409);
            if (duplicate.starter_grant_user_id) fail('Starter cards cannot be consumed by stacking.', 409);
            if (Array.isArray(duplicate.reward_grant_keys) && duplicate.reward_grant_keys.length) {
              const pendingGrants = await svc.RewardGrant.filter({
                grant_key: { $in: duplicate.reward_grant_keys },
                status: { $ne: 'completed' },
              }, 'created_date', 1).catch(() => []);
              if (pendingGrants.length) fail('That reward card is still being delivered. Retry after delivery completes.', 409);
            }
            const duplicateLock = lockFor(duplicateId) || await ensureExtraLock(duplicateId, String(user.id), 'progression:stack');
            await ensureCardPassport(svc, duplicate, { lock_token: duplicateLock.token });
          } else if (Number(userCard.quantity || 1) > 1) {
            legacyQuantity = true;
          } else {
            fail('Choose a duplicate copy of this card to Stack.');
          }

          const nextStack = state.stack_level + 1;
          const eventKey = `progression:${progression.id}:${requestId}:stack`;
          const descriptor: AnyObj = {
            request_id: requestId,
            action: 'stack',
            progression_patch: {
              stack_level: nextStack,
              stage: nextStack,
              stars: Math.min(5, nextStack),
            },
            summary: `Card reached Stack Level ${nextStack}`,
            metadata: {
              duplicate_user_card_id: duplicate?.id || '',
              legacy_quantity_consumed: legacyQuantity,
            },
            stack_cleanup: duplicate
              ? { kind: 'duplicate', duplicate_id: duplicate.id }
              : { kind: 'legacy_quantity' },
            provenance: duplicate
              ? {
                kind: 'stack_duplicate',
                event_key: eventKey,
                duplicate_id: duplicate.id,
                stack_level: nextStack,
              }
              : {
                kind: 'stack_legacy',
                event_key: eventKey,
                payload: { stack_level: nextStack, legacy_quantity_consumed: true },
              },
          };
          if (legacyQuantity) {
            const beforeQuantity = Number(userCard.quantity || 1);
            descriptor.debit = {
              kind: 'legacy_quantity',
              before_quantity: beforeQuantity,
              after_quantity: beforeQuantity - 1,
            };
          }
          await setPendingMutation(descriptor);
          await executePendingMutation(descriptor);
        }
      }

      progression = await svc.CardProgression.get(progression.id);
      userCard = await svc.UserCard.get(userCard.id);
      passport = await ensureCardPassport(svc, userCard, { lock_token: targetLock.token });
      const avatar = await loadCombatProfile(svc, user.id);
      const effective = effectiveCardStats(progression, baseStats);
      const effect = userCard.animation_effect || definition?.animation_effect || {};
      const skill = skillStats(String(effect.id || ''), userCard.card_rarity || definition?.rarity || 'Rare');
      const combatPreview = String(userCard.card_type || definition?.card_type || '').toLowerCase() === 'ability'
        ? abilityOutput(
          avatar.combat,
          {
            ...skill,
            base_damage: Number(effect.base_damage || skill.base_damage),
            cooldown_ms: Number(effect.cooldown_ms || skill.cooldown_ms),
          },
          effective,
        )
        : null;

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
          && (!card.equipped_to || card.equipped_to === 'none')
          && String(card.card_rarity || '') === String(userCard.card_rarity || ''),
        ).map((card: AnyObj) => ({
          id: card.id,
          card_name: card.card_name,
          card_rarity: card.card_rarity,
          card_image: card.card_image || '',
          acquired_at: card.acquired_at || card.unlocked_date || '',
        }));
      };

      const [materials, duplicates, events, passportPublic] = await Promise.all([
        materialState(),
        duplicatesState(),
        svc.CardProgressionEvent.filter({ user_card_id: userCard.id }, '-created_date', 100),
        publicPassport(svc, userCard),
      ]);

      return json({
        success: true,
        system_version: CARD_SYSTEM_VERSION,
        request_id: requestId || undefined,
        idempotent_replay: idempotentReplay,
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
        compatibility: {
          combine_aliases_to_stack: true,
          legacy_power_preserved: true,
          mutation_recovery: true,
          material_receipts: true,
        },
        skill_tree: [],
        enchantments: [],
      });
    } catch (error: any) {
      console.error('cardProgression failed', error);
      return json({ error: error?.message || String(error) }, Number(error?.status || 400));
    } finally {
      if (svc && heldLocks.length) await releaseCardMutationLocks(svc, heldLocks).catch(() => null);
    }
  });
}
