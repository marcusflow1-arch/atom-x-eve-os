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
      const defaultChannel = `world_instance_${user.id}`;
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
    
    const tick = async () => {
      try {
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
          last_update: Date.now(),
          status: 'online',
          x: localStateRef.current.x,
          y: localStateRef.current.y,
          z: localStateRef.current.z,
          yaw: localStateRef.current.yaw,
          anim: localStateRef.current.anim
        };

        // Update self
        await base44.entities.PlayerState.update(user.id, updateData).catch(async (err) => {
          if (err?.status === 404 || err?.message?.includes('not found')) {
            await base44.entities.PlayerState.create({ id: user.id, ...updateData }).catch(e => console.log(e));
          }
        });

        // Fetch others in channel
        const others = await base44.entities.PlayerState.filter({ channel_id: currentChannel });
        const now = Date.now();
        const validOthers = others.filter(p => p.player_id !== user.id && (now - p.last_update) < 10000); // 10s timeout
        
        window.dispatchEvent(new CustomEvent('multiplayerPlayersUpdate', {
          detail: { players: validOthers }
        }));
      } catch (e) {
        console.error('[Multiplayer] tick error:', e);
      }
    };

    tick();
    const interval = setInterval(tick, 1000); // 1s sync rate for now (we can use lerping on client)

    return () => {
      clearInterval(interval);
    };
  }, [user, currentChannel, envUrl]);

  return null;
}