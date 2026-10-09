import { useEffect, useMemo, useState } from 'react';
import { Check, Globe2, Loader2, RefreshCw, ImageOff, Pin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { loadEnvironmentChoices, resolveEnvironmentChoice } from './environmentQuickCatalog.mjs';
import { readEnvironmentPins, toggleEnvironmentPin } from './environmentQuickPins.mjs';
import './luna-environment-window.css';

export default function EnvHubDrawer({ open = true, onClose, currentEnvId, onSelectEnv, defaultModelUrl }) {
  const { user } = useAuth();
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [applying, setApplying] = useState(false);
  const [pins, setPins] = useState(() => readEnvironmentPins(user?.id));

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const choices = await loadEnvironmentChoices(base44, user?.id);
        if (!cancelled) setEnvironments(choices);
      } catch (cause) {
        if (!cancelled) setError(cause?.message || 'Could not load your environments.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, user?.id, retry]);

  useEffect(() => {
    setPins(readEnvironmentPins(user?.id));
    const sync = event => {
      if (String(event.detail?.userId) === String(user?.id || 'guest')) setPins(readEnvironmentPins(user?.id));
    };
    window.addEventListener('lunaEnvironmentPinsChanged', sync);
    return () => window.removeEventListener('lunaEnvironmentPinsChanged', sync);
  }, [user?.id]);

  const togglePin = item => {
    const result = toggleEnvironmentPin(user?.id, item.id);
    if (result.full) setError('All four favorites are pinned. Unpin one before choosing another.');
    else if (!result.ok) setError('Could not save your pinned environments.');
    else { setPins(result.pins); setError(''); }
  };

  const selected = useMemo(() =>
    environments.find(item => String(item.id) === String(selectedId)) || null,
    [environments, selectedId]);

  const applyEnvironment = async (item) => {
    if (!item || applying || !item.selectable && item.id !== 'default_room') return;
    setApplying(true);
    setError('');
    try {
      await onSelectEnv?.(await resolveEnvironmentChoice(item, base44, defaultModelUrl));
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
          <p>Choose your 3D background. Pin up to four for one-click access above.</p>
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
              return <div key={item.id} className="luna-env-picker__cell">
                <button type="button" data-env-id={item.id}
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
              </button>
                <button type="button" className="luna-env-picker__pin"
                  aria-label={pins.includes(String(item.id)) ? `Unpin ${item.name}` : `Pin ${item.name} to quick access`}
                  title={pins.includes(String(item.id)) ? 'Remove from quick access' : 'Pin to one of four shortcuts'}
                  aria-pressed={pins.includes(String(item.id))}
                  onClick={() => togglePin(item)}><Pin size={14} fill={pins.includes(String(item.id)) ? 'currentColor' : 'none'} aria-hidden="true" /></button>
              </div>;
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
