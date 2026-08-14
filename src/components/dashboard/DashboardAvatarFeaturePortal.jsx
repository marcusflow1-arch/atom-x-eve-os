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

function isVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
}

function pageIsInLibraryOrGameMode() {
  // Full Library is a dedicated landing surface. Prefer the explicit marker
  // when available, with a text fallback for older synced builds.
  if (document.querySelector('[data-library-landing="true"]')) return true;
  const fullLibraryText = Array.from(document.querySelectorAll('span,h1,h2,h3,h4,div')).find(
    node => isVisible(node) && node.textContent?.trim() === 'Full Library'
  );
  if (fullLibraryText) return true;

  // The selected-game panel exposes the existing tab row. Hide the dashboard
  // rail while that panel is open; restore it when the panel closes.
  const gameDetailTabs = new Set(['Overview', 'Discussion', 'Streamers', 'Guide', 'Support', 'Achievements', 'Affiliate']);
  const labels = new Set(
    Array.from(document.querySelectorAll('button'))
      .filter(isVisible)
      .map(button => button.textContent?.trim())
      .filter(Boolean)
  );
  let matched = 0;
  gameDetailTabs.forEach(label => { if (labels.has(label)) matched += 1; });
  if (matched >= 4) return true;

  // Older/current game-detail builds also use a Game Details heading.
  return Array.from(document.querySelectorAll('h2,h3'))
    .some(node => isVisible(node) && node.textContent?.trim() === 'Game Details');
}

export default function DashboardAvatarFeaturePortal() {
  const [host, setHost] = useState(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let frame = 0;
    let marker = null;
    let lastHidden = null;

    const sync = () => {
      const hub = findEnvironmentHubTile();
      const focusOpen = Boolean(document.querySelector('[data-avatar-focus-hub="true"]'));
      const inGameOrLibrary = pageIsInLibraryOrGameMode();
      const nextHidden = focusOpen || inGameOrLibrary || !hub;
      setHidden(nextHidden);
      lastHidden = nextHidden;

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
        marker.style.transition = 'opacity 220ms ease, transform 220ms ease';
        document.body.appendChild(marker);
        setHost(marker);
      }

      marker.style.left = `${Math.max(16, rect.left)}px`;
      marker.style.top = `${Math.min(window.innerHeight - 120, rect.bottom + 12)}px`;
      marker.style.width = `${Math.max(280, Math.min(window.innerWidth - Math.max(16, rect.left) - 24, 980))}px`;
      marker.style.maxHeight = `${Math.max(220, window.innerHeight - rect.bottom - 28)}px`;
      marker.style.overflow = 'auto';
      marker.style.scrollbarWidth = 'none';
      marker.style.opacity = nextHidden ? '0' : '1';
      marker.style.transform = nextHidden ? 'translateY(-6px)' : 'translateY(0)';
      marker.style.pointerEvents = nextHidden ? 'none' : 'auto';
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
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

  if (!host) return null;
  return createPortal(
    <div className="w-full">
      <AvatarFeatureRail />
    </div>,
    host
  );
}
