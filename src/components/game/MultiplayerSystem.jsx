import React, { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { useWebRTCVoice } from '@/components/shared/useWebRTCVoice';
import { toast } from 'react-hot-toast';
import { getCompanionState } from '@/components/game3d/companionStore';
import { getCompanionProgression } from '@/components/game3d/companionProgressionStore';

export default function MultiplayerSystem({ envUrl }) {
  const { user } = useAuth();
  const [currentChannel, setCurrentChannel] = useState(null);
  const [participantIds, setParticipantIds] = useState([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const localStateRef = useRef({ x: 0, y: -0.5, z: 0, yaw: 0, anim: 'idle' });
  const channelRef = useRef(null);
  const explicitlyJoinedRef = useRef(false); // true if joinMultiplayerChannel fired
  const hostGraceTimerRef = useRef(Date.now());
  const envUrlRef = useRef(envUrl);

  useEffect(() => {
    envUrlRef.current = envUrl;
  }, [envUrl]);

  useWebRTCVoice(currentChannel, user, !micEnabled, false, participantIds);

  useEffect(() => {
    const handleMicToggle = (e) => {
      setMicEnabled(e.detail.enabled);
    };
    const handlePermissionDenied = () => {
      toast.error('Microphone access denied. Please allow microphone access to use voice chat.', {
        duration: 4000,
        position: 'top-center'
      });
      setMicEnabled(false);
      window.dispatchEvent(new CustomEvent('dashboardMicDisabled'));
    };
    
    window.addEventListener('toggleDashboardMic', handleMicToggle);
    window.addEventListener('webrtcPermissionDenied', handlePermissionDenied);
    return () => {
      window.removeEventListener('toggleDashboardMic', handleMicToggle);
      window.removeEventListener('webrtcPermissionDenied', handlePermissionDenied);
    };
  }, []);
  
  useEffect(() => {
    if (user?.id && !explicitlyJoinedRef.current) {
      // Default to user's own dashboard channel ONLY if no explicit join has occurred.
      // GameWorldServerManager dispatches joinMultiplayerChannel BEFORE this effect
      // runs on the GameView page → that path wins and we skip this default.
      const defaultChannel = `dashboard_${user.id}`;
      setCurrentChannel(defaultChannel);
      channelRef.current = defaultChannel;
      
      // Register world instance in GameChannel
      base44.entities.GameChannel.filter({ name: defaultChannel }).then(res => {
        if (res.length > 0) {
          base44.entities.GameChannel.update(res[0].id, { current_map: { envUrl } });
        } else {
          base44.entities.GameChannel.create({ name: defaultChannel, current_map: { envUrl }, player_count: 1 });
        }
      });
    }
  }, [user?.id]);

  useEffect(() => {
    const handleJoin = async (e) => {
      const targetChannel = e.detail.channelId;
      const hostId = e.detail.hostId;
      if (targetChannel) {
        explicitlyJoinedRef.current = true;
        setCurrentChannel(targetChannel);
        channelRef.current = targetChannel;
        console.log(`[Multiplayer] Joined channel: ${targetChannel}`);

        // Shared world server: don't try to sync environment to a synthetic host
        // and don't run host-grace logic (the world channel has no real "host").
        const isSharedWorld = hostId === targetChannel;

        // Fetch host's home environment (skip for shared world)
        if (hostId && !isSharedWorld) {
           try {
               const states = await base44.entities.AvatarHomeState.filter({ avatarId: hostId });
               let targetEnvUrl = null;
               let targetLayout = null;

               if (states && states.length > 0 && states[0].currentEnvironmentId) {
                   const savedId = states[0].currentEnvironmentId;
                   
                   if (savedId !== 'default_room') {
                       try {
                           const layouts = await base44.entities.SceneLayout.filter({ id: savedId });
                           if (layouts && layouts.length > 0 && layouts[0].environment_url) {
                               targetEnvUrl = layouts[0].environment_url;
                               targetLayout = layouts[0];
                           }
                       } catch (e) {}

                       if (!targetEnvUrl) {
                           const models = await base44.entities.Model3D.list();
                           const fbxs = await base44.entities.ModelFBX.list();
                           const all = [...(models || []), ...(fbxs || [])];
                           const queries = {
                               'cyber_loft': ['room 2', 'room2'],
                               'zen_garden': ['zen', 'garden'],
                               'mars_outpost': ['mars', 'outpost']
                           };
                           if (queries[savedId]) {
                               const found = all.find(m => queries[savedId].some(q => (m.name || '').toLowerCase().includes(q)));
                               if (found?.file_url) targetEnvUrl = found.file_url;
                           }
                       }
                   } else {
                       const models = await base44.entities.Model3D.list();
                       const room1Asset = models.find(m => m.name.toLowerCase().includes('room 1') || m.name.toLowerCase().includes('room1'));
                       if (room1Asset?.file_url) targetEnvUrl = room1Asset.file_url;
                   }
               }
               
               if (!targetEnvUrl) {
                   // Fallback to PlayerState env_url if we couldn't resolve home state
                   try {
                       const hostStates = await base44.entities.PlayerState.filter({ player_id: hostId });
                       if (hostStates && hostStates.length > 0 && hostStates[0].env_url) targetEnvUrl = hostStates[0].env_url;
                   } catch (e) {
                       console.log("PlayerState fallback failed", e);
                   }
               }

               if (targetEnvUrl) {
                   window.dispatchEvent(new CustomEvent('changeEnvironment', {
                       detail: { envUrl: targetEnvUrl, layoutData: targetLayout, envId: states[0]?.currentEnvironmentId }
                   }));
               }
           } catch (err) {
               console.log("Could not fetch host state for env sync", err);
           }
        }
      }
    };
    
    const handleLocalUpdate = (e) => {
      if (e.detail) {
        localStateRef.current = { ...localStateRef.current, ...e.detail };
        // INSTANT broadcast: send the moment movement happens, not on a tick.
        // This is the hot path for real-time player sync. WebRTC data channel
        // is configured ordered:false / maxRetransmits:0 so this is UDP-fast.
        if (window.webrtcBroadcast && user?.id && channelRef.current) {
          const s = localStateRef.current;
          window.webrtcBroadcast({
            type: 'movement',
            payload: {
              x: s.x, y: s.y, z: s.z, yaw: s.yaw, anim: s.anim,
              last_update: Date.now(),
              display_name: user.full_name || user.username || 'Player',
              avatar_url: user.avatar_url || '',
              model_url: localStorage.getItem('luna_active_character') === 'c1'
                ? 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx'
                : 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/608211a0f_YBot1.fbx'
            }
          });

          // Broadcast THIS player's companion alongside their movement, so
          // every peer sees this player's own separate companion instance.
          // Companion position mirrors the rider when mounted, otherwise it
          // trails them — GameWorld3D's local companion logic already handles
          // that; we just send the resolved authority value.
          try {
            const comp = getCompanionState();
            if (comp.activeCompanionId) {
              const compPos = window.__localCompanionPos || null;
              const level = (getCompanionProgression(comp.activeCompanionId)?.level) || 1;
              window.webrtcBroadcast({
                type: 'companion',
                payload: {
                  companion_id: comp.activeCompanionId,
                  mounted: !!comp.isMounted,
                  level,
                  // If mounted, companion is at the player's position.
                  // Otherwise use the last frame's projected companion world pos.
                  x: comp.isMounted ? s.x : (compPos?.x ?? s.x),
                  y: comp.isMounted ? s.y : (compPos?.y ?? s.y),
                  z: comp.isMounted ? s.z : (compPos?.z ?? s.z),
                  yaw: comp.isMounted ? s.yaw : (compPos?.yaw ?? s.yaw),
                  anim: s.anim,
                  last_update: Date.now(),
                }
              });
            }
          } catch (err) { /* companion stores not ready yet — ignore */ }
        }
      }
    };

    // Realtime ability/skill/action broadcast — fires the instant a local
    // player uses a skill so peers can see and react with near-zero delay.
    const handleLocalAction = (e) => {
      if (!e.detail || !window.webrtcBroadcast || !user?.id) return;
      window.webrtcBroadcast({
        type: 'action',
        payload: { ...e.detail, ts: Date.now(), player_id: user.id }
      });
    };

    window.addEventListener('joinMultiplayerChannel', handleJoin);
    window.addEventListener('multiplayerLocalUpdate', handleLocalUpdate);
    window.addEventListener('multiplayerLocalAction', handleLocalAction);
    return () => {
      window.removeEventListener('joinMultiplayerChannel', handleJoin);
      window.removeEventListener('multiplayerLocalUpdate', handleLocalUpdate);
      window.removeEventListener('multiplayerLocalAction', handleLocalAction);
    };
  }, []);

  useEffect(() => {
    if (!user?.id || !currentChannel) return;
    
    let isSubscribed = true;
    let otherPlayersMap = new Map();

    hostGraceTimerRef.current = Date.now(); // Reset grace timer on channel join/change

    // 1. Initial fetch of other players
    base44.entities.PlayerState.filter({ channel_id: currentChannel }).then(others => {
       if (!isSubscribed) return;
       const now = Date.now();
       const isDashboard = currentChannel.startsWith('dashboard_');
       const hostIdMatch = isDashboard ? currentChannel.match(/^dashboard_(.+)$/) : null;
       const hostId = hostIdMatch ? hostIdMatch[1] : null;
       let hostFound = false;

       others.forEach(p => {
           if (p.player_id !== user.id && (now - p.last_update) < 15000) {
               otherPlayersMap.set(p.player_id, p);
               if (hostId && p.player_id === hostId) hostFound = true;
               
               // Sync environment if joining and host has a different environment
               if (hostId && p.player_id === hostId && p.env_url && p.env_url !== envUrlRef.current) {
                   base44.entities.AvatarHomeState.filter({ avatarId: hostId }).then(async states => {
                      let targetLayout = null;
                      let targetEnvId = null;
                      if (states && states.length > 0 && states[0].currentEnvironmentId) {
                          targetEnvId = states[0].currentEnvironmentId;
                          if (targetEnvId !== 'default_room') {
                              try {
                                  const layouts = await base44.entities.SceneLayout.filter({ id: targetEnvId });
                                  if (layouts && layouts.length > 0) targetLayout = layouts[0];
                              } catch(e) {}
                          }
                      }
                      window.dispatchEvent(new CustomEvent('changeEnvironment', {
                          detail: { envUrl: p.env_url, layoutData: targetLayout, envId: targetEnvId }
                      }));
                  });
               }
           }
       });

       if (hostId && hostId !== user.id && !hostFound) {
           console.log("[Multiplayer] Host not found on join. Giving grace period.");
       } else if (hostFound) {
           hostGraceTimerRef.current = null; // Host found, no need for grace
       }

       window.dispatchEvent(new CustomEvent('multiplayerPlayersUpdate', {
         detail: { players: Array.from(otherPlayersMap.values()) }
       }));
       setParticipantIds(Array.from(otherPlayersMap.keys()));
    }).catch(e => console.error("[Multiplayer] init error", e));

    // Real-time listener for WebRTC DataChannel movement
    const handleWebRTCMovement = (e) => {
        if (!isSubscribed) return;
        const p = e.detail;
        if (p.player_id !== user.id) {
            otherPlayersMap.set(p.player_id, { ...otherPlayersMap.get(p.player_id), ...p });
            window.dispatchEvent(new CustomEvent('multiplayerPlayersUpdate', {
                detail: { players: Array.from(otherPlayersMap.values()) }
            }));
            setParticipantIds(Array.from(otherPlayersMap.keys()));
        }
    };
    window.addEventListener('webrtcMovementUpdate', handleWebRTCMovement);

    // 2. Real-time subscription to PlayerState changes (joins/leaves/env/position fallback)
    const unsubscribe = base44.entities.PlayerState.subscribe((event) => {
      if (!isSubscribed) return;
      if (event.type === 'create' || event.type === 'update') {
          const p = event.data;
          if (p.channel_id === currentChannel && p.player_id !== user.id) {
              const existing = otherPlayersMap.get(p.player_id) || {};
              // Merge so newer WebRTC position frames aren't clobbered by stale DB ones
              otherPlayersMap.set(p.player_id, { ...existing, ...p });
              window.dispatchEvent(new CustomEvent('multiplayerPlayersUpdate', {
                 detail: { players: Array.from(otherPlayersMap.values()) }
              }));
              setParticipantIds(Array.from(otherPlayersMap.keys()));
              
              // If we are in someone else's channel and they change their environment, sync to it
              const isDashboard = currentChannel.startsWith('dashboard_');
              const hostIdMatch = isDashboard ? currentChannel.match(/^dashboard_(.+)$/) : null;
              const hostId = hostIdMatch ? hostIdMatch[1] : null;
              if (hostId && p.player_id === hostId && p.env_url && p.env_url !== envUrlRef.current) {
                  base44.entities.AvatarHomeState.filter({ avatarId: hostId }).then(async states => {
                      let targetLayout = null;
                      let targetEnvId = null;
                      if (states && states.length > 0 && states[0].currentEnvironmentId) {
                          targetEnvId = states[0].currentEnvironmentId;
                          if (targetEnvId !== 'default_room') {
                              try {
                                  const layouts = await base44.entities.SceneLayout.filter({ id: targetEnvId });
                                  if (layouts && layouts.length > 0) targetLayout = layouts[0];
                              } catch(e) {}
                          }
                      }
                      window.dispatchEvent(new CustomEvent('changeEnvironment', {
                          detail: { envUrl: p.env_url, layoutData: targetLayout, envId: targetEnvId }
                      }));
                  });
              }
          }
      }
    });

    let lastPushTime = 0;
    let lastPushState = { x: null, y: null, z: null, yaw: null, anim: null };
    let localEntityId = null;
    let isCreatingEntity = false;

    // Find our existing state first
    base44.entities.PlayerState.filter({ player_id: user.id }).then(res => {
        if (!isSubscribed) return;
        if (res.length > 0) {
            localEntityId = res[0].id;
        }
    }).catch(e => console.error(e));

    const tick = async () => {
      if (!isSubscribed) return;
      try {
        const now = Date.now();
        const state = localStateRef.current;
        
        const envUrlCurrent = envUrlRef.current || '';
        
        // Calculate diff to avoid spamming the data channel when truly idle.
        // Lower thresholds = more frequent updates = lower perceived latency
        // on the remote side.
        const hasMoved = 
            Math.abs(state.x - (lastPushState.x || 0)) > 0.005 ||
            Math.abs(state.y - (lastPushState.y || 0)) > 0.005 ||
            Math.abs(state.z - (lastPushState.z || 0)) > 0.005 ||
            Math.abs(state.yaw - (lastPushState.yaw || 0)) > 0.01 ||
            state.anim !== lastPushState.anim ||
            envUrlCurrent !== (lastPushState.envUrl || '');

        // Push if moved significantly, OR every 2 seconds to keep connection alive
        // (faster heartbeat ⇒ less initial-join latency before WebRTC kicks in)
        const timeSinceLastPush = now - lastPushTime;
        const forceKeepAlive = timeSinceLastPush > 2000;
        
        // Only write to DB for presence/environment sync every 5s, NOT movement
        if (forceKeepAlive || envUrlCurrent !== (lastPushState.envUrl || '')) {
            lastPushTime = now;
            lastPushState = { ...state, envUrl: envUrlCurrent };

            const myModelUrl = localStorage.getItem('luna_active_character') === 'c1' 
              ? 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx'
              : 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/608211a0f_YBot1.fbx';

            const updateData = {
              player_id: user.id,
              display_name: user.full_name || user.username || 'Player',
              avatar_url: user.avatar_url || '',
              model_url: myModelUrl,
              channel_id: currentChannel,
              env_url: envUrlCurrent,
              last_update: now,
              status: 'online',
              // We omit x,y,z,yaw,anim from DB to save payload size, but we keep them just in case
              x: state.x,
              y: state.y,
              z: state.z,
              yaw: state.yaw,
              anim: state.anim
            };

            // Non-blocking DB update for presence
            if (localEntityId) {
                base44.entities.PlayerState.update(localEntityId, updateData).catch(err => {
                    if (err?.status === 404 || err?.message?.includes('not found')) {
                        localEntityId = null;
                    }
                });
            } else if (!isCreatingEntity) {
                isCreatingEntity = true;
                base44.entities.PlayerState.create(updateData).then(res => {
                    if (res && res.id) localEntityId = res.id;
                    isCreatingEntity = false;
                }).catch(e => {
                    console.log(e);
                    isCreatingEntity = false;
                });
            }
        }

        // WebRTC DataChannel Real-time Broadcast for Movement (20-30 times per sec if moved)
        if (hasMoved) {
            lastPushState = { ...state, envUrl: envUrlCurrent };
            if (window.webrtcBroadcast) {
                window.webrtcBroadcast({
                    type: 'movement',
                    payload: {
                        x: state.x,
                        y: state.y,
                        z: state.z,
                        yaw: state.yaw,
                        anim: state.anim,
                        last_update: now,
                        // Include basic info so peers know who this is
                        display_name: user.full_name || user.username || 'Player',
                        avatar_url: user.avatar_url || '',
                        model_url: localStorage.getItem('luna_active_character') === 'c1' 
                            ? 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx'
                            : 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/608211a0f_YBot1.fbx'
                    }
                });
            }
        }
        
        // Clean up stale remote players locally (timeout after 15s)
        let changed = false;
        let hostPresent = false;
        const isDashboard = currentChannel.startsWith('dashboard_');
        const hostIdMatch = isDashboard ? currentChannel.match(/^dashboard_(.+)$/) : null;
        const hostId = hostIdMatch ? hostIdMatch[1] : null;

        for (const [id, p] of otherPlayersMap.entries()) {
            if (now - p.last_update > 15000) {
                otherPlayersMap.delete(id);
                changed = true;
            } else {
                if (hostId && id === hostId) hostPresent = true;
            }
        }
        
        // If we are a guest in someone else's dashboard, verify the host is still here.
        // For the shared world channel (game_world_main), there is no real host — skip.
        const isSharedWorld = currentChannel === 'game_world_main';
        if (!isSharedWorld && hostId && hostId !== user.id) {
             if (hostPresent) {
                 hostGraceTimerRef.current = null; // Host is here
             } else {
                 if (!hostGraceTimerRef.current) {
                     hostGraceTimerRef.current = now;
                 }
                 if (now - hostGraceTimerRef.current > 10000) {
                     // Host missing for 10 seconds, disconnect
                     console.log("[Multiplayer] Host left or timed out. Disconnecting guest.");
                     hostGraceTimerRef.current = null;
                     window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', {
                         detail: { channelId: `dashboard_${user.id}`, hostId: user.id }
                     }));
                     return; // stop further processing for this tick
                 }
             }
        }

        if (changed) {
            window.dispatchEvent(new CustomEvent('multiplayerPlayersUpdate', {
              detail: { players: Array.from(otherPlayersMap.values()) }
            }));
            setParticipantIds(Array.from(otherPlayersMap.keys()));
        }

      } catch (e) {
        console.error('[Multiplayer] tick error:', e);
      }
    };

    tick();
    // 33Hz tick (~30ms) — broadcasts movement over WebRTC data channel as
    // fast as practical without saturating the connection. DB writes are
    // still throttled to once every 2s via forceKeepAlive.
    const interval = setInterval(tick, 30);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      if (unsubscribe) unsubscribe();
      window.removeEventListener('webrtcMovementUpdate', handleWebRTCMovement);
    };
  }, [user?.id, currentChannel]);

  return null;
}