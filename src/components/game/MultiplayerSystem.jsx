import React, { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { useWebRTCVoice } from '@/components/shared/useWebRTCVoice';
import { toast } from 'react-hot-toast';

export default function MultiplayerSystem({ envUrl }) {
  const { user } = useAuth();
  const [currentChannel, setCurrentChannel] = useState(null);
  const [participantIds, setParticipantIds] = useState([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const localStateRef = useRef({ x: 0, y: -0.5, z: 0, yaw: 0, anim: 'idle' });
  const channelRef = useRef(null);
  const hostGraceTimerRef = useRef(Date.now());

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
    if (user?.id) {
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
  }, [user]);

  useEffect(() => {
    const handleJoin = async (e) => {
      const targetChannel = e.detail.channelId;
      const hostId = e.detail.hostId;
      if (targetChannel) {
        setCurrentChannel(targetChannel);
        channelRef.current = targetChannel;
        console.log(`[Multiplayer] Joined channel: ${targetChannel}`);

        // Fetch host's home environment
        if (hostId) {
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
      }
    };

    window.addEventListener('joinMultiplayerChannel', handleJoin);
    window.addEventListener('multiplayerLocalUpdate', handleLocalUpdate);
    return () => {
      window.removeEventListener('joinMultiplayerChannel', handleJoin);
      window.removeEventListener('multiplayerLocalUpdate', handleLocalUpdate);
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
       const hostIdMatch = currentChannel.match(/^(?:dashboard_|world_instance_)(.+)$/);
       const hostId = hostIdMatch ? hostIdMatch[1] : null;
       let hostFound = false;

       others.forEach(p => {
           if (p.player_id !== user.id && (now - p.last_update) < 15000) {
               otherPlayersMap.set(p.player_id, p);
               if (p.player_id === hostId) hostFound = true;
               
               // Sync environment if joining and host has a different environment
               if (p.player_id === hostId && p.env_url && p.env_url !== envUrl) {
                   window.dispatchEvent(new CustomEvent('changeEnvironment', {
                       detail: { envUrl: p.env_url }
                   }));
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

    // 2. Real-time subscription to PlayerState changes
    const unsubscribe = base44.entities.PlayerState.subscribe((event) => {
      if (!isSubscribed) return;
      if (event.type === 'create' || event.type === 'update') {
          const p = event.data;
          if (p.channel_id === currentChannel && p.player_id !== user.id) {
              otherPlayersMap.set(p.player_id, p);
              window.dispatchEvent(new CustomEvent('multiplayerPlayersUpdate', {
                 detail: { players: Array.from(otherPlayersMap.values()) }
              }));
              setParticipantIds(Array.from(otherPlayersMap.keys()));
              
              // If we are in someone else's channel and they change their environment, sync to it
              const hostIdMatch = currentChannel.match(/^(?:dashboard_|world_instance_)(.+)$/);
              const hostId = hostIdMatch ? hostIdMatch[1] : null;
              if (p.player_id === hostId && p.env_url && p.env_url !== envUrl) {
                  window.dispatchEvent(new CustomEvent('changeEnvironment', {
                      detail: { envUrl: p.env_url }
                  }));
              }
          }
      }
    });

    let lastPushTime = 0;
    let lastPushState = { x: null, y: null, z: null, yaw: null, anim: null };
    let localEntityId = null;

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
        
        // Calculate diff to avoid spamming the database with updates when idle
        const hasMoved = 
            Math.abs(state.x - (lastPushState.x || 0)) > 0.05 ||
            Math.abs(state.y - (lastPushState.y || 0)) > 0.05 ||
            Math.abs(state.z - (lastPushState.z || 0)) > 0.05 ||
            Math.abs(state.yaw - (lastPushState.yaw || 0)) > 0.1 ||
            state.anim !== lastPushState.anim;

        // Push if moved significantly, OR every 8 seconds to keep connection alive
        const timeSinceLastPush = now - lastPushTime;
        const forceKeepAlive = timeSinceLastPush > 8000;
        
        // Rate limit the push to max 1 per 1.5 seconds to avoid "Rate limit exceeded"
        if ((hasMoved && timeSinceLastPush > 1500) || forceKeepAlive) {
            lastPushTime = now;
            lastPushState = { ...state };

            const myModelUrl = localStorage.getItem('luna_active_character') === 'c1' 
              ? 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx'
              : 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/608211a0f_YBot1.fbx';

            const updateData = {
              player_id: user.id,
              display_name: user.full_name || user.username || 'Player',
              avatar_url: user.avatar_url || '',
              model_url: myModelUrl,
              channel_id: currentChannel,
              env_url: envUrl || '',
              last_update: now,
              status: 'online',
              x: state.x,
              y: state.y,
              z: state.z,
              yaw: state.yaw,
              anim: state.anim
            };

            // Non-blocking update so tick is fast
            if (localEntityId) {
                base44.entities.PlayerState.update(localEntityId, updateData).catch(err => {
                    if (err?.status === 404 || err?.message?.includes('not found')) {
                        localEntityId = null;
                    }
                });
            } else {
                base44.entities.PlayerState.create(updateData).then(res => {
                    if (res && res.id) localEntityId = res.id;
                }).catch(e => console.log(e));
            }
        }
        
        // Clean up stale remote players locally (timeout after 15s)
        let changed = false;
        let hostPresent = false;
        const hostIdMatch = currentChannel.match(/^(?:dashboard_|world_instance_)(.+)$/);
        const hostId = hostIdMatch ? hostIdMatch[1] : null;

        for (const [id, p] of otherPlayersMap.entries()) {
            if (now - p.last_update > 15000) {
                otherPlayersMap.delete(id);
                changed = true;
            } else {
                if (id === hostId) hostPresent = true;
            }
        }
        
        // If we are a guest, verify the host is still here
        if (hostId && hostId !== user.id) {
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
    const interval = setInterval(tick, 50);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      if (unsubscribe) unsubscribe();
    };
  }, [user, currentChannel, envUrl]);

  return null;
}