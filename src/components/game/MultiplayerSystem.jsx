import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

export default function MultiplayerSystem({ envUrl }) {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user?.id) return;
    
    // We poll and update our own PlayerState 
    // This allows others to see us online in the FriendsList and join our environment
    const broadcastInterval = setInterval(() => {
      base44.entities.PlayerState.update(user.id, {
        player_id: user.id,
        display_name: user.full_name || user.username || 'Player',
        avatar_url: user.avatar_url,
        channel_id: 'dashboard',
        env_url: envUrl,
        last_update: Date.now()
      }).catch(err => {
        if (err?.status === 404 || err?.message?.includes('not found')) {
          base44.entities.PlayerState.create({
            id: user.id,
            player_id: user.id,
            display_name: user.full_name || user.username || 'Player',
            avatar_url: user.avatar_url,
            channel_id: 'dashboard',
            env_url: envUrl,
            last_update: Date.now(),
            status: 'online'
          }).catch(e => console.log('PlayerState create error:', e));
        }
      });
    }, 2000); // 2 second heartbeat

    return () => {
      clearInterval(broadcastInterval);
    };
  }, [user, envUrl]);

  return null;
}