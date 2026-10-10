import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronRight, Loader2, Menu, Swords, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import Game2Lobby, { getIceServers } from './Game2Lobby';

// Game 2 start screen: Single Player (story missions) or Multiplayer (the online free-for-all arena, Game2Lobby.jsx;
// the offline Dark Jedi duel is the lobby's practice mode).
// The engine (src/components/game2/engine) is a small WebGL2 renderer + Ghoul2 style skeleton player with the original
// Jedi Outcast animations; the Force rules (push / pull / grip / absorb / lightning) come from Raven's w_force.c,
// see engine/forcerules.js. Both modes run the same combat code; missions add a level, objectives and enemy AI on top.
const BASE = import.meta.env?.BASE_URL ?? '/';
const ASSET_BASE = `${BASE}game2/`;

const MODES = {
  single: {
    tag: 'Single player', title: 'Mission 1 · Kejim Post', loading: 'Kejim Post', icon: Swords,
    blurb: 'Land in the canyon with Jan Ors, breach an Imperial outpost, pull its flight logs while the garrison counter-attacks, and face what waits in the hangar.',
  },
  online: {
    tag: 'Multiplayer', title: 'Free-for-all arena', loading: 'Entering the arena', icon: Users,
    blurb: 'One online Lightsaber Training arena for everybody: up to 10 players, Jedi or Dark Jedi, everyone against everyone and the AI Reborn. Come in and leave whenever you like. Practice offline against the Reborn from the lobby.',
  },
};
const PRACTICE = { tag: 'Practice', title: 'Dark Jedi Duel', loading: 'Dark Jedi duel', icon: Swords };

function fillParent(el) {
  Object.assign(el.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', outline: 'none' });
}

// Fills its nearest positioned parent (Game2.jsx gives it a relative flex-1 section).
export default function Game2Duel() {
  const [choice, setChoice] = useState(null); // 'single' | 'online' | 'multi' (offline duel practice)
  const [online, setOnline] = useState(null); // lobby result: { name, side, selfId, local }
  if (!choice) return <Game2Menu onPick={setChoice} />;
  if (choice === 'online' && !online) return <Game2Lobby onBack={() => setChoice(null)} onStart={setOnline} onPractice={() => setChoice('multi')} />;
  const exit = () => { if (choice === 'online') setOnline(null); else setChoice(choice === 'multi' ? 'online' : null); }; // online / practice go back to the lobby
  return <Game2Session key={choice + (online ? online.selfId : '')} choice={choice} online={online} onExit={exit} />;
}

function Game2Menu({ onPick }) {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-[radial-gradient(ellipse_at_top,#1a1530_0%,#070812_55%,#05060c_100%)] text-white">
      <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-center px-4 py-10">
        <div className="mb-8 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-300/80">Game 2 · Jedi Outcast</div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-wide sm:text-4xl">Choose your fight</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/55">Both modes share the same lightsaber, Force and combat rules.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(MODES).map(([id, m]) => {
            const Icon = m.icon;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onPick(id)}
                className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-cyan-300/50 hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-200"><Icon className="h-5 w-5" /></span>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">{m.tag}</div>
                    <div className="text-lg font-bold">{m.title}</div>
                  </div>
                </div>
                <p className="mt-3 flex-1 text-[13px] leading-relaxed text-white/60">{m.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan-200 group-hover:text-cyan-100">
                  Play <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Game2Session({ choice, online, onExit }) {
  const hostRef = useRef(null);
  const mode = MODES[choice] || PRACTICE;
  const [status, setStatus] = useState({ phase: 'loading', text: `Loading ${mode.loading}` });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let cancelled = false;
    let game = null;
    let renderer = null;
    let raf = 0;
    // fresh canvases per mount: a WebGL canvas cannot get a second context after the first one was released (StrictMode remounts)
    const canvas = document.createElement('canvas');
    const hud = document.createElement('canvas');
    fillParent(canvas);
    fillParent(hud);
    canvas.tabIndex = 0;
    hud.style.pointerEvents = 'none';
    host.append(canvas, hud);
    const duel = choice === 'multi', arena = choice !== 'single';
    let engineOptions = duel
      ? { mode: 'duel', sfxBase: `${ASSET_BASE}sfx/` }
      : { mode: 'mission', mission: 'kejim', sfxBase: `${ASSET_BASE}sfx/` };

    (async () => {
      try {
        const [{ Renderer }, { loadAll }, { Game }] = await Promise.all([
          import('./engine/gl.js'),
          import('./engine/assets.js'),
          import('./engine/game.js'),
        ]);
        if (cancelled) return;
        renderer = new Renderer(canvas);
        renderer.maxDpr = 1.5;
        const assets = await loadAll(ASSET_BASE, (what) => {
          if (!cancelled) setStatus({ phase: 'loading', text: `Loading ${what}` });
        }, { map: arena });
        if (cancelled) return;
        if (choice === 'online') { // peer-to-peer match: signaling through the app backend (or this browser's tabs in test mode)
          const { Base44Signaling, LocalSignaling } = await import('./net/signaling.js');
          const signaling = online.local ? new LocalSignaling(online.selfId) : new Base44Signaling(base44, online.selfId);
          const iceServers = online.local ? [] : await getIceServers();
          if (cancelled) { signaling.close(); return; }
          engineOptions = { mode: 'online', sfxBase: `${ASSET_BASE}sfx/`, net: { ...online, signaling, iceServers } };
        }
        game = new Game(renderer, assets, canvas, hud, engineOptions);
        setStatus({ phase: 'ready', text: '' });
        canvas.focus({ preventScroll: true });
        const loop = (time) => {
          if (cancelled) return;
          game.frame(time);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      } catch (error) {
        console.error('Game 2 failed to start', error);
        if (!cancelled) setStatus({ phase: 'error', text: error?.message || 'The game could not start' });
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (game) game.dispose();
      try {
        renderer?.gl?.getExtension('WEBGL_lose_context')?.loseContext();
      } catch {
        // the context is already gone
      }
      canvas.remove();
      hud.remove();
    };
  }, [choice, online]);

  return (
    <div className="absolute inset-0 select-none overflow-hidden bg-[#05060c]" style={{ touchAction: 'none' }}>
      <div ref={hostRef} className="absolute inset-0" />
      <button
        type="button"
        onClick={onExit}
        className="absolute left-3.5 top-[62px] z-20 flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#080a16]/70 px-2.5 py-1.5 text-[11px] font-semibold text-white/70 backdrop-blur transition hover:bg-[#101528]/90 hover:text-white"
      >
        <Menu className="h-3.5 w-3.5" />
        {choice === 'single' ? 'Main menu' : 'Lobby'}
      </button>
      {status.phase === 'loading' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#05060c] text-white/80">
          <Loader2 className="h-7 w-7 animate-spin text-cyan-300" />
          <div className="text-[13px] font-semibold uppercase tracking-[0.18em]">{mode.loading}</div>
          <div className="text-xs text-white/45">{status.text}</div>
        </div>
      )}
      {status.phase === 'error' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#05060c] px-6 text-center text-white/80">
          <AlertTriangle className="h-7 w-7 text-amber-300" />
          <div className="text-sm font-semibold">Game 2 could not start</div>
          <div className="max-w-md text-xs text-white/50">{status.text}</div>
          <div className="max-w-md text-xs text-white/35">The game needs a browser with WebGL2 enabled. Reload the page after turning on hardware acceleration.</div>
        </div>
      )}
    </div>
  );
}
