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

export async function trackPlayerDecision(decision = {}) {
  if (!decision?.decision_type || !decision?.choice_made) return null;
  try {
    let avatarId = decision.avatar_id;
    if (!avatarId) {
      const me = await base44.auth.me();
      const avatars = await base44.entities.Avatar.filter({ user_id: me.id }, '-created_date', 1);
      avatarId = avatars?.[0]?.id;
    }
    if (!avatarId) return null;
    const response = await base44.functions.invoke('aiBehaviorCore', {
      action: 'logDecision',
      payload: {
        avatar_id: avatarId,
        game_id: decision.game_id || '',
        decision_type: decision.decision_type,
        decision_context: decision.decision_context || '',
        choice_made: decision.choice_made,
        moral_weight: Number(decision.moral_weight || 0),
        aggression_impact: Number(decision.aggression_impact || 0),
        empathy_impact: Number(decision.empathy_impact || 0),
        risk_impact: Number(decision.risk_impact || 0),
        trait_impacts: decision.trait_impacts || {}
      }
    });
    trackAtomEvent('ai_player_decision_processed', { game_id: decision.game_id, decision_type: decision.decision_type });
    return response?.data || response;
  } catch (error) {
    console.warn('AI reflection decision was not processed:', error);
    return null;
  }
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
