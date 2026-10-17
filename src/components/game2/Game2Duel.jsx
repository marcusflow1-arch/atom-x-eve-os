import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, Menu, Swords, Users } from 'lucide-react';
import { getAccessToken } from '@base44/sdk';
import { base44 } from '@/api/base44Client';
import { selectGame1CombatTrack } from './engine/combatTrack.js';
import { appParams } from '@/lib/app-params';
import { game2RailwayUrl } from './net/railway.js';
import Game2Lobby from './Game2Lobby';
import Game2Menu from './Game2Menu';
import Game2FleetAssault from './fleetAssault/Game2FleetAssault';
import Game2TutorialOverlay from './Game2TutorialOverlay';
import { Game2TutorialDirector } from './engine/tutorial.js';
import { GAME2_AUTHORED_MAPS } from './engine/arenaMaps.js';
import { loadSettings } from './settings.js';

// Game 2 starts on the main menu (Game2Menu.jsx: Story Mode, Multiplayer, Skirmish, Duel Practice, Settings, Controls)
// over a live AI duel. Multiplayer goes through the online lobby (Game2Lobby.jsx); everything else starts here.
// The engine (src/components/game2/engine) is a small WebGL2 renderer + Ghoul2 style skeleton player with the original
// Jedi Outcast animations; the Force rules (push / pull / grip / absorb / lightning) come from Raven's w_force.c,
// see engine/forcerules.js. Both modes run the same combat code; missions add a level, objectives and enemy AI on top.
const BASE = import.meta.env?.BASE_URL ?? '/';
const ASSET_BASE = `${BASE}game2/`;

const MODES = {
  tutorial: {
    tag: 'Tutorial', title: 'Guided Arena Academy', loading: 'Training arena', icon: Swords,
    blurb: 'Watch an AI instructor demonstrate real moves, follow the directions, and practice against an idle target.',
  },
  single: {
    tag: 'Single player', title: 'Mission 1 · Kejim Post', loading: 'Kejim Post', icon: Swords,
    blurb: 'Land in the canyon with Jan Ors, breach an Imperial outpost, pull its flight logs while the garrison counter-attacks, and face what waits in the hangar.',
  },
  online: {
    tag: 'Multiplayer', title: 'Free-for-all arena', loading: 'Entering the arena', icon: Users,
    blurb: 'One real-time Railway arena for up to 10 human-controlled Jedi or Dark Jedi. Fight other players from different browsers and countries. Optional AI Reborn opponents; offline practice remains available.',
  },
  ffa: {
    tag: 'Skirmish', title: 'Free-for-all · 50 fighters', loading: 'Free-for-all', icon: Swords,
    blurb: 'You and 49 AI fighters, every one for themselves. First to 15 defeats.',
  },
  tdm: {
    tag: 'Skirmish', title: 'Team Deathmatch · 25v25', loading: 'Team Deathmatch', icon: Users,
    blurb: 'Blue: you and 24 AI teammates. Red: 25 enemy bots. First team to 50 defeats.',
  },
  ctf: {
    tag: 'AI team battle', title: 'Capture the Flag · 15v15', loading: 'Capture the Flag', icon: Users,
    blurb: 'Blue: you and 14 AI teammates. Red: 15 enemy bots. Steal their flag, bring it home and defend your own. First to three captures.',
  },
  sudden: {
    tag: 'AI elimination', title: 'Sudden Death · 25v25', loading: 'Sudden Death', icon: Swords,
    blurb: 'Blue: you and 24 AI teammates. Red: 25 enemies. One life per fighter; eliminate the entire opposing team to win.',
  },
};
const PRACTICE = { tag: 'Practice', title: 'Dark Jedi Duel', loading: 'Dark Jedi duel', icon: Swords };

function fillParent(el) {
  Object.assign(el.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', outline: 'none' });
}

const TEAM_CHOICES = ['ctf', 'sudden', 'ffa', 'tdm']; // offline matches against AI (engine/teamMatch.js)

// Fills its nearest positioned parent (Game2.jsx gives it a relative flex-1 section).
export default function Game2Duel() {
  const [choice, setChoice] = useState(null); // 'single' | 'online' | 'multi' (duel practice) | 'ffa' | 'tdm' | 'ctf' | 'sudden'
  const [mapId, setMapId] = useState('skybridge');
  const [saber, setSaber] = useState('single'); // 'single' | 'dual' | 'staff'
  const [online, setOnline] = useState(null); // lobby result: { name, side, selfId, local }
  const fromMenu = (r) => { setMapId(r.mapId || 'training'); setSaber(r.saber || 'single'); setChoice(r.choice); };
  if (!choice) return <Game2Menu onStart={fromMenu} />;
  if (choice === 'fleet_assault') return <Game2FleetAssault onExit={() => setChoice(null)} />;
  if (choice === 'online' && !online) return <Game2Lobby onBack={() => setChoice(null)} onStart={setOnline} onPractice={() => setChoice('multi')} />;
  const exit = () => { if (choice === 'online') setOnline(null); else setChoice(null); }; // online goes back to the lobby, everything else to the menu
  return <Game2Session key={choice + mapId + saber + (online ? online.selfId : '')} choice={choice} online={online} mapId={mapId} saber={saber} onExit={exit} />;
}

function Game2Session({ choice, online, mapId, saber, onExit }) {
  const hostRef = useRef(null);
  const mode = MODES[choice] || PRACTICE;
  const [status, setStatus] = useState({ phase: 'loading', text: `Loading ${mode.loading}` });
  const [humanCount, setHumanCount] = useState(null);
  const directorRef = useRef(null);
  const [tutorialSnapshot, setTutorialSnapshot] = useState(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let cancelled = false;
    let game = null;
    let renderer = null;
    let raf = 0;
    let tutorialTimer = null;
    // fresh canvases per mount: a WebGL canvas cannot get a second context after the first one was released (StrictMode remounts)
    const canvas = document.createElement('canvas');
    const hud = document.createElement('canvas');
    fillParent(canvas);
    fillParent(hud);
    canvas.tabIndex = 0;
    hud.style.pointerEvents = 'none';
    host.append(canvas, hud);
    const duel = choice === 'multi' || choice === 'tutorial', teamMode = TEAM_CHOICES.includes(choice);
    const arena = choice !== 'single';
    const map = choice === 'online' ? online?.mapId || 'training' : mapId; // online: the arena picked in the lobby
    const authored = arena && !!GAME2_AUTHORED_MAPS[map]; // a large authored level instead of a BSP
    const common = { sfxBase: `${ASSET_BASE}sfx/`, settings: loadSettings(), saber, mapId: map };
    // Game 1's combat music is stored as HeroBackground "Combat 2" (then
    // "Combat"). Resolve it without delaying Game 2's gameplay or asset load.
    // The engine gets only the URL: music controllers do not share instances.
    const combatTrackRequest = Promise.resolve()
      .then(() => base44.entities.HeroBackground.list())
      .then(selectGame1CombatTrack)
      .catch(() => null);
    let engineOptions = teamMode
      ? { mode: choice, ...common }
      : duel
        ? { mode: choice === 'tutorial' ? 'tutorial' : 'duel', ...common }
        : { mode: 'mission', mission: 'kejim', ...common };

    (async () => {
      try {
        const [{ Renderer }, { loadAll }, { Game }] = await Promise.all([
          import('./engine/gl.js'),
          import('./engine/assets.js'),
          import('./engine/game.js'),
        ]);
        if (cancelled) return;
        renderer = new Renderer(canvas);
        renderer.maxDpr = { performance: 1, balanced: 1.5, sharp: 2 }[common.settings.quality] ?? 1.5;
        const assets = await loadAll(ASSET_BASE, (what) => {
          if (!cancelled) setStatus({ phase: 'loading', text: `Loading ${what}` });
        }, { map: arena && !authored, mapId: GAME2_AUTHORED_MAPS[map] ? 'training' : map });
        if (cancelled) return;
        if (choice === 'online') {
          if (online.local) { // isolated localhost developer test; never on editor/live
            const { LocalSignaling } = await import('./net/signaling.js');
            const signaling = new LocalSignaling(online.selfId);
            if (cancelled) { signaling.close(); return; }
            engineOptions = { mode: 'online', ...common,
              net: { ...online, signaling, iceServers: [] } };
          } else {
            // One Railway WebSocket carries realtime movement and combat. Base44
            // only authenticates the account once, not each animation/attack.
            const token = getAccessToken() || appParams.token;
            if (!token) throw new Error('Sign in to your Atom XE account again before joining multiplayer.');
            engineOptions = { mode: 'online', ...common,
              net: { ...online, transport: 'railway', url: game2RailwayUrl(), token } };
          }
        }
        game = new Game(renderer, assets, canvas, hud, engineOptions);
        if (choice === 'tutorial') {
          const tutorial = new Game2TutorialDirector(game);
          game.tutorial = tutorial;
          directorRef.current = tutorial;
          setTutorialSnapshot(tutorial.snapshot());
          tutorialTimer = setInterval(() => {
            if (!cancelled && !game?.disposed) setTutorialSnapshot(tutorial.snapshot());
          }, 160);
        }
        combatTrackRequest.then((url) => {
          if (!cancelled && game && url) game.setCombatTrackUrl(url);
        });
        if (import.meta.env?.DEV) window.__game2 = game; // development builds only: lets local tests stage scenes
        if (choice !== 'online') setStatus({ phase: 'ready', text: '' });
        // Online play must not look connected until the shared arena welcomes this player.
        if (choice === 'online') {
          setStatus({ phase: 'loading', text: 'Connecting to the shared arena…' });
          const checkConnection = () => {
            if (cancelled || !game) return;
            const net = game.net;
            if (net?.ended) setStatus({ phase: 'error', text: String(net.ended) });
            else if (net?.me && net?.session?.state === 'live') {
              setHumanCount(previous => previous === net.session.roster.size ? previous : net.session.roster.size);
              setStatus(previous => previous.phase === 'ready' ? previous : { phase: 'ready', text: '' });
            }
            else setStatus({ phase: 'loading', text: net?.statusText || 'Connecting to the shared arena…' });
          };
          const connectionTimer = setInterval(checkConnection, 250);
          game._connectionTimer = connectionTimer;
        }
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
      if (tutorialTimer) clearInterval(tutorialTimer);
      directorRef.current = null;
      if (game?._connectionTimer) clearInterval(game._connectionTimer);
      if (game) game.dispose();
      try {
        renderer?.gl?.getExtension('WEBGL_lose_context')?.loseContext();
      } catch {
        // the context is already gone
      }
      canvas.remove();
      hud.remove();
    };
  }, [choice, online, mapId, saber]);

  return (
    <div className="absolute inset-0 select-none overflow-hidden bg-[#05060c]" style={{ touchAction: 'none' }}>
      <div ref={hostRef} className="absolute inset-0" />
      <button
        type="button"
        onClick={onExit}
        className="absolute left-3.5 top-[62px] z-20 flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#080a16]/70 px-2.5 py-1.5 text-[11px] font-semibold text-white/70 backdrop-blur transition hover:bg-[#101528]/90 hover:text-white"
      >
        <Menu className="h-3.5 w-3.5" />
        {choice === 'online' ? 'Lobby' : 'Main menu'}
      </button>
      {choice === 'tutorial' && status.phase === 'ready' && (
        <Game2TutorialOverlay director={directorRef.current} snapshot={tutorialSnapshot} onChange={setTutorialSnapshot} />
      )}
      {choice === 'online' && status.phase === 'ready' && humanCount !== null && (
        <div role="status" aria-live="polite" className="absolute right-3 top-[62px] z-20 rounded-lg border border-white/15 bg-[#080a16]/85 px-3 py-2 text-xs font-semibold text-white/90">
          {humanCount === 1
            ? 'ONLINE · 1 human player · Waiting for other players'
            : `ONLINE · ${humanCount} human players · Real-time PvP`}
          <div className="mt-0.5 text-[10px] font-normal text-white/50">AI Reborn enemies are separate from these players.</div>
        </div>
      )}
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
          <div className="max-w-md text-xs text-white/35">{choice === 'online' ? 'Multiplayer requires a Railway WebSocket connection and valid Atom XE login. Return to the lobby to retry.' : 'The game needs a browser with WebGL2 enabled. Reload after turning on hardware acceleration.'}</div>
        </div>
      )}
    </div>
  );
}
