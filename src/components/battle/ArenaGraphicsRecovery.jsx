export default function ArenaGraphicsRecovery({ onRetry }) {
  return <div role="alert" className="absolute inset-0 z-[76] grid place-items-center bg-[#050a11]/95 p-6 text-center text-white">
    <div className="max-w-sm">
      <h2 className="text-lg font-bold">Arena graphics unavailable</h2>
      <p className="mt-2 text-sm text-white/60">Your browser could not keep the 3D view active. Close other 3D tabs, then retry. If this persists, enable hardware acceleration and restart your browser.</p>
      <button type="button" onClick={onRetry} className="mt-5 bg-cyan-200 px-5 py-3 text-sm font-bold text-slate-950">Retry graphics</button>
      <p className="mt-3 text-xs text-white/50">The match is not paused. Press Escape for match options.</p>
    </div>
  </div>;
}