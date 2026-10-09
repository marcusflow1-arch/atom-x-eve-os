import { useEffect, useMemo, useState } from 'react';
import { Globe2, Loader2, Plus, X, Mountain } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { loadEnvironmentChoices, resolveEnvironmentChoice } from './environmentQuickCatalog.mjs';
import { MAX_ENVIRONMENT_PINS, readEnvironmentPins, writeEnvironmentPins } from './environmentQuickPins.mjs';

// Rendered directly to the right of the Environment icon's silver divider.
// An empty square opens the full Hub once for pinning; a filled square applies
// a real accessible 3D environment immediately without launching a window.
export default function EnvironmentFavoriteSlots({ currentEnvId, defaultModelUrl, onSelectEnv, onOpenHub }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [pins, setPins] = useState(() => readEnvironmentPins(userId));
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setPins(readEnvironmentPins(userId));
    setCatalog([]);
    setError('');
    const sync = event => {
      if (String(event.detail?.userId) === String(userId || 'guest')) {
        setPins(readEnvironmentPins(userId));
      }
    };
    window.addEventListener('lunaEnvironmentPinsChanged', sync);
    return () => window.removeEventListener('lunaEnvironmentPinsChanged', sync);
  }, [userId]);

  const pinSignature = pins.join('|');
  useEffect(() => {
    if (!pins.length) { setCatalog([]); return; }
    let cancelled = false;
    setLoading(true);
    loadEnvironmentChoices(base44, userId)
      .then(result => { if (!cancelled) setCatalog(result); })
      .catch(cause => { if (!cancelled) setError(cause?.message || 'Could not load pinned environments.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, pinSignature]);

  const choices = useMemo(() => new Map(catalog.map(env => [String(env.id), env])), [catalog]);
  const openHub = () => onOpenHub?.();
  const removePin = id => {
    const next = writeEnvironmentPins(userId, pins.filter(existing => existing !== id));
    if (next.ok) { setPins(next.pins); setError(''); }
    else setError('Could not remove pinned environment.');
  };
  const applyPin = async id => {
    if (loading || applying || !id) return;
    const env = choices.get(id);
    if (!env) { setError('This pinned environment is no longer available. Remove the pin and choose another.'); return; }
    if (String(currentEnvId || 'default_room') === id) return;
    setApplying(id);
    setError('');
    try {
      const resolved = await resolveEnvironmentChoice(env, base44, defaultModelUrl);
      await onSelectEnv?.(resolved);
    } catch (cause) {
      setError(cause?.message || 'Could not apply your pinned environment.');
    } finally {
      setApplying('');
    }
  };
  return (
    <div className="luna-env-quickslots" role="group" aria-label="Pinned favorite environments" data-luna-environment-shortcuts>
      {Array.from({ length: MAX_ENVIRONMENT_PINS }, (_, index) => {
        const id = pins[index] || '';
        const item = choices.get(id);
        const active = id && String(currentEnvId || 'default_room') === id;
        const busy = applying === id;
        return <div key={index} className="luna-env-quickslot-shell" data-environment-slot={index + 1}>
          <button type="button" className="luna-env-quickslot"
            aria-label={id ? (item ? `Activate favorite environment ${item.name}` : `Unavailable pinned environment, slot ${index + 1}`) : `Pin favorite environment in slot ${index + 1}`}
            aria-pressed={Boolean(active)}
            title={id ? (item?.name || (loading ? 'Loading pinned environment…' : 'Environment unavailable')) : 'Pin an environment in the Environment Hub'}
            onClick={() => id ? applyPin(id) : openHub()}
            disabled={Boolean(id && (loading || busy))}
            style={{ '--luna-env-color': ['#86cbec', '#91c2b4', '#b6a2d8', '#e0b998'][index] }}>
            {item?.thumbnail ? <img src={item.thumbnail} alt="" loading="lazy" /> :
              id ? (busy || loading ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <Mountain size={19} aria-hidden="true" />)
                : <Plus size={18} aria-hidden="true" />}
            {active && <span className="luna-env-quickslot-active" aria-hidden="true" />}
          </button>
          {id && <button type="button" className="luna-env-quickslot-remove"
            aria-label={`Unpin environment in slot ${index + 1}`} title="Remove favorite"
            onClick={() => removePin(id)}><X size={10} aria-hidden="true" /></button>}
        </div>;
      })}
      <span className="sr-only" role="status">{error || (loading ? 'Loading favorite environments.' : '')}</span>
    </div>
  );
}
