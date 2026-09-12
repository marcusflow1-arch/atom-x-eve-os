import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import {
  DEFAULT_ENVIRONMENT_CONFIG,
  configStorageKey,
  normalizeEnvironmentConfig,
} from './environmentHubCatalog';

function readConfig(userId) {
  if (typeof window === 'undefined') return normalizeEnvironmentConfig(DEFAULT_ENVIRONMENT_CONFIG);
  try {
    const raw = localStorage.getItem(configStorageKey(userId));
    return normalizeEnvironmentConfig(raw ? JSON.parse(raw) : DEFAULT_ENVIRONMENT_CONFIG);
  } catch {
    return normalizeEnvironmentConfig(DEFAULT_ENVIRONMENT_CONFIG);
  }
}

/**
 * Transparent presentation layer for the live Luna environment.
 *
 * The old Environment Hub painted stock images over the dashboard and made the
 * active 3D environment look like a screenshot preview. That is intentionally
 * gone. The actual SceneLayout / Model3D renderer remains visible underneath;
 * this layer is allowed to add atmosphere only.
 */
export default function EnvironmentHubStageLayer() {
  const { user } = useAuth();
  const [config, setConfig] = useState(() => readConfig(user?.id));

  useEffect(() => {
    setConfig(readConfig(user?.id));
  }, [user?.id]);

  useEffect(() => {
    const onConfig = (event) => {
      if (event.detail) setConfig(normalizeEnvironmentConfig(event.detail));
    };
    window.addEventListener('environmentHubConfigChanged', onConfig);
    return () => window.removeEventListener('environmentHubConfigChanged', onConfig);
  }, []);

  if (!config.weatherId || config.weatherId === 'weather-clear') return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
      {config.weatherId === 'weather-rain' && (
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: 'repeating-linear-gradient(110deg, transparent 0 19px, rgba(184,228,255,.72) 20px, transparent 21px 31px)',
          }}
        />
      )}
      {config.weatherId === 'weather-snow' && (
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.95) 0 1px, transparent 1.5px)',
            backgroundSize: '26px 26px',
          }}
        />
      )}
      {config.weatherId === 'weather-fog' && (
        <div className="absolute inset-0 bg-slate-100/[0.07] backdrop-blur-[1px]" />
      )}
      {config.weatherId === 'weather-storm' && (
        <div className="absolute inset-0 bg-slate-950/20" />
      )}
    </div>
  );
}
