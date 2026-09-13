import { base44 } from '@/api/base44Client';

// Lightweight, fire-and-forget product telemetry. It never blocks navigation
// and safely degrades when analytics logging is unavailable.
export function trackAtomEvent(event, properties = {}) {
  if (!event || typeof event !== 'string') return;
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...properties,
  };
  Promise.resolve()
    .then(() => base44.appLogs?.logUserInApp?.(event, payload))
    .catch(() => {});
}

async function avatarIdForCurrentUser(explicitId) {
  if (explicitId) return explicitId;
  const me = await base44.auth.me();
  const avatars = await base44.entities.Avatar.filter({ user_id: me.id }, '-created_date', 1);
  return avatars?.[0]?.id || null;
}

export async function trackAvatarExperience(experience = {}) {
  try {
    const avatarId = await avatarIdForCurrentUser(experience.avatar_id);
    if (!avatarId) return null;
    const response = await base44.functions.invoke('avatarMindCore', {
      action: 'observeEvent',
      payload: {
        ...experience,
        avatar_id: avatarId,
        observed_at: experience.observed_at || new Date().toISOString(),
      },
    });
    const data = response?.data || response;
    if (data?.success) {
      trackAtomEvent('avatar_mind_experience_processed', {
        event_type: experience.event_type,
        source: experience.source || 'game_event',
        game_id: experience.game_id,
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('atom:mind-updated', { detail: data }));
      }
    }
    return data;
  } catch (error) {
    console.warn('Avatar mind experience was not processed:', error);
    return null;
  }
}

export async function trackPlayerDecision(decision = {}) {
  if (!decision?.decision_type || !decision?.choice_made) return null;
  const signals = {
    trait_impacts: decision.trait_impacts || {},
    moral_impact: Number(decision.moral_weight || 0),
    aggression_impact: Number(decision.aggression_impact || 0),
    empathy_impact: Number(decision.empathy_impact || 0),
    risk_impact: Number(decision.risk_impact || 0),
  };
  const result = await trackAvatarExperience({
    avatar_id: decision.avatar_id,
    source: 'game_event',
    game_id: decision.game_id || '',
    game_name: decision.game_name || '',
    event_type: decision.decision_type,
    decision_type: decision.decision_type,
    decision_context: decision.decision_context || '',
    context: decision.decision_context || '',
    choice_made: decision.choice_made,
    action: decision.choice_made,
    outcome: decision.outcome || '',
    significance: Number(decision.significance ?? (decision.decision_type === 'moral_choice' ? 80 : 55)),
    emotional_valence: Number(decision.emotional_valence || 0),
    signals,
  });
  trackAtomEvent('ai_player_decision_processed', { game_id: decision.game_id, decision_type: decision.decision_type });
  return result;
}

export const AtomEvents = Object.freeze({
  GAME_HUB_OPENED: 'game_hub_opened',
  GAME_TAB_SELECTED: 'game_tab_selected',
  STUDIO_TAB_SELECTED: 'studio_tab_selected',
  STREAM_TAB_SELECTED: 'stream_tab_selected',
  GAME_PLAY_REQUESTED: 'game_play_requested',
  DLC_VIEWED: 'dlc_viewed',
  DLC_PURCHASE_REQUESTED: 'dlc_purchase_requested',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  AVATAR_REWARD_GRANTED: 'avatar_reward_granted',
  STORE_FILTER_SELECTED: 'store_filter_selected',
  DEV_CARD_OPENED: 'dev_card_opened',
  AI_PLAYER_DECISION: 'ai_player_decision',
});
