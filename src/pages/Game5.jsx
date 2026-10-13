import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gamepad2, Play, RefreshCw, ShieldAlert, Terminal } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useAuth } from '../components/auth/AuthContext';

import { createGame5QuestHttpTransport } from '@/game5/client/game5QuestHttpTransport.mjs';
const Game5QuestPreview = lazy(() => import('@/game5/client/Game5QuestPreview.jsx'));
const tile = 'rounded-2xl border border-white/10 bg-[#101b2b]/85 p-5 backdrop-blur-xl';

export default function Game5() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Remember the UI mode only, never quest state or trusted reward data.
  const [previewOpen, setPreviewOpen] = useState(() => {
    try { return sessionStorage.getItem('game5.quest.display-mode') === 'connected'; }
    catch { return false; }
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [mode, setMode] = useState(() => {
    try { return sessionStorage.getItem('game5.quest.display-mode') === 'connected' ? 'connected' : 'demo'; }
    catch { return 'demo'; }
  });
  useEffect(() => {
    try { sessionStorage.setItem('game5.quest.display-mode', mode); }
    catch { /* UI preference is optional; server state remains authoritative */ }
  }, [mode]);
  // G5-0003-A logical endpoint contract. Server hosting/auth and movement authority
  // are separate unmerged prerequisites; never use browser-demo state as fallback.
  const [connectedTransport] = useState(() => createGame5QuestHttpTransport());

  if (user?.role !== 'admin') {
    return <main className="flex min-h-screen items-center justify-center bg-[#07101d] px-6 text-white"><section className={tile}><ShieldAlert className="mb-3 text-cyan-300" /><h1 className="text-xl font-semibold">Admin access required</h1><p className="mt-2 text-sm text-white/60">The Game 5 development dashboard is restricted to administrators.</p><button className="mt-4 text-cyan-300 underline" onClick={() => navigate(createPageUrl('LunaTemplate'))}>Return to Luna Dashboard</button></section></main>;
  }

  return <main className="min-h-screen bg-[#070f1c] text-white">
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-white/10 bg-[#0c1928]/95 px-5 py-3 backdrop-blur-xl">
      <button onClick={() => navigate(createPageUrl('LunaTemplate'))} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/75 hover:bg-white/10"><ArrowLeft size={16}/> Luna</button>
      <div className="min-w-0 flex-1"><h1 className="text-base font-bold tracking-wide">GAME 5 <span className="text-cyan-300">/ DEVELOPMENT DASHBOARD</span></h1><p className="text-xs text-white/45">Original Wuxia MMORPG · Retrieve the Lost Card</p></div>
      <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">{mode === 'demo' ? 'BROWSER DEMO · SIMULATED' : 'CONNECTED TEST · BACKEND REQUIRED'}</span>
    </header>
    <div className="mx-auto grid max-w-[1600px] gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className={tile}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="flex items-center gap-2 text-lg font-bold"><Gamepad2 className="text-cyan-300"/> Playable Wuxia quest</h2><p className="mt-1 text-sm text-white/55">Elder Shen · Lost Card · Preserved Three.js temple scene</p></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={mode === 'demo'} onClick={() => { setMode('demo'); setPreviewOpen(false); }} className={`rounded-lg border px-3 py-2 text-xs ${mode === 'demo' ? 'border-amber-300 text-amber-200 bg-amber-300/10' : 'border-white/15 text-white/70'}`}>Browser Demo</button>
            <button type="button" aria-pressed={mode === 'connected'} onClick={() => { setMode('connected'); setPreviewOpen(false); }} className={`rounded-lg border px-3 py-2 text-xs ${mode === 'connected' ? 'border-cyan-300 text-cyan-200 bg-cyan-300/10' : 'border-white/15 text-white/70'}`}>Connected Test</button>
            <button type="button" onClick={() => setPreviewOpen(true)} className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"><Play size={15}/> {previewOpen ? 'Playing' : mode === 'demo' ? 'Play simulated quest' : 'Open Connected Test'}</button>
            <button type="button" onClick={() => { setPreviewOpen(true); setRefreshKey(k=>k+1); }} className="rounded-lg border border-white/15 px-3 py-2 text-white/70 hover:bg-white/10" aria-label="Restart 3D preview"><RefreshCw size={16}/></button>
          </div>
        </div>
        {previewOpen ? <Suspense fallback={<div className="flex min-h-[410px] items-center justify-center rounded-xl bg-[#0e1c2a] text-cyan-100">Loading the 3D temple…</div>}><Game5QuestPreview key={`${refreshKey}-${mode}`} mode={mode} connectedTransport={mode === 'connected' ? connectedTransport : null} /></Suspense> : <div className="flex aspect-video min-h-[320px] flex-col items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#132c37] via-[#0b1627] to-[#0b1018] px-6 text-center">
          <Gamepad2 size={48} className="mb-4 text-cyan-300/60"/>
          <p className="text-lg font-semibold">Retrieve the Lost Card</p>
          <p className="mt-2 max-w-md text-sm text-white/55">{mode === 'demo' ? 'The browser-only quest simulation works without a server and never awards real player currency.' : 'Connected Test uses verified server snapshots only. G5-0003-A endpoint readiness and authentication integration are required; it will not silently use the browser demo.'}</p>
        </div>}
      </section>
      <aside className="space-y-5">
        <section className={tile}><h2 className="font-semibold">Quest test checklist</h2><ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-white/70"><li>Speak to Elder Shen.</li><li>Accept Retrieve the Lost Card.</li><li>Find and collect the glowing card.</li><li>Confirm objective updates to 1/1.</li><li>Return to Elder Shen.</li><li>Complete the demo and reload to confirm tab persistence.</li></ol></section>
        <section className={tile}><h2 className="flex items-center gap-2 font-semibold"><Terminal size={16} className="text-cyan-300"/> Backend integration gate</h2><p className="mt-2 text-sm text-white/65">The real development quest prototype still runs separately in a supported local Linux or WSL2 environment.</p><code className="mt-3 block break-all rounded-lg bg-black/40 p-3 text-xs text-cyan-200">node src/game5/gameplay/devServer.mjs</code><p className="mt-3 text-xs leading-relaxed text-amber-200/80">G5-0003-A has defined a logical API on an unmerged branch, but it is not hosted or linked to production authentication. Connected Test calls that same-origin route and fails visibly until the separately approved backend, persistence and server-owned position authority are mounted. No browser-provided player ID or simulated backend is accepted.</p></section>
        <section className={tile}><h2 className="font-semibold">Release gates</h2><p className="mt-2 text-sm text-white/65">28 original Game 5 tests passed previously. This browser quest is an isolated simulated walkthrough, not proof of real multiplayer, authentication, inventory, or production rewards.</p><p className="mt-2 text-xs text-white/45">No real player currency is issued.</p></section>
      </aside>
    </div>
  </main>;
}
