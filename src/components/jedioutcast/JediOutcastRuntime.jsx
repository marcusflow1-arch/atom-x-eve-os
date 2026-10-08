import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Maximize2, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

const REQUIRED_PAKS = ['assets0.pk3', 'assets1.pk3', 'assets2.pk3', 'assets5.pk3'];
const PAK_CHUNK_BYTES = 16 * 1024 * 1024;
const CACHE_RETRIES = 3;

const LABELS = {
  'awaiting-source': 'Connecting original game data',
  checking: 'Checking canonical game data',
  caching: 'Caching original game data in Base44',
  'files-ready': 'Original game data ready',
  starting: 'Starting Jedi Outcast',
  'engine-ready': 'Jedi Outcast running',
  error: 'Engine stopped',
};

function unwrap(value) {
  return value?.data ?? value;
}

export default function JediOutcastRuntime({ onBack, mode = 'campaign', minimalUi = false }) {
  const { user } = useAuth();
  const frame = useRef(null);
  const shell = useRef(null);
  const leaving = useRef(false);
  const sourceSent = useRef(false);
  const sourcePreparing = useRef(false);
  const activeFlush = useRef(null);

  const [state, setState] = useState('awaiting-source');
  const [notice, setNotice] = useState('');
  const [progress, setProgress] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [exiting, setExiting] = useState(false);
  const [revision, setRevision] = useState(0);

  const sendCanonicalSource = useCallback(async () => {
    if (sourceSent.current || sourcePreparing.current || !frame.current?.contentWindow) return;
    sourcePreparing.current = true;

    try {
      if (user?.role !== 'admin') {
        throw new Error('Jedi Outcast development playback is currently restricted to the app admin.');
      }

      setState('checking');
      setProgress('');
      setNotice('');

      // Normal launches must not depend on the server function. The four retail
      // archives and their persistent chunk cache are ordinary admin-readable Base44
      // entities, so read them directly. The function is reserved only for repairing a
      // genuinely missing chunk.
      const [archives, statusChunks] = await Promise.all([
        base44.entities.JediSourceAsset.filter(
          { game_key: 'jedi_outcast', category: 'retail_archive' },
          'path',
          50,
        ),
        base44.entities.JediPakChunk.filter(
          { game_key: 'jedi_outcast', status: 'cached' },
          'archive_name',
          500,
        ),
      ]);

      const chunkBytes = PAK_CHUNK_BYTES;
      const byName = new Map(archives.map(asset => [String(asset.path || '').toLowerCase(), asset]));
      const missing = REQUIRED_PAKS.filter(name => !byName.get(name)?.id || !(Number(byName.get(name)?.byte_size) > 0));
      if (missing.length) {
        throw new Error(`Canonical retail archives are missing from Base44: ${missing.join(', ')}`);
      }

      const jobs = [];
      const chunksByArchive = new Map();
      const cachedChunkRows = Array.isArray(statusChunks) ? statusChunks : [];

      for (const name of REQUIRED_PAKS) {
        const archive = byName.get(name);
        const size = Number(archive.byte_size);
        const count = Math.ceil(size / chunkBytes);
        const slots = new Array(count);
        chunksByArchive.set(name, slots);

        for (const row of cachedChunkRows) {
          if (row.archive_asset_id !== archive.id && String(row.archive_name || '').toLowerCase() !== name) continue;
          const chunkIndex = Number(row.chunk_index);
          if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex >= count) continue;

          const expectedOffset = chunkIndex * chunkBytes;
          const expectedSize = Math.min(chunkBytes, size - expectedOffset);
          if (
            row.status !== 'cached' ||
            !row.storage_url ||
            Number(row.offset) !== expectedOffset ||
            Number(row.byte_size) !== expectedSize ||
            Number(row.source_size) !== size
          ) {
            continue;
          }

          slots[chunkIndex] = {
            index: chunkIndex,
            offset: expectedOffset,
            size: expectedSize,
            url: row.storage_url,
            sha256: row.sha256 || '',
          };
        }

        for (let chunkIndex = 0; chunkIndex < count; chunkIndex++) {
          if (!slots[chunkIndex]) jobs.push({ name, archive, size, chunkIndex });
        }
      }

      if (jobs.length) {
        setState('caching');
        setProgress(`Repairing 0 / ${jobs.length} missing archive chunks`);

        for (let jobIndex = 0; jobIndex < jobs.length; jobIndex++) {
          const job = jobs[jobIndex];
          let response = null;
          let lastError = null;

          for (let attempt = 1; attempt <= CACHE_RETRIES; attempt++) {
            try {
              response = unwrap(await base44.functions.invoke('jediOutcastSource', {
                action: 'cachePakChunk',
                archiveAssetId: job.archive.id,
                chunkIndex: job.chunkIndex,
              }));
              if (response?.success && response?.chunk?.storage_url) break;
              lastError = new Error(response?.error || `${job.name}: chunk ${job.chunkIndex + 1} cache attempt ${attempt} failed.`);
            } catch (error) {
              lastError = error;
            }

            if (attempt < CACHE_RETRIES) {
              await new Promise(resolve => setTimeout(resolve, 500 * attempt));
            }
          }

          if (!response?.success || !response?.chunk?.storage_url) {
            throw lastError || new Error(`${job.name}: Base44 failed to repair chunk ${job.chunkIndex + 1}.`);
          }

          const chunk = response.chunk;
          const expectedOffset = job.chunkIndex * chunkBytes;
          const expectedSize = Math.min(chunkBytes, job.size - expectedOffset);

          if (
            Number(chunk.chunk_index) !== job.chunkIndex ||
            Number(chunk.offset) !== expectedOffset ||
            Number(chunk.byte_size) !== expectedSize ||
            Number(chunk.source_size) !== job.size
          ) {
            throw new Error(`${job.name}: repaired chunk ${job.chunkIndex + 1} did not match the canonical archive layout.`);
          }

          chunksByArchive.get(job.name)[job.chunkIndex] = {
            index: job.chunkIndex,
            offset: expectedOffset,
            size: expectedSize,
            url: chunk.storage_url,
            sha256: chunk.sha256 || '',
          };

          setProgress(`Repairing ${jobIndex + 1} / ${jobs.length} missing archive chunks`);
        }
      }

      const paks = REQUIRED_PAKS.map(name => {
        const archive = byName.get(name);
        const chunks = chunksByArchive.get(name);
        if (!chunks?.length || chunks.some(chunk => !chunk?.url)) {
          throw new Error(`${name}: Base44 cache is incomplete.`);
        }
        return {
          name,
          size: Number(archive.byte_size),
          sourceAssetId: archive.id,
          chunks,
        };
      });

      sourceSent.current = true;
      frame.current.contentWindow.postMessage({
        type: 'atom-jedi-canonical-source',
        paks,
      }, window.location.origin);

      setProgress('');
      setState('files-ready');
    } catch (error) {
      setState('error');
      setNotice(error?.message || String(error));
    } finally {
      sourcePreparing.current = false;
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
        if (event.data.state === 'engine-ready') {
          requestAnimationFrame(() => {
            try { frame.current?.focus({ preventScroll: true }); } catch (_) { frame.current?.focus?.(); }
          });
        }
      }

      if (event.data?.type === 'atom-jedi-video') {
        const renderWidth = Number(event.data.renderWidth);
        const renderHeight = Number(event.data.renderHeight);
        if (Number.isInteger(renderWidth) && renderWidth > 0 &&
            Number.isInteger(renderHeight) && renderHeight > 0) {
          setVideoInfo({
            renderWidth,
            renderHeight,
            clientWidth: Number(event.data.clientWidth || 0),
            clientHeight: Number(event.data.clientHeight || 0),
          });
        }
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


  useEffect(() => {
    const forwardKey = event => {
      if (!frame.current?.contentWindow || state === 'error') return;
      const target = event.target;
      if (target && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName || '')) return;
      if (event.metaKey || (event.ctrlKey && !event.altKey)) return;

      const gameKey = /^(Key[A-Z]|Digit[0-9]|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Space|ShiftLeft|ShiftRight|ControlLeft|ControlRight|AltLeft|AltRight|Tab|Enter|Escape|PageUp|PageDown|Home|End|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Comma|Period|Slash|F[1-9]|F1[0-2]|Numpad[0-9]|NumpadEnter|NumpadAdd|NumpadSubtract|NumpadDecimal)$/.test(event.code || '');
      if (!gameKey) return;

      frame.current.contentWindow.postMessage({
        type: 'atom-jedi-key',
        eventType: event.type,
        key: event.key,
        code: event.code,
        repeat: event.repeat,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        metaKey: event.metaKey,
      }, window.location.origin);

      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', forwardKey, true);
    window.addEventListener('keyup', forwardKey, true);
    return () => {
      window.removeEventListener('keydown', forwardKey, true);
      window.removeEventListener('keyup', forwardKey, true);
    };
  }, [state]);

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
    sourcePreparing.current = false;
    setState('awaiting-source');
    setProgress('');
    setVideoInfo(null);
    setNotice('');
    setRevision(value => value + 1);
  };

  const frameSrc = mode === 'character-lab'
    ? '/games/jedi-outcast/index.html?runtime=native-camera-v10&lab=character'
    : '/games/jedi-outcast/index.html?runtime=native-camera-v10';

  return (
    <section className={`jko-session ${minimalUi ? 'jko-session-minimal' : ''}`} ref={shell} aria-label={mode === 'character-lab' ? 'Jedi character test viewer' : 'Jedi Outcast'}>
      {minimalUi ? (
        <button type="button" className="jko-lab-back" aria-label="Return to dashboard" disabled={exiting} onClick={() => leave(onBack)}>
          <ArrowLeft size={16} /><span>Return to Dashboard</span>
        </button>
      ) : <header className="jko-session-bar">
        <button type="button" aria-label="Back to Luna" disabled={exiting} onClick={() => leave(onBack)}>
          <ArrowLeft size={16} /><span>Back to Luna</span>
        </button>

        <span className="jko-session-label">
          Star Wars Jedi Knight II: Jedi Outcast
          <small role="status" title={videoInfo
            ? `Rendered at ${videoInfo.renderWidth}×${videoInfo.renderHeight}; displayed at ${videoInfo.clientWidth}×${videoInfo.clientHeight}`
            : undefined}>
            {exiting
              ? 'Saving…'
              : (progress ||
                (videoInfo
                  ? `${LABELS[state] || state} · ${videoInfo.renderWidth}×${videoInfo.renderHeight}`
                  : LABELS[state] || state))}
          </small>
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
      </header>}

      {notice && !minimalUi && (
        <div className="jko-session-notice" role="alert">
          <span>{notice}</span>
          <button type="button" onClick={onBack}>Return to Luna</button>
        </div>
      )}

      <div className="jko-engine-stage">
        <iframe
          key={revision}
          ref={frame}
          src={frameSrc}
          title={mode === 'character-lab' ? 'Jedi Outcast character systems test' : 'Star Wars Jedi Knight II: Jedi Outcast'}
          className="jko-engine-frame"
          tabIndex={0}
          allow="autoplay; fullscreen; gamepad"
          allowFullScreen
          onLoad={() => {
            sourceSent.current = false;
            sourcePreparing.current = false;
            setTimeout(sendCanonicalSource, 0);
          }}
        />
      </div>
    </section>
  );
}
