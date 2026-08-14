import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import AvatarFeatureRail from './AvatarFeatureRail';

function findEnvironmentHubTile() {
  const nodes = Array.from(document.querySelectorAll('h4'));
  const heading = nodes.find(node => node.textContent?.trim() === 'Environment Hub');
  if (!heading) return null;
  let el = heading.closest('div');
  for (let i = 0; i < 8 && el; i += 1) {
    const rect = el.getBoundingClientRect();
    if (rect.width >= 180 && rect.width <= 300 && rect.height >= 70 && rect.height <= 150) return el;
    el = el.parentElement;
  }
  return heading.parentElement?.parentElement || null;
}

export default function DashboardAvatarFeaturePortal() {
  const [host, setHost] = useState(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let frame = 0;
    let marker = null;

    const sync = () => {
      const hub = findEnvironmentHubTile();
      const focusOpen = Boolean(document.querySelector('[data-avatar-focus-hub="true"]'));
      setHidden(focusOpen || !hub);

      if (!hub) {
        if (marker?.isConnected) marker.remove();
        marker = null;
        setHost(null);
        return;
      }

      const rect = hub.getBoundingClientRect();
      if (!marker || !marker.isConnected) {
        marker = document.createElement('div');
        marker.dataset.atomAvatarFeatureRail = 'true';
        marker.style.position = 'fixed';
        marker.style.zIndex = '35';
        marker.style.pointerEvents = 'auto';
        document.body.appendChild(marker);
        setHost(marker);
      }

      marker.style.left = `${Math.max(16, rect.left)}px`;
      marker.style.top = `${Math.min(window.innerHeight - 120, rect.bottom + 12)}px`;
      marker.style.width = `${Math.max(280, Math.min(window.innerWidth - Math.max(16, rect.left) - 24, 980))}px`;
      marker.style.maxHeight = `${Math.max(220, window.innerHeight - rect.bottom - 28)}px`;
      marker.style.overflow = 'auto';
      marker.style.scrollbarWidth = 'none';
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      marker?.remove();
    };
  }, []);

  if (!host || hidden) return null;
  return createPortal(
    <div className="w-full">
      <AvatarFeatureRail />
    </div>,
    host
  );
}
