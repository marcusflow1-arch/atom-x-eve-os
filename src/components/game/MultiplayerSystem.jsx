import React, { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

export default function MultiplayerSystem({ envUrl }) {
  const { user } = useAuth();
  const [currentChannel, setCurrentChannel] = useState(null);
  const localStateRef = useRef({ x: 0, y: -0.5, z: 0, yaw: 0, anim: 'idle' });
  const channelRef = useRef(null);
  
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
    const handleJoin = (e) => {
      const targetChannel = e.detail.channelId;
      if (targetChannel) {
        setCurrentChannel(targetChannel);
        channelRef.current = targetChannel;
        console.log(`[Multiplayer] Joined channel: ${targetChannel}`);
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

    // 1. Initial fetch of other players
    base44.entities.PlayerState.filter({ channel_id: currentChannel }).then(others => {
       if (!isSubscribed) return;
       const now = Date.now();
       others.forEach(p => {
           if (p.player_id !== user.id && (now - p.last_update) < 15000) {
               otherPlayersMap.set(p.player_id, p);
               // Sync environment if joining and host has a different environment
               if (`dashboard_${p.player_id}` === currentChannel && p.env_url && p.env_url !== envUrl) {
                   window.dispatchEvent(new CustomEvent('changeEnvironment', {
                       detail: { envUrl: p.env_url }
                   }));
               }
           }
       });
       window.dispatchEvent(new CustomEvent('multiplayerPlayersUpdate', {
         detail: { players: Array.from(otherPlayersMap.values()) }
       }));
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
              
              // If we are in someone else's channel and they change their environment, sync to it
              if (`dashboard_${p.player_id}` === currentChannel && p.env_url && p.env_url !== envUrl) {
                  window.dispatchEvent(new CustomEvent('changeEnvironment', {
                      detail: { envUrl: p.env_url }
                  }));
              }
          }
      }
    });

    let lastPushTime = 0;
    let lastPushState = { x: null, y: null, z: null, yaw: null, anim: null };

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
        if (hasMoved || now - lastPushTime > 8000) {
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
            base44.entities.PlayerState.update(user.id, updateData).catch(async (err) => {
              if (err?.status === 404 || err?.message?.includes('not found')) {
                await base44.entities.PlayerState.create({ id: user.id, ...updateData }).catch(e => console.log(e));
              }
            });
        }
        
        // Clean up stale remote players locally (timeout after 15s)
        let changed = false;
        for (const [id, p] of otherPlayersMap.entries()) {
            if (now - p.last_update > 15000) {
                otherPlayersMap.delete(id);
                changed = true;
            }
        }
        if (changed) {
            window.dispatchEvent(new CustomEvent('multiplayerPlayersUpdate', {
              detail: { players: Array.from(otherPlayersMap.values()) }
            }));
        }

      } catch (e) {
        console.error('[Multiplayer] tick error:', e);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      if (unsubscribe) unsubscribe();
    };
  }, [user, currentChannel, envUrl]);

  return null;
}