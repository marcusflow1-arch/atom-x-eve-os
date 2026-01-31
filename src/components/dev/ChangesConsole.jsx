import React, { useEffect, useState, useRef } from 'react';

export default function ChangesConsole() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const listRef = useRef(null);

  useEffect(() => {
    const onLog = (e) => {
      const entry = e.detail || {};
      const row = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
        time: new Date(entry.time || Date.now()).toLocaleTimeString(),
        file: entry.file || 'unknown',
        action: entry.action || 'change',
        summary: entry.summary || '',
        scope: entry.scope || 'app'
      };
      setLogs((prev) => [...prev, row].slice(-500));
    };
    window.addEventListener('base44-change-log', onLog);

    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('base44-change-log', onLog);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, logs.length]);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-[90] w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-xs text-white/80"
        title="Toggle Changes Console (Ctrl/⌘+Shift+L)"
      >
        Logs
      </button>

      {/* Overlay panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-[90] w-[380px] max-h-[60vh] bg-slate-900/90 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <div className="text-white/80 text-sm font-semibold">Live Changes</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLogs([])}
                className="text-white/60 hover:text-white text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10"
              >
                Clear
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-3 space-y-2">
            {logs.length === 0 && (
              <div className="text-white/40 text-xs">No changes yet. I’ll stream each change here.</div>
            )}
            {logs.map((l) => (
              <div key={l.id} className="p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between text-[10px] text-white/50">
                  <span>{l.time}</span>
                  <span className="uppercase tracking-wide text-[9px]">{l.scope}</span>
                </div>
                <div className="mt-1 text-white/80 text-xs font-mono truncate" title={l.file}>{l.file}</div>
                <div className="mt-0.5 text-white text-xs">{l.action}</div>
                {l.summary && <div className="mt-0.5 text-white/70 text-[11px]">{l.summary}</div>}
              </div>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-white/10 text-[10px] text-white/40">
            Tip: Press Ctrl/⌘+Shift+L to toggle.
          </div>
        </div>
      )}
    </>
  );
}