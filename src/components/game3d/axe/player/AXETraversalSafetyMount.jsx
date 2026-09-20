import { useEffect } from 'react';
import {
  AXE_FALL_CONFIG,
  AXE_INITIAL_TRAVERSAL_TRIGGERS,
  classifyAXEFall,
  isPointInsideAXETrigger,
} from './AXETraversalHooks';

export default function AXETraversalSafetyMount() {
  useEffect(() => {
    let raf = 0;
    let lastTime = performance.now();
    let lastY = window.__localPlayerPos?.y ?? 0;
    let wasGrounded = true;
    let deepestVelocity = 0;
    const triggerState = new Map();

    const tick = (now) => {
      const p = window.__localPlayerPos;
      const dt = Math.max(1 / 240, Math.min(0.1, (now - lastTime) / 1000));
      lastTime = now;

      if (p) {
        const y = Number(p.y || 0);
        const verticalVelocity = (y - lastY) / dt;
        lastY = y;

        // The current browser world uses ground around y=0. We keep a small
        // tolerance so animation bobbing does not spam airborne events.
        const grounded = y <= 0.08 && verticalVelocity <= 0.75;
        if (!grounded) deepestVelocity = Math.min(deepestVelocity, verticalVelocity);

        if (grounded && !wasGrounded) {
          const severity = classifyAXEFall(deepestVelocity);
          window.dispatchEvent(new CustomEvent('axePlayerLanded', {
            detail: { severity, impactVelocity: deepestVelocity },
          }));
          deepestVelocity = 0;
        } else if (!grounded && wasGrounded) {
          window.dispatchEvent(new CustomEvent('axePlayerAirborne', {
            detail: { verticalVelocity },
          }));
        }
        wasGrounded = grounded;

        AXE_INITIAL_TRAVERSAL_TRIGGERS.forEach((trigger) => {
          const inside = isPointInsideAXETrigger(p, trigger);
          const previous = triggerState.get(trigger.id) || false;
          if (inside !== previous) {
            triggerState.set(trigger.id, inside);
            window.dispatchEvent(new CustomEvent(
              inside ? 'axeTriggerEntered' : 'axeTriggerExited',
              { detail: { trigger, playerPosition: { ...p } } },
            ));
          }
        });

        if (y < AXE_FALL_CONFIG.abyssY) {
          window.dispatchEvent(new CustomEvent('playerRespawn', {
            detail: {
              x: 0,
              z: -35,
              spawnId: 'AXE_Spawn_StarterCapitalApproach',
              source: 'axe-fall-safety',
            },
          }));
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}
