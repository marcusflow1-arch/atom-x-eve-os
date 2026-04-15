import React from 'react';
import TransparentModel3DViewer from './TransparentModel3DViewer';

export default function AvatarStatsAndViewer({ modelUrl, weaponModelUrl, triggerAnimation, bannerBackgroundUrl, playerSpawn }) {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Stats Card - Avatar Stats Above */}
      <div className="w-full rounded-2xl bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-400/30 backdrop-blur-md p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Gamer Score</p>
            <p className="text-white font-bold text-lg">12,450</p>
          </div>
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">AI Points</p>
            <p className="text-white font-bold text-lg">8,920</p>
          </div>
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Level</p>
            <p className="text-white font-bold text-lg">42</p>
          </div>
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Playtime</p>
            <p className="text-white font-bold text-lg">246h</p>
          </div>
        </div>
      </div>

      {/* Live 3D Avatar Viewer */}
      <div className="w-full rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md overflow-hidden" style={{ height: '380px' }}>
        {modelUrl && (
          <TransparentModel3DViewer
            modelUrl={modelUrl}
            weaponModel={weaponModelUrl}
            triggerAnimation={triggerAnimation}
            backgroundUrl={bannerBackgroundUrl}
            roomModelUrl={null}
            activeScene={null}
            isStatsOpen={false}
            playerSpawn={playerSpawn}
            useMeshCollision={false}
            equippedWeaponUrl={weaponModelUrl}
            drawEffectUrl="https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/2d967f68b_jetpack_effect.glb" />
        )}
      </div>
    </div>
  );
}