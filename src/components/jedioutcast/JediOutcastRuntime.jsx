import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Maximize2, RotateCcw } from 'lucide-react';

const LABELS = { 'awaiting-files': 'Select original game files', checking: 'Checking game files', 'missing-data': 'Original files needed', 'files-ready': 'Game files checked', starting: 'Starting original engine', 'engine-ready': 'Original engine initialized', error: 'Engine stopped' };

export default function JediOutcastRuntime({ onBack }) {
  const frame = useRef(null), shell = useRef(null), leaving = useRef(false);
  const [state, setState] = useState('awaiting-files');
  const [notice, setNotice] = useState('');
  const [exiting, setExiting] = useState(false);
  const [revision, setRevision] = useState(0);
  const activeFlush = useRef(null);

  useEffect(() => {
    const onMessage = event => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
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
  }, []);

  const leave = action => {
    if (leaving.current) return;
    leaving.current = true; setExiting(true); setNotice('');
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const finish = error => {
      clearTimeout(activeFlush.current?.timer); activeFlush.current = null;
      leaving.current = false; setExiting(false);
      if (error) { setNotice(error + ' Use the game’s Save menu before leaving.'); return; }
      action();
    };
    activeFlush.current = { id, finish, timer: setTimeout(() => finish('Could not confirm save synchronization.'), 4000) };
    frame.current?.contentWindow?.postMessage({ type: 'atom-jedi-flush', requestId: id }, window.location.origin);
  };

  const restart = () => { setState('awaiting-files'); setNotice(''); setRevision(value => value + 1); };
  return (
    <section className="jko-session" ref={shell} aria-label="Original Jedi Outcast engine">
      <header className="jko-session-bar">
        <button type="button" aria-label="Back to Luna" disabled={exiting} onClick={() => leave(onBack)}><ArrowLeft size={16} /><span>Back to Luna</span></button>
        <span className="jko-session-label">Jedi Outcast <small role="status">{exiting ? 'Saving…' : LABELS[state]}</small></span>
        <button type="button" aria-label="Reload game" disabled={exiting} title="Reload game and select files again" onClick={() => leave(restart)}><RotateCcw size={16} /><span>Reload</span></button>
        <button type="button" aria-label="Fullscreen" title="Fullscreen" onClick={() => {
          if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
          else shell.current?.requestFullscreen?.().catch(() => setNotice('Fullscreen was blocked by the browser.'));
        }}><Maximize2 size={16} /><span>Fullscreen</span></button>
      </header>
      {notice && <div className="jko-session-notice" role="alert"><span>{notice}</span><button type="button" onClick={onBack}>Return to Luna</button></div>}
      <iframe key={revision} ref={frame} src="/games/jedi-outcast/index.html" title="Jedi Outcast — original engine and game files" className="jko-engine-frame" allow="autoplay; fullscreen; gamepad" allowFullScreen />
    </section>
  );
}
