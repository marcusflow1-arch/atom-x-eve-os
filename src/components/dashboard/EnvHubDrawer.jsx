import { useEffect, useMemo, useState } from 'react';
import { Check, Globe2, Loader2, RefreshCw, ImageOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import './luna-environment-window.css';

const DEFAULT_ENVIRONMENT = {
  id: 'default_room',
  name: 'Standard Quarters',
  description: 'Your default Luna 3D environment.',
  rarity: 'Common',
  origin: 'Default',
};

const SCENE_PATTERN = /environment|scene|room|landscape|world|hub|skybox|town|village|terrain|arena|garden|cave|temple|forest|castle|home|house|loft|outpost|plaza|city|map/i;

function asLibraryEnvironment(row) {
  return {
    ...row,
    origin: row.game_origin || 'My environments',
    thumbnail: row.thumbnail_url || row.preview_image_url || '',
    modelUrl: row.model_url || '',
    sceneLayoutId: row.scene_layout_id || null,
    selectable: Boolean(row.model_url || row.scene_layout_id),
  };
}

function asSceneEnvironment(scene) {
  return {
    id: 'scene-' + scene.id,
    name: scene.name || '3D Scene',
    description: scene.description || 'Saved 3D environment',
    origin: '3D Scenes',
    thumbnail: scene.thumbnail_url || scene.thumbnail || scene.preview_url || '',
    modelUrl: scene.environment_url || '',
    layoutData: scene,
    sceneLayoutId: scene.id,
    playerSpawn: scene.player_spawn,
    useMeshCollision: scene.use_mesh_collision || false,
    selectable: Boolean(scene.environment_url || scene.model_url || scene.objects?.length),
  };
}

function asModelEnvironment(model) {
  return {
    id: 'model-' + model.id,
    name: model.name || '3D Environment',
    description: model.description || '3D background',
    origin: '3D Environments',
    thumbnail: model.thumbnail_url || '',
    modelUrl: model.file_url,
    playerSpawn: model.player_spawn,
    useMeshCollision: model.use_mesh_collision || false,
    selectable: true,
  };
}

export default function EnvHubDrawer({ open = true, onClose, currentEnvId, onSelectEnv, defaultModelUrl }) {
  const { user } = useAuth();
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    (async () => {
      try {
        // Read the real, admin-managed scene and model data, and the player's
        // environment collection. Do not introduce stock wallpaper previews.
        const [owned, scenes, models] = await Promise.all([
          user?.id ? base44.entities.EnvironmentInstance.filter({ owner_id: user.id }) : Promise.resolve([]),
          base44.entities.SceneLayout.list().catch(() => []),
          base44.entities.Model3D.list().catch(() => []),
        ]);
        if (cancelled) return;
        const collection = (owned || [])
          .filter(row => String(row.owner_id) === String(user?.id))
          .map(asLibraryEnvironment)
          .filter(row => row.selectable);
        const layouts = (scenes || []).map(asSceneEnvironment).filter(row => row.selectable);
        const sceneModels = (models || [])
          .filter(model => model.file_url && SCENE_PATTERN.test(`${model.name || ''} ${model.description || ''}`))
          .map(asModelEnvironment);
        // Remove repeated 3D model URLs so each backdrop appears only once.
        const deduped = new Map();
        for (const item of [DEFAULT_ENVIRONMENT, ...collection, ...layouts, ...sceneModels]) {
          const key = item.modelUrl || item.layoutData?.environment_url || item.id;
          if (!deduped.has(key)) deduped.set(key, item);
        }
        setEnvironments([...deduped.values()]);
      } catch (cause) {
        if (!cancelled) setError(cause?.message || 'Could not load your environments.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, user?.id, retry]);

  const selected = useMemo(() =>
    environments.find(item => String(item.id) === String(selectedId)) || null,
    [environments, selectedId]);

  const applyEnvironment = async (item) => {
    if (!item || applying || !item.selectable && item.id !== 'default_room') return;
    setApplying(true);
    setError('');
    try {
      let layoutData = item.layoutData || null;
      if (!layoutData && item.sceneLayoutId) {
        const list = await base44.entities.SceneLayout.filter({ id: item.sceneLayoutId });
        layoutData = list?.[0] || null;
      }
      const modelUrl = item.id === 'default_room' ? defaultModelUrl : (item.modelUrl || layoutData?.environment_url);
      if (!modelUrl && !layoutData?.objects?.length) {
        throw new Error('This environment has no playable 3D scene attached.');
      }
      await onSelectEnv?.({
        ...item,
        modelUrl,
        layoutData,
        playerSpawn: item.playerSpawn || layoutData?.player_spawn,
        useMeshCollision: item.useMeshCollision || layoutData?.use_mesh_collision || false,
      });
      onClose?.();
    } catch (cause) {
      setError(cause?.message || 'Could not change the 3D background.');
    } finally {
      setApplying(false);
    }
  };

  if (!open) return null;
  return (
    <section id="luna-environment-collection" data-luna-environment-picker
      className="luna-env-picker" aria-label="Choose 3D environment">
      <div className="luna-env-picker__heading">
        <div className="luna-env-picker__heading-icon"><Globe2 size={21} aria-hidden="true" /></div>
        <div className="min-w-0">
          <h2>3D Environments</h2>
          <p>Choose the background for your Luna dashboard.</p>
        </div>
        <span className="luna-env-picker__count" aria-label="Available environment count">{loading ? '…' : environments.length}</span>
      </div>
      {error && (
        <div role="alert" className="luna-env-picker__error">
          <span>{error}</span>
          <button type="button" onClick={() => setRetry(value => value + 1)}><RefreshCw size={13}/> Retry</button>
        </div>
      )}
      <div className="luna-env-picker__list" aria-busy={loading}>
        {loading ? <div className="luna-env-picker__empty"><Loader2 size={20} className="animate-spin" /> Loading environments…</div> :
          <div className="luna-env-picker__grid">
            {environments.map(item => {
              const active = String(currentEnvId || 'default_room') === String(item.id);
              const chosen = String(selectedId) === String(item.id);
              return <button type="button" key={item.id} data-env-id={item.id}
                aria-pressed={chosen || active && !selectedId}
                className="luna-env-picker__card" onClick={() => { setSelectedId(item.id); setError(''); }}>
                <div className="luna-env-picker__preview">
                  {item.thumbnail ? <img src={item.thumbnail} alt="" loading="lazy"/> : <Globe2 size={30} aria-hidden="true" />}
                  {active && <span className="luna-env-picker__active"><Check size={11} /> Active</span>}
                </div>
                <div className="luna-env-picker__label">
                  <strong title={item.name}>{item.name}</strong>
                  <small>{item.origin}</small>
                </div>
              </button>;
            })}
          </div>}
        {!loading && !environments.length && <div className="luna-env-picker__empty"><ImageOff size={19} /> No 3D environments found.</div>}
      </div>
      <footer className="luna-env-picker__footer">
        <span>{selected?.name || 'Select an environment'}</span>
        <button type="button" disabled={!selected || applying || String(currentEnvId || 'default_room') === String(selected.id)}
          onClick={() => applyEnvironment(selected)}>
          {applying ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          {selected && String(currentEnvId || 'default_room') === String(selected.id) ? 'Active' : 'Apply background'}
        </button>
      </footer>
    </section>
  );
}
