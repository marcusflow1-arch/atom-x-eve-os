import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Gamepad2, Play, RefreshCw, ShieldAlert, Terminal } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useAuth } from '../components/auth/AuthContext';

const LOCAL_PREVIEW = 'http://127.0.0.1:4178/src/game5/client/index.html';
const tile = 'rounded-2xl border border-white/10 bg-[#101b2b]/85 p-5 backdrop-blur-xl';

export default function Game5() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  if (user?.role !== 'admin') {
    return <main className="flex min-h-screen items-center justify-center bg-[#07101d] px-6 text-white"><section className={tile}><ShieldAlert className="mb-3 text-cyan-300" /><h1 className="text-xl font-semibold">Admin access required</h1><p className="mt-2 text-sm text-white/60">The Game 5 development dashboard is restricted to administrators.</p><button className="mt-4 text-cyan-300 underline" onClick={() => navigate(createPageUrl('LunaTemplate'))}>Return to dashboard</button></section></main>;
  }
  return <main className="min-h-screen bg-[#070f1c] text-white">
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-white/10 bg-[#0c1928]/95 px-5 py-3 backdrop-blur-xl">
      <button onClick={() => navigate(createPageUrl('Admin'))} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/75 hover:bg-white/10"><ArrowLeft size={16}/> Admin</button>
      <div className="min-w-0 flex-1"><h1 className="text-base font-bold tracking-wide">GAME 5 <span className="text-cyan-300">/ DEVELOPMENT DASHBOARD</span></h1><p className="text-xs text-white/45">Original Wuxia MMORPG · Isolated quest prototype</p></div>
      <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">Development only</span>
    </header>
    <div className="mx-auto grid max-w-[1600px] gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className={tile}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-lg font-bold"><Gamepad2 className="text-cyan-300"/> Playable preview</h2><p className="mt-1 text-sm text-white/55">Elder Shen · Retrieve the Lost Card</p></div><div className="flex gap-2"><button onClick={() => { setPreviewOpen(true); setRefreshKey(k => k+1); }} className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"><Play size={15}/> Launch preview</button><button onClick={() => setRefreshKey(k=>k+1)} className="rounded-lg border border-white/15 px-3 py-2 text-white/70 hover:bg-white/10" aria-label="Reload preview"><RefreshCw size={16}/></button></div></div>
        <div className="relative aspect-video min-h-[320px] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#132c37] via-[#0b1627] to-[#0b1018]">
          {previewOpen ? <iframe key={refreshKey} title="Game 5 local playable prototype" src={LOCAL_PREVIEW} className="h-full w-full border-0" referrerPolicy="no-referrer"/> : <div className="flex h-full flex-col items-center justify-center px-6 text-center"><Gamepad2 size={48} className="mb-4 text-cyan-300/60"/><p className="text-lg font-semibold">Game 5 test world</p><p className="mt-2 max-w-md text-sm text-white/55">Launch connects to the development server on your own computer. The game is not hosted inside Atom X Eve yet.</p></div>}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm"><p className="text-white/55">Controls: WASD / arrows · Shift sprint · E interact</p><a href={LOCAL_PREVIEW} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-300 hover:underline">Open local preview in new tab <ExternalLink size={14}/></a></div>
      </section>
      <aside className="space-y-5">
        <section className={tile}><h2 className="font-semibold">Quest test checklist</h2><ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-white/70"><li>Speak to Elder Shen.</li><li>Accept Retrieve the Lost Card.</li><li>Collect the glowing card.</li><li>Confirm objective updates to 1/1.</li><li>Return to Elder Shen.</li><li>Complete, then reload to confirm state.</li></ol></section>
        <section className={tile}><h2 className="flex items-center gap-2 font-semibold"><Terminal size={16} className="text-cyan-300"/> Start local server</h2><p className="mt-2 text-sm text-white/60">From the project root with dependencies installed:</p><code className="mt-3 block break-all rounded-lg bg-black/40 p-3 text-xs text-cyan-200">node src/game5/gameplay/devServer.mjs</code><p className="mt-3 text-xs leading-relaxed text-amber-200/80">Game 5 quest storage uses Linux flock. The full quest flow needs a supported Linux environment, such as WSL2 on Windows. This page does not start the server or verify it is running.</p></section>
        <section className={tile}><h2 className="font-semibold">Release gates</h2><p className="mt-2 text-sm text-white/65">Automated tests: 28/28 reported independently passed. Browser and live Vite file-access checks: not yet verified. Production authentication, inventory, rewards, and shared persistence: incomplete.</p><p className="mt-2 text-xs text-white/45">Development-only identities and test tokens. Do not use for real player accounts.</p></section>
      </aside>
    </div>
  </main>;
}
