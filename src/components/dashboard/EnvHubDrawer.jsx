import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Globe2, Loader2, X, Check, ArrowRight, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import './environment-rollout.css';

const DEFAULT_ENVIRONMENT = { id: 'default_room', name: 'Standard Quarters', description: 'Your starting Luna environment.', rarity: 'Common', unlocked_via: 'default' };

function collectionGeometry() {
  const rect = selector => document.querySelector(selector)?.getBoundingClientRect();
  const home = rect('[data-luna-home-tile]');
  const topBar = rect('.glass-page-top-bar');
  const bottomBar = rect('.glass-page-bottom-bar');
  const top = Math.max(0, topBar?.bottom ?? 64);
  const bottom = Math.min(window.innerHeight, bottomBar?.top ?? window.innerHeight - 48);
  // Desktop aligns exactly with the Home tile; compact layouts use the full width.
  const left = window.innerWidth < 760 ? 0 : Math.min(home?.left ?? window.innerWidth / 2, window.innerWidth - 360);
  return { left: Math.max(0, left), right: 0, top, height: Math.max(0, bottom - top) };
}

export default function EnvHubDrawer({ open, onClose, currentEnvId, onSelectEnv, defaultModelUrl }) {
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState(null);
  const [applying, setApplying] = useState(false);
  const [geometry, setGeometry] = useState(null);
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setSelected(null);
    setEnvironments([]);
    (async () => {
      try {
        if (!user?.id) throw new Error('Sign in to see your collected environments.');
        const owned = await base44.entities.EnvironmentInstance.filter({ owner_id: user.id });
        if (cancelled) return;
        const rows = (owned || []).filter(row => String(row.owner_id) === String(user.id));
        const unique = [...new Map(rows.map(row => [row.id, row])).values()];
        unique.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setEnvironments([DEFAULT_ENVIRONMENT, ...unique.filter(row => row.id !== 'default_room')]);
      } catch (cause) {
        if (!cancelled) setError(cause?.message || 'Could not load your collection. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, user?.id, retry]);

  useEffect(() => {
    if (!open) return;
    const update = () => setGeometry(collectionGeometry());
    update();
    const frame = requestAnimationFrame(() => {
      update();
      panelRef.current?.querySelector('[data-collection-close]')?.focus({ preventScroll: true });
    });
    const observer = new ResizeObserver(update);
    for (const selector of ['.glass-page-top-bar', '.glass-page-bottom-bar', '[data-luna-home-tile]', '[data-luna-dashboard-content]']) {
      const element = document.querySelector(selector);
      if (element) observer.observe(element);
    }
    const onKey = event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      closeRef.current?.();
      document.querySelector('[data-luna-environment-trigger]')?.focus({ preventScroll: true });
    };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const applyEnvironment = async () => {
    if (!selected || applying) return;
    setApplying(true);
    setError('');
    try {
      let layoutData = null;
      if (selected.scene_layout_id) {
        const layouts = await base44.entities.SceneLayout.filter({ id: selected.scene_layout_id });
        layoutData = layouts?.[0] || null;
      }
      const modelUrl = selected.id === 'default_room' ? defaultModelUrl : selected.model_url;
      if (!modelUrl && !layoutData) throw new Error('This environment does not have a scene attached yet.');
      await onSelectEnv?.({
        ...selected, modelUrl, layoutData,
        playerSpawn: layoutData?.player_spawn,
        useMeshCollision: layoutData?.use_mesh_collision || false,
      });
    } catch (cause) {
      setError(cause?.message || 'Could not apply this environment.');
    } finally {
      setApplying(false);
    }
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && geometry && (
        <motion.section ref={panelRef} id="luna-environment-collection" role="dialog" aria-modal="false"
          aria-labelledby="luna-environment-title" className="luna-environment-collection" style={geometry}
          initial={{ clipPath: 'inset(0 0 0 100%)' }} animate={{ clipPath: 'inset(0 0 0 0%)' }}
          exit={{ clipPath: 'inset(0 0 0 100%)' }} transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.22, 0.82, 0.24, 1] }}>
          <header className="luna-environment-collection__header">
            <div><span className="luna-environment-collection__eyebrow">Luna / Your collection</span>
              <h2 id="luna-environment-title"><Globe2 aria-hidden="true" /> Environments</h2>
              <p>The worlds you have collected, all in one place.</p>
            </div>
            <button type="button" data-collection-close aria-label="Close environments" onClick={() => {
              onClose?.();
              document.querySelector('[data-luna-environment-trigger]')?.focus({ preventScroll: true });
            }}><X size={18} /></button>
          </header>
          <div className="luna-environment-collection__status">
            <span>{loading ? 'Loading collection' : `${environments.length} environments`}</span>
            <span>Collected</span>
          </div>
          {error && <div className="luna-environment-collection__error" role="alert"><p>{error}</p>
            {!environments.length && <button type="button" onClick={() => setRetry(value => value + 1)}><RefreshCw size={14} /> Try again</button>}
          </div>}
          <div className="luna-environment-collection__scroll" aria-busy={loading}>
            {loading ? <div className="luna-environment-collection__empty"><Loader2 className="animate-spin" /> Loading your environments…</div> :
              <div className="luna-environment-collection__grid">
                {environments.map(env => {
                  const active = String(currentEnvId || 'default_room') === String(env.id);
                  const preview = env.thumbnail_url || env.preview_image_url;
                  return <button type="button" key={env.id} className="luna-environment-collection__card"
                    aria-pressed={selected?.id === env.id} onClick={() => { setSelected(env); setError(''); }}>
                    <div className="luna-environment-collection__image">
                      {preview ? <img src={preview} alt="" loading="lazy" /> : <Globe2 aria-hidden="true" />}
                      <span className="luna-environment-collection__rarity">{env.rarity || 'Common'}</span>
                      {active && <span className="luna-environment-collection__active"><Check size={11} /> Active</span>}
                    </div>
                    <div className="luna-environment-collection__meta"><strong>{env.name}</strong>
                      <span>{env.game_origin || (env.id === 'default_room' ? 'Included with Luna' : 'Collected environment')}</span>
                      <small>Environment{env.environment_rank ? ` · Rank ${env.environment_rank}` : ''}</small>
                    </div>
                  </button>;
                })}
              </div>}
          </div>
          <footer className="luna-environment-collection__footer">
            {selected ? <><div><strong>{selected.name}</strong><p>{selected.description || 'Ready for your dashboard.'}</p></div>
              <button type="button" disabled={applying || String(currentEnvId) === String(selected.id)}
                onClick={applyEnvironment}>{applying ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                {String(currentEnvId) === String(selected.id) ? 'Active' : 'Use environment'}</button></> :
              <p>Select an environment to see its details.</p>}
          </footer>
        </motion.section>
      )}
    </AnimatePresence>, document.body,
  );
}
