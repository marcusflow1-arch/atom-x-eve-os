import { CheckCircle2, CircleHelp, GraduationCap, Play, RotateCcw, SkipForward, Swords } from 'lucide-react';

// This HTML panel sits above the real WebGL training arena, so directions remain
// legible without a tiny in-canvas HUD. The lesson registry lives in the engine.
export default function Game2TutorialOverlay({ director, snapshot, onChange }) {
  if (!director || !snapshot) return null;
  const selected = snapshot.lessons.find(l => l.id === snapshot.selectedId);
  if (!selected) return null;
  const call = (method, ...args) => () => {
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch { /* unsupported */ }
    director[method](...args);
    onChange(director.snapshot());
  };
  const isDone = snapshot.phase === 'complete';
  const isDemo = snapshot.phase === 'demo';
  const isPractice = snapshot.phase === 'practice';
  const canPractice = !selected.automatic;
  return (
    <aside
      data-testid="game2-tutorial-overlay"
      aria-label="Game 2 guided arena tutorial"
      className="pointer-events-auto absolute bottom-3 right-3 top-[57px] z-30 flex w-[min(370px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#08111b]/95 text-white shadow-[0_18px_65px_rgba(0,0,0,0.65)] backdrop-blur-xl"
    >
      <div className="shrink-0 border-b border-white/10 bg-cyan-400/[0.07] px-5 py-4">
        <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-cyan-300">
          <GraduationCap className="h-5 w-5" /> AI Arena Academy
        </div>
        <p className="mt-1.5 text-[13px] text-white/70">
          {snapshot.completed.length} techniques completed · Offline sandbox
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <label htmlFor="game2-lesson" className="mb-2 block text-[13px] font-semibold text-white/75">Choose a technique</label>
        <select
          id="game2-lesson"
          value={selected.id}
          onChange={e => call('select', e.target.value)()}
          className="w-full rounded-lg border border-white/20 bg-[#142538] px-3 py-3 text-[15px] font-medium text-white outline-none focus:border-cyan-300"
        >
          {[...new Set(snapshot.lessons.map(l => l.group))].map(group => (
            <optgroup key={group} label={group}>
              {snapshot.lessons.filter(l => l.group === group).map(l => (
                <option value={l.id} key={l.id}>{snapshot.completed.includes(l.id) ? '✓ ' : ''}{l.title}{l.automatic ? ' · auto' : ''}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="mt-5 flex items-center gap-2">
          <Swords className="h-5 w-5 text-cyan-300" />
          <h2 className="text-xl font-bold leading-tight">{selected.title}</h2>
        </div>
        {selected.automatic && <p className="mt-2 text-sm font-semibold text-amber-200">Automatic move · AI demonstration only</p>}
        <div aria-live="polite" className="mt-4 rounded-xl bg-white/[0.055] p-4">
          <p className="text-[12px] font-bold uppercase tracking-[0.13em] text-cyan-300">
            {isDemo ? 'Watch the instructor' : isPractice ? 'Your turn — perform the move' : isDone ? 'Lesson complete' : 'Step-by-step directions'}
          </p>
          <ol className="mt-3 space-y-3">
            {selected.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-white/90">
                <span className="shrink-0 font-bold tabular-nums text-cyan-200">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
        {isDone && (
          <p role="status" className="mt-4 flex items-center gap-2 text-[15px] font-bold text-emerald-300">
            <CheckCircle2 className="h-5 w-5" /> Completed! You can replay or move on.
          </p>
        )}
        {isPractice && <p role="status" className="mt-3 text-[14px] text-white/70">The lesson completes when the arena detects the actual technique. Press Esc to release your mouse to access the controls.</p>}
        {isDemo && <p role="status" className="mt-3 text-[14px] text-white/70">AI instructor is demonstrating the technique in the arena.</p>}
      </div>
      <div className="shrink-0 space-y-2 border-t border-white/10 bg-[#0d1a2a] p-4">
        <button
          type="button"
          onClick={call('demo')}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 px-3 py-3 text-[15px] font-bold text-[#04101d] transition hover:bg-cyan-200"
        >
          {isDemo ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isDemo ? 'Replay AI demonstration' : 'Watch AI demonstrate'}
        </button>
        {canPractice && (
          <button
            type="button"
            onClick={call('practice')}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-3 text-[15px] font-bold text-white transition hover:bg-white/15"
          >
            <Swords className="h-4 w-4" /> {isPractice ? 'Restart practice' : 'Try it myself'}
          </button>
        )}
        <button
          type="button"
          onClick={call('next')}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[14px] font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <SkipForward className="h-4 w-4" /> Next technique
        </button>
        <p className="flex items-center justify-center gap-1.5 text-[12px] text-white/50">
          <CircleHelp className="h-3.5 w-3.5" /> F1: game controls · Esc: release mouse
        </p>
      </div>
    </aside>
  );
}
