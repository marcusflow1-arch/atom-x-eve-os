// Tracks which game world "channel" (instance) the local player is currently in.
// Switching channels re-emits a `joinMultiplayerChannel` event so MultiplayerSystem
// and the host-election layer (WorldSyncMount) re-bind to the new channel.
// The first player into a given channel naturally becomes its host via the
// existing host-election logic already running per-channel.

const DEFAULT_CHANNEL = {
  id: 'game_world_main',
  name: 'Main World',
  description: 'The default shared world.',
};

// Predefined channel list. Players in different channels cannot see each other
// because MultiplayerSystem filters presence/peers by channel_id.
export const CHANNELS = [
  DEFAULT_CHANNEL,
  { id: 'game_world_alpha',   name: 'Alpha',   description: 'A separate instance.' },
  { id: 'game_world_beta',    name: 'Beta',    description: 'A separate instance.' },
  { id: 'game_world_gamma',   name: 'Gamma',   description: 'A separate instance.' },
  { id: 'game_world_delta',   name: 'Delta',   description: 'A separate instance.' },
];

let currentChannelId = DEFAULT_CHANNEL.id;
const listeners = new Set();

export function getCurrentChannelId() {
  return currentChannelId;
}

export function subscribeChannel(fn) {
  listeners.add(fn);
  fn(currentChannelId);
  return () => listeners.delete(fn);
}

export function switchChannel(channelId) {
  if (!channelId || channelId === currentChannelId) return;
  currentChannelId = channelId;
  // Tell MultiplayerSystem (and any other listener) to rebind to the new channel.
  // Using channelId as the hostId means each channel runs its own host-election
  // bucket; the first joiner wins and becomes the channel host.
  window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', {
    detail: { channelId, hostId: channelId },
  }));
  listeners.forEach((fn) => fn(currentChannelId));
}