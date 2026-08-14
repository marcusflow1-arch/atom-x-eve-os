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
});
