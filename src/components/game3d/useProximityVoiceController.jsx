import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { createProximityVoice } from './proximityVoice';

/**
 * Wires up the proximity voice system for GameWorld3D.
 *
 * - Tracks the local player position via the `multiplayerLocalUpdate` event
 *   already dispatched by GameWorld3D each frame.
 * - Initializes the voice system once we know the local user id.
 * - Notifies the caller via `onTalkingChange(peerId, isTalking)` so it can
 *   show floating mic indicators above remote players.
 *
 * Returns refs the parent uses:
 *   voiceRef        — the proximityVoice instance (for toggleMic + syncPeers + tick)
 *   localPosRef     — { x, y, z } latest broadcast position of the local player
 */
export function useProximityVoiceController({ remoteManagerRef, onTalkingChange }) {
  const voiceRef = useRef(null);
  const localPosRef = useRef({ x: 0, y: 0, z: 0 });

  // Track local player world position (broadcast from the game loop)
  useEffect(() => {
    const onLocal = (e) => {
      const d = e.detail || {};
      localPosRef.current = { x: d.x || 0, y: d.y || 0, z: d.z || 0 };
    };
    window.addEventListener('multiplayerLocalUpdate', onLocal);
    return () => window.removeEventListener('multiplayerLocalUpdate', onLocal);
  }, []);

  // Init voice once we have a user id
  useEffect(() => {
    let cancelled = false;
    base44.auth.me().then((u) => {
      if (!u || cancelled) return;
      voiceRef.current = createProximityVoice({
        userId: u.id,
        getLocalPos: () => localPosRef.current,
        getRemotePos: (peerId) => {
          const mgr = remoteManagerRef.current;
          if (!mgr?.getRemotes) return null;
          const r = mgr.getRemotes().get(peerId);
          if (!r?.group) return null;
          return { x: r.group.position.x, y: r.group.position.y, z: r.group.position.z };
        },
        onRemoteTalking: onTalkingChange,
      });
    }).catch(() => {});
    return () => {
      cancelled = true;
      voiceRef.current?.dispose();
      voiceRef.current = null;
    };
  }, [remoteManagerRef, onTalkingChange]);

  return { voiceRef, localPosRef };
}