import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import GenesisModelPreview from '@/components/onboarding/GenesisModelPreview';
import {
  CREATOR_PARENTING_PREVIEW,
  findCreatorChildModel,
} from '@/components/parenting/parentingSystem';

const childProfile = CREATOR_PARENTING_PREVIEW.children[0];

export default function AdminParentingChild({ enabled = false, className = '' }) {
  const [modelUrl, setModelUrl] = useState(childProfile.fallbackModelUrl);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    (async () => {
      try {
        const cached = Array.isArray(window.__model3dCache) ? window.__model3dCache : null;
        const models = cached || await base44.entities.Model3D.list('-created_date', 200);
        if (!cached) window.__model3dCache = models;
        const model = findCreatorChildModel(models, childProfile);
        if (!cancelled && model?.file_url) setModelUrl(model.file_url);
      } catch (error) {
        console.warn('Parenting preview child model lookup unavailable', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!enabled) return null;

  const config = {
    name: childProfile.displayName,
    gender: childProfile.gender,
    female_model_variant: 'greco_girl',
    model_url: modelUrl,
    style_preset: 'heroic_fantasy',
    hood_enabled: false,
    weapon_visible: false,
  };

  return (
    <div
      className={`pointer-events-none absolute bottom-[5%] left-[8%] z-[3] h-[78%] w-[30%] min-w-[130px] max-w-[250px] ${className}`}
      data-parenting-preview="creator-daughter"
      aria-label="Creator parenting preview daughter"
    >
      <GenesisModelPreview
        config={config}
        compact
        controls="none"
        idleOnly
        interactive={false}
      />
    </div>
  );
}
