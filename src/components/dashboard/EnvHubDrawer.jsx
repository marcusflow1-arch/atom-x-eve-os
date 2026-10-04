import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Globe2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import './environment-rollout.css';

const DEFAULT_ENVIRONMENT = {
  id: 'default_room',
  name: 'Standard Quarters',
  description: 'Luna default environment',
  thumbnail: '',
};

function imageFor(row) {
  return row?.thumbnail_url
    || row?.preview_image
    || row?.preview_image_url
    || row?.image_url
    || row?.background_image
    || row?.cover_image
    || '';
}

function labelFor(row, fallback) {
  return row?.name || row?.title || fallback;
}

function environmentFromLayout(layout, index) {
  return {
    id: layout.id,
    name: labelFor(layout, `Environment ${index + 1}`),
    description: layout.description || 'Scene environment',
    thumbnail: imageFor(layout),
  };
}

function environmentFromModel(model, index) {
  return {
    id: model.id,
    name: labelFor(model, `Environment ${index + 1}`),
    description: model.description || '3D environment',
    thumbnail: imageFor(model),
  };
}

function uniqueEnvironments(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item?.id || item?.name || '').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getGeometry() {
  if (typeof window === 'undefined') return null;

  const trigger = document.querySelector('[data-luna-environment-hub]');
  const statCard = document.querySelector('[data-luna-avatar-stat-card]');
  const aiBox = document.querySelector('[aria-label="AI Attribute Box"]');

  const triggerRect = trigger?.getBoundingClientRect?.();
  const statRect = statCard?.getBoundingClientRect?.();
  const aiRect = aiBox?.getBoundingClientRect?.();

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const left = Math.max(12, (statRect?.right ?? triggerRect?.left ?? viewportWidth * 0.18) + 10);
  const rightEdge = Math.min(viewportWidth - 12, (aiRect?.left ?? viewportWidth * 0.79) - 10);
  const top = Math.max(90, (triggerRect?.bottom ?? statRect?.top ?? 172) - 6);

  const statBottom = statRect?.bottom ?? Math.min(viewportHeight - 96, top + 190);
  const naturalHeight = Math.max(132, statBottom - top);
  const maxHeight = Math.max(132, viewportHeight - top - 86);
  const height = Math.min(naturalHeight, maxHeight);
  const width = Math.max(360, rightEdge - left);

  return {
    left,
    top,
    width: Math.min(width, viewportWidth - left - 12),
    height,
  };
}

export default function EnvHubDrawer({ open, onClose, currentEnvId }) {
  const [envList, setEnvList] = useState([DEFAULT_ENVIRONMENT]);
  const [selectedEnvId, setSelectedEnvId] = useState(currentEnvId || DEFAULT_ENVIRONMENT.id);
  const [loading, setLoading] = useState(false);
  const [geometry, setGeometry] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    setSelectedEnvId(currentEnvId || DEFAULT_ENVIRONMENT.id);
  }, [currentEnvId]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [layoutResult, modelResult] = await Promise.allSettled([
          base44.entities.SceneLayout.list(),
          base44.entities.Model3D.list(),
        ]);

        if (cancelled) return;

        const layouts = layoutResult.status === 'fulfilled' ? (layoutResult.value || []) : [];
        const models = modelResult.status === 'fulfilled' ? (modelResult.value || []) : [];
        const roomModels = models.filter((model) => {
          const name = String(model?.name || '').toLowerCase();
          return name.includes('room') || name.includes('environment') || name.includes('hub');
        });

        const environments = uniqueEnvironments([
          DEFAULT_ENVIRONMENT,
          ...layouts.map(environmentFromLayout),
          ...roomModels.map(environmentFromModel),
        ]);

        setEnvList(environments);
        if (!environments.some((env) => String(env.id) === String(selectedEnvId))) {
          setSelectedEnvId(environments[0]?.id || DEFAULT_ENVIRONMENT.id);
        }
      } catch (error) {
        console.error('[Luna Environment] Failed to load environment choices', error);
        setEnvList([DEFAULT_ENVIRONMENT]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;

    const update = () => setGeometry(getGeometry());
    const frame = window.requestAnimationFrame(update);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    document.body.dataset.lunaEnvironmentOpen = 'true';

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    const closeFromDashboard = () => onClose?.();
    const closeOnOutside = (event) => {
      const trigger = document.querySelector('[data-luna-environment-hub]');
      if (panelRef.current?.contains(event.target)) return;
      // The trigger owns its own toggle. Do not pre-close it on pointer-down,
      // otherwise its following click immediately opens the rollout again.
      if (trigger?.contains(event.target)) return;
      onClose?.();
    };

    window.addEventListener('keydown', closeOnEscape, true);
    window.addEventListener('closeEnvironmentHub', closeFromDashboard);
    document.addEventListener('pointerdown', closeOnOutside, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('keydown', closeOnEscape, true);
      window.removeEventListener('closeEnvironmentHub', closeFromDashboard);
      document.removeEventListener('pointerdown', closeOnOutside, true);
      delete document.body.dataset.lunaEnvironmentOpen;
    };
  }, [open, onClose]);

  const environments = useMemo(() => envList.slice(0, 12), [envList]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && geometry && (
        <motion.section
          ref={panelRef}
          data-luna-env-rollout
          aria-label="Environment selector"
          className="luna-environment-rollout"
          style={geometry}
          initial={{ opacity: 0, y: -7, clipPath: 'inset(0 0 100% 0)' }}
          animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
          exit={{ opacity: 0, y: -5, clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.34, ease: [0.22, 0.82, 0.24, 1] }}
        >
          <div className="luna-environment-rollout__head">
            <div className="luna-environment-rollout__title"><Globe2 /> Environments</div>
            <div className="luna-environment-rollout__hint">Visual switching comes later</div>
          </div>

          <div className="luna-environment-rollout__body">
            {loading && environments.length <= 1 ? (
              <div className="luna-environment-rollout__empty">
                <span className="luna-environment-rollout__loading"><Loader2 className="animate-spin" /> Loading environments</span>
              </div>
            ) : (
              <div className="luna-environment-rollout__scroller">
                {environments.map((env) => {
                  const selected = String(selectedEnvId) === String(env.id);
                  const active = String(currentEnvId || DEFAULT_ENVIRONMENT.id) === String(env.id);
                  return (
                    <button
                      key={env.id}
                      type="button"
                      className="luna-environment-rollout__card"
                      data-selected={selected || undefined}
                      aria-pressed={selected}
                      onClick={() => setSelectedEnvId(env.id)}
                      title="Environment switching will be connected in a later pass"
                    >
                      <div className="luna-environment-rollout__thumb">
                        {env.thumbnail ? <img src={env.thumbnail} alt="" draggable={false} /> : null}
                      </div>
                      <div className="luna-environment-rollout__wash" />
                      <div className="luna-environment-rollout__meta">
                        <span className="luna-environment-rollout__name">{env.name}</span>
                        <span className="luna-environment-rollout__sub">
                          {active && <span className="luna-environment-rollout__dot" />}
                          {active ? 'Current environment' : env.description || 'Environment'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>,
    document.body,
  );
}
