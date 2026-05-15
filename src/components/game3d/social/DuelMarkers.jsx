import React, { useEffect, useRef, useState } from 'react';

/**
 * DuelMarkers — overlays a red ring under each player in an active duel.
 * Reads:
 *   - duelMarker event (active state + challenger/opponent ids)
 *   - window.__duelFeetPositions (screen-space feet positions, updated each frame by GameWorld3D)
 * Renders absolutely-positioned circles on top of the canvas.
 */
export default function DuelMarkers({ localUserId }) {
  const [active, setActive] = useState(false);
  const [ids, setIds] = useState({ challengerId: null, opponentId: null });
  const [, force] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const onMarker = (e) => {
      const d = e.detail;
      if (d?.active) {
        setActive(true);
        setIds({ challengerId: d.challengerId, opponentId: d.opponentId });
      } else {
        setActive(false);
      }
    };
    window.addEventListener('duelMarker', onMarker);
    return () => window.removeEventListener('duelMarker', onMarker);
  }, []);

  // Re-render every ~50ms while active so the markers track player positions
  useEffect(() => {
    if (!active) return;
    const tick = () => { force((n) => (n + 1) & 0xff); rafRef.current = setTimeout(tick, 50); };
    tick();
    return () => clearTimeout(rafRef.current);
  }, [active]);

  if (!active) return null;
  const feet = window.__duelFeetPositions || { local: null, remotes: {} };
  const otherId = ids.challengerId === localUserId ? ids.opponentId : ids.challengerId;
  const localPos = feet.local;
  const remotePos = feet.remotes?.[otherId] || null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {localPos && <Ring x={localPos.x} y={localPos.y} />}
      {remotePos && <Ring x={remotePos.x} y={remotePos.y} />}
    </div>
  );
}

function Ring({ x, y }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 36,
        top: y - 14,
        width: 72,
        height: 28,
        borderRadius: '50%',
        border: '2px solid rgba(239, 68, 68, 0.9)',
        boxShadow: '0 0 18px rgba(239, 68, 68, 0.7), inset 0 0 12px rgba(239, 68, 68, 0.45)',
        background: 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0) 70%)',
        animation: 'duelRingPulse 1.2s ease-in-out infinite',
      }}
    >
      <style>{`@keyframes duelRingPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:0.7}}`}</style>
    </div>
  );
}