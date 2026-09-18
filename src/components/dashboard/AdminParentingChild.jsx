import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createGenesisScene } from '@/components/onboarding/genesisScene';
import {
  CREATOR_PARENTING_PREVIEW,
  findCreatorChildAnimation,
  findCreatorChildModel,
} from '@/components/parenting/parentingSystem';

const childProfile = CREATOR_PARENTING_PREVIEW.children[0];

export default function AdminParentingChild({ enabled = false, className = '' }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const [asset, setAsset] = useState({ model: null, animation: null });
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!enabled) {
      setAsset({ model: null, animation: null });
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const [models, animations] = await Promise.all([
          base44.entities.Model3D.filter({ id: childProfile.adminModelId }),
          base44.entities.AnimationFBX.filter({ name: childProfile.animationName }),
        ]);

        if (cancelled) return;

        const model = findCreatorChildModel(models, childProfile);
        const animation = findCreatorChildAnimation(animations, childProfile);
        setAsset({ model, animation });
      } catch (error) {
        console.warn('Adaptive child Admin asset lookup unavailable', error);
        if (!cancelled) setAsset({ model: null, animation: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !mountRef.current || !asset.model?.file_url) return undefined;

    let disposed = false;
    setStatus('loading');

    const scene = createGenesisScene(
      mountRef.current,
      asset.model.file_url,
      () => {
        if (disposed) return;

        if (asset.animation?.file_url) {
          setStatus('afk');
          sceneRef.current?.play({
            name: childProfile.animationName,
            clipName: asset.animation.name || childProfile.animationName,
            url: asset.animation.file_url,
            loop: asset.animation.is_loopable !== false,
          });
        } else {
          setStatus('model-ready');
        }
      },
      (nextStatus, motionName) => {
        if (disposed) return;
        if (nextStatus === 'ready' && motionName) setStatus(motionName);
        else setStatus(nextStatus);
      },
      {
        retargetExternalMotions: true,
        initialYaw: 0,
      },
    );

    sceneRef.current = scene;
    scene.appearance({
      name: childProfile.displayName,
      gender: childProfile.gender,
      model_url: asset.model.file_url,
      style_preset: 'heroic_fantasy',
      hood_enabled: false,
      weapon_visible: false,
    });

    return () => {
      disposed = true;
      scene.dispose();
      sceneRef.current = null;
    };
  }, [enabled, asset.model, asset.animation]);

  if (!enabled || !asset.model?.file_url) return null;

  return (
    <div
      className={`pointer-events-none absolute bottom-[5%] left-[32%] z-[3] h-[74%] w-[23%] min-w-[120px] max-w-[235px] ${className}`}
      data-parenting-preview="adaptive-child"
      data-parenting-model={asset.model?.name || ''}
      data-parenting-animation={asset.animation?.name || ''}
      data-parenting-status={status}
      aria-label="Creator adaptive child preview"
    >
      <div ref={mountRef} className="h-full w-full" />
    </div>
  );
}