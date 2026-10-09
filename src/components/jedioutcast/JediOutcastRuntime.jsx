import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Maximize2, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { activeDashboardWindow } from '@/components/dashboard/windows/DashboardWindow';
import { REQUIRED_JEDI_ARCHIVES, JEDI_ARCHIVE_CHUNK_BYTES, findRegisteredJediArchives, collectCachedArchiveChunks, missingRegisteredJediArchives } from './jediArchiveSources';

const REQUIRED_PAKS = REQUIRED_JEDI_ARCHIVES;
const PAK_CHUNK_BYTES = JEDI_ARCHIVE_CHUNK_BYTES;
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

const GAME2_LABELS = {
  'awaiting-source': 'Connecting original Kyle sandbox data',
  checking: 'Checking canonical Kyle / combat data',
  caching: 'Caching original game data in Base44',
  'files-ready': 'Original Kyle / combat data ready',
  starting: 'Starting Game 2 sandbox',
  'engine-ready': 'Game 2 sandbox running',
  error: 'Sandbox engine stopped',
};

function unwrap(value) {
  return value?.data ?? value;
}

export default function JediOutcastRuntime({ onBack, mode = 'campaign', embedded = false }) {
  const isGame2 = mode === 'game2';
  const activeLabels = isGame2 ? GAME2_LABELS : LABELS;
  const sessionTitle = isGame2 ? 'Game 2 — Kyle Combat Sandbox' : 'Star Wars Jedi Knight II: Jedi Outcast';
  const iframeSrc = isGame2
    ? '/games/jedi-outcast/index.html?runtime=game2-kyle-v1&mode=game2'
    : '/games/jedi-outcast/index.html?runtime=native-camera-v11';
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

      // Pull the existing Admin → Project Rebuilds → Game Rebuilds assets.
      // Drive-indexed archives retain the 16 MiB Base44 chunk cache; PK3 files
      // uploaded directly in Game Rebuilds can be used via their storage URL.
      // No client filesystem picker or Windows companion is required.
      const [archives, statusChunks, workspaceFiles] = await Promise.all([
        base44.entities.JediSourceAsset.filter(
          { game_key: 'jedi_outcast', category: 'retail_archive' }, 'path', 50,
        ),
        base44.entities.JediPakChunk.filter(
          { game_key: 'jedi_outcast', status: 'cached' }, 'archive_name', 1000,
        ),
        base44.entities.GameReconstructionFile.filter(
          { game_key: 'jedi_outcast', area: 'original_asset' }, 'path', 1000,
        ),
      ]);

      const chunkBytes = PAK_CHUNK_BYTES;
      const byName = findRegisteredJediArchives(archives, workspaceFiles);
      // The newly supplied GOG GameData/base includes a genuine assets5.pk3.
      // Let the existing admin backend register that known Drive file on demand
      // if it was not already entered in Game Rebuilds. Do not ask the player
      // to browse for local files or install a separate Windows handler.
      if (!byName.has('assets5.pk3')) {
        setProgress('Checking original patch archive from connected Google Drive…');
        try {
          const fallback = unwrap(await base44.functions.invoke('jediOutcastSource', {
            action: 'registerProvidedArchive', archiveName: 'assets5.pk3',
          }));
          if (fallback?.success && fallback.asset) {
            const registered = findRegisteredJediArchives([fallback.asset], []);
            if (registered.has('assets5.pk3')) byName.set('assets5.pk3', registered.get('assets5.pk3'));
          }
        } catch (error) {
          // Other registered sources may still be present; the final missing
          // archive list is the authoritative failure, not a false success.
          console.warn('Jedi Outcast optional Drive source unavailable:', error);
        }
      }
      const missing = missingRegisteredJediArchives(byName);
      if (missing.length) {
        throw new Error(`Original game data is incomplete in Admin → Game Rebuilds: ${missing.join(', ')}. The provided Google Drive/GameData/base currently lists only assets5.pk3. A complete original game cannot be started until these archive records exist in the connected Game Rebuilds workspace.`);
      }

      const jobs = [];
      const chunksByArchive = new Map();
      const cachedChunkRows = Array.isArray(statusChunks) ? statusChunks : [];

      for (const name of REQUIRED_PAKS) {
        const archive = byName.get(name);
        const size = Number(archive.byte_size);
        const slots = collectCachedArchiveChunks(archive, cachedChunkRows, chunkBytes);
        chunksByArchive.set(name, slots);
        if (archive.kind === 'stored') continue;
        for (let chunkIndex = 0; chunkIndex < slots.length; chunkIndex++) {
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
          sourceAssetId: archive.id || null,
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

      if (event.data?.type === 'atom-jedi-status' && (activeLabels[event.data.state] || LABELS[event.data.state])) {
        setState(event.data.state);
        if (event.data.state === 'error') setNotice(event.data.detail || 'The engine could not start.');
        if (event.data.state === 'engine-ready') {
          setProgress('');
          requestAnimationFrame(() => {
            try { frame.current?.focus({ preventScroll: true }); } catch (_) { frame.current?.focus?.(); }
          });
        }
      }

      if (event.data?.type === 'atom-jedi-progress') {
        const done = Number(event.data.done);
        const total = Number(event.data.total);
        if (Number.isFinite(done) && Number.isFinite(total) && total > 0) {
          setProgress(`Downloading original game archives · ${(done / 1048576).toFixed(1)} / ${(total / 1048576).toFixed(1)} MB`);
        }
      }

      if (event.data?.type === 'atom-jedi-mouse-lock-error') {
        setNotice('Browser mouse capture was blocked. Open the published Atom XE app outside the editor preview and click inside the game.');
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
  }, [activeLabels, sendCanonicalSource]);


  useEffect(() => {
    const forwardKey = event => {
      if (!frame.current?.contentWindow || state === 'error') return;
      // A game inside a movable window must not steal hotkeys from Friends,
      // Chat, Skill Book or other independently focused dashboard windows.
      if (embedded && activeDashboardWindow() !== 'jedi-outcast-game') return;
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
  }, [state, embedded]);

  const leave = action => {
    if (leaving.current) return;
    if (!frame.current?.contentWindow || state === 'error' || state === 'awaiting-source') {
      action();
      return;
    }
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

  // Closing the independent desktop-like window must flush original game
  // saves and configuration before the iframe is unmounted.
  useEffect(() => {
    if (!embedded) return;
    const closeWindow = () => leave(onBack);
    window.addEventListener('atom:jedi-request-window-close', closeWindow);
    return () => window.removeEventListener('atom:jedi-request-window-close', closeWindow);
  }, [embedded, onBack, state]);

  const restart = () => {
    sourceSent.current = false;
    sourcePreparing.current = false;
    setState('awaiting-source');
    setProgress('');
    setVideoInfo(null);
    setNotice('');
    setRevision(value => value + 1);
  };

  return (
    <section className="jko-session" data-jedi-embedded={embedded || undefined} ref={shell} aria-label={sessionTitle}>
      <header className="jko-session-bar">
        <button type="button" aria-label="Back to Luna" disabled={exiting} onClick={() => leave(onBack)}>
          <ArrowLeft size={16} /><span>Back to Luna</span>
        </button>

        <span className="jko-session-label">
          {sessionTitle}
          <small role="status" title={videoInfo
            ? `Rendered at ${videoInfo.renderWidth}×${videoInfo.renderHeight}; displayed at ${videoInfo.clientWidth}×${videoInfo.clientHeight}`
            : undefined}>
            {exiting
              ? 'Saving…'
              : (progress ||
                (videoInfo
                  ? `${activeLabels[state] || state} · ${videoInfo.renderWidth}×${videoInfo.renderHeight}`
                  : activeLabels[state] || state))}
          </small>
        </span>

        <button type="button" aria-label="Reload game" disabled={exiting} title={isGame2 ? 'Reload Game 2' : 'Reload Jedi Outcast'} onClick={() => leave(restart)}>
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
          <button type="button" onClick={() => setNotice('')}>Dismiss</button>
          <button type="button" onClick={onBack}>Return to Luna</button>
        </div>
      )}

      <div className="jko-engine-stage">
        {embedded && state !== 'engine-ready' && state !== 'error' && (
          <div className="jko-loading-cover pointer-events-none" role="status" aria-live="polite">
            <span className="jko-loading-spinner" aria-hidden="true" />
            <strong>{activeLabels[state] || 'Loading original game assets'}</strong>
            <small>{progress || (state === 'starting'
              ? 'Starting the original Raven engine. Rendering and shaders are initializing…'
              : 'Checking original archives in Admin → Game Rebuilds and connected Google Drive…')}</small>
          </div>
        )}
        <iframe
          key={revision}
          ref={frame}
          src={iframeSrc}
          title={sessionTitle}
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
        {isGame2 && (
          <aside
            aria-label="Game 2 original controls"
            className="pointer-events-none absolute left-4 bottom-4 z-20 max-w-[560px] rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-white/80 shadow-2xl backdrop-blur-md"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/90">
              Game 2 · Original Raven controls
            </div>
            <div className="mt-2 text-[11px] leading-5 text-white/65">
              WASD move · Space jump · Shift run · Mouse look · Mouse 1 attack · Mouse 2 alt attack ·
              L saber style · P third-person · F1 Push · F2 Pull · F3 Speed · F4 Distract ·
              F5 Heal · F6 Grip · F7 Lightning · Z/X previous/next Force · F use selected Force
            </div>
            <div className="mt-1 text-[10px] text-white/35">
              Kyle, saber combat, Force logic, animations and effects are supplied by the original Jedi Outcast engine and retail PK3 data.
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
