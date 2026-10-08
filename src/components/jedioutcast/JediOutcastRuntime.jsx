import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Maximize2, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

const REQUIRED_PAKS = ['assets0.pk3', 'assets1.pk3', 'assets2.pk3', 'assets5.pk3'];

const LABELS = {
  'awaiting-source': 'Connecting original game data',
  checking: 'Checking canonical game data',
  'files-ready': 'Original game data ready',
  starting: 'Starting Jedi Outcast',
  'engine-ready': 'Jedi Outcast running',
  error: 'Engine stopped',
};

function unwrap(value) {
  return value?.data ?? value;
}

export default function JediOutcastRuntime({ onBack }) {
  const { user } = useAuth();
  const frame = useRef(null);
  const shell = useRef(null);
  const leaving = useRef(false);
  const sourceSent = useRef(false);
  const activeFlush = useRef(null);
  const [state, setState] = useState('awaiting-source');
  const [notice, setNotice] = useState('');
  const [exiting, setExiting] = useState(false);
  const [revision, setRevision] = useState(0);

  const sendCanonicalSource = useCallback(async () => {
    if (sourceSent.current || !frame.current?.contentWindow) return;

    try {
      if (user?.role !== 'admin') {
        throw new Error('Jedi Outcast development playback is currently restricted to the app admin.');
      }

      setState('checking');
      const result = unwrap(await base44.functions.invoke('jediOutcastSource', { action: 'status' }));
      if (!result?.success) throw new Error(result?.error || 'Could not read the Jedi Outcast source manifest.');

      const archives = (result.assets || []).filter(asset => asset.category === 'retail_archive');
      const byName = new Map(archives.map(asset => [String(asset.path || '').toLowerCase(), asset]));
      const missing = REQUIRED_PAKS.filter(name => !byName.get(name)?.drive_file_id);
      if (missing.length) {
        throw new Error(`Canonical retail archives are missing from Base44: ${missing.join(', ')}`);
      }

      const paks = REQUIRED_PAKS.map(name => {
        const asset = byName.get(name);
        return {
          name,
          size: Number(asset.byte_size || 0),
          url: `https://drive.usercontent.google.com/download?id=${encodeURIComponent(asset.drive_file_id)}&export=download&confirm=t`,
          sourceAssetId: asset.id,
        };
      });

      sourceSent.current = true;
      frame.current.contentWindow.postMessage({
        type: 'atom-jedi-canonical-source',
        paks,
      }, window.location.origin);
      setState('files-ready');
    } catch (error) {
      setState('error');
      setNotice(error?.message || String(error));
    }
  }, [user?.role]);

  useEffect(() => {
    const onMessage = event => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;

      if (event.data?.type === 'atom-jedi-source-request') {
        sendCanonicalSource();
        return;
      }

      if (event.data?.type === 'atom-jedi-status' && LABELS[event.data.state]) {
        setState(event.data.state);
        if (event.data.state === 'error') setNotice(event.data.detail || 'The engine could not start.');
      }

      if (event.data?.type === 'atom-jedi-flushed' && activeFlush.current?.id === event.data.requestId) {
        activeFlush.current.finish(event.data.error || '');
      }
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      if (activeFlush.current) clearTimeout(activeFlush.current.timer);
    };
  }, [sendCanonicalSource]);

  const leave = action => {
    if (leaving.current) return;
    leaving.current = true;
    setExiting(true);
    setNotice('');

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const finish = error => {
      clearTimeout(activeFlush.current?.timer);
      activeFlush.current = null;
      leaving.current = false;
      setExiting(false);
      if (error) {
        setNotice(error + ' Use the game’s Save menu before leaving.');
        return;
      }
      action();
    };

    activeFlush.current = {
      id,
      finish,
      timer: setTimeout(() => finish('Could not confirm save synchronization.'), 4000),
    };

    frame.current?.contentWindow?.postMessage(
      { type: 'atom-jedi-flush', requestId: id },
      window.location.origin,
    );
  };

  const restart = () => {
    sourceSent.current = false;
    setState('awaiting-source');
    setNotice('');
    setRevision(value => value + 1);
  };

  return (
    <section className="jko-session" ref={shell} aria-label="Jedi Outcast">
      <header className="jko-session-bar">
        <button type="button" aria-label="Back to Luna" disabled={exiting} onClick={() => leave(onBack)}>
          <ArrowLeft size={16} /><span>Back to Luna</span>
        </button>

        <span className="jko-session-label">
          Star Wars Jedi Knight II: Jedi Outcast
          <small role="status">{exiting ? 'Saving…' : (LABELS[state] || state)}</small>
        </span>

        <button type="button" aria-label="Reload game" disabled={exiting} title="Reload Jedi Outcast" onClick={() => leave(restart)}>
          <RotateCcw size={16} /><span>Reload</span>
        </button>

        <button type="button" aria-label="Fullscreen" title="Fullscreen" onClick={() => {
          if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
          else shell.current?.requestFullscreen?.().catch(() => setNotice('Fullscreen was blocked by the browser.'));
        }}>
          <Maximize2 size={16} /><span>Fullscreen</span>
        </button>
      </header>

      {notice && (
        <div className="jko-session-notice" role="alert">
          <span>{notice}</span>
          <button type="button" onClick={onBack}>Return to Luna</button>
        </div>
      )}

      <iframe
        key={revision}
        ref={frame}
        src="/games/jedi-outcast/index.html"
        title="Star Wars Jedi Knight II: Jedi Outcast"
        className="jko-engine-frame"
        allow="autoplay; fullscreen; gamepad"
        allowFullScreen
        onLoad={() => {
          sourceSent.current = false;
          setTimeout(sendCanonicalSource, 0);
        }}
      />
    </section>
  );
}
