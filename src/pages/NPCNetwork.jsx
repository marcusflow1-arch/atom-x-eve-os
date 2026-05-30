import React from 'react';
import NPCNetworkSystem from '@/components/game3d/npc/NPCNetworkSystem';

export default function NPCNetwork() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#06080f]">
      <NPCNetworkSystem />
    </div>
  );
}