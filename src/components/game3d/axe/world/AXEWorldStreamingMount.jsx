import { useEffect, useRef } from 'react';
import {
  AXEWorldStreamingSystem,
  createAXEInitialWorldManifest,
} from './AXEWorldStreamingSystem';
import {
  getPlayerPosition,
  subscribePlayerPosition,
} from '../../playerPositionStore';

const STORAGE_KEY = 'axe_world_streaming_v1';

function loadSnapshot() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSnapshot(snapshot) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Streaming must keep working even when storage is unavailable.
  }
}

export default function AXEWorldStreamingMount() {
  const systemRef = useRef(null);

  useEffect(() => {
    const manifest = createAXEInitialWorldManifest();
    const system = new AXEWorldStreamingSystem({
      ...manifest,
      onActivate: (region) => {
        window.dispatchEvent(new CustomEvent('axeRegionActivated', { detail: region }));
      },
      onDeactivate: (region) => {
        window.dispatchEvent(new CustomEvent('axeRegionDeactivated', { detail: region }));
      },
      onPOIDiscovered: (poi) => {
        window.dispatchEvent(new CustomEvent('axePOIDiscovered', { detail: poi }));
      },
    });

    const saved = loadSnapshot();
    if (saved) system.restore(saved);

    systemRef.current = system;
    window.__axeWorldStreaming = system;

    const updateFromPosition = (p) => {
      const snapshot = system.update([p?.x || 0, 0, p?.z || 0]);
      saveSnapshot(snapshot);
      window.dispatchEvent(new CustomEvent('axeWorldStreamingUpdated', { detail: snapshot }));
    };

    updateFromPosition(getPlayerPosition());
    const unsubscribe = subscribePlayerPosition(updateFromPosition);

    return () => {
      unsubscribe?.();
      saveSnapshot(system.snapshot());
      if (window.__axeWorldStreaming === system) window.__axeWorldStreaming = null;
      systemRef.current = null;
    };
  }, []);

  return null;
}
