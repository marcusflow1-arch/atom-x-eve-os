import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, DoorOpen, Gamepad2, Keyboard, Settings2, Swords, Trophy, Users } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { GAME2_SKIRMISH_MAPS } from './engine/arenaMaps.js';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './settings.js';

// Game 2 main menu: the menu runs down the left, the item you click opens on the right, and behind it a live duel
// (two AI fighters in the Lightsaber Training arena, engine 'attract' mode) plays under a slow cinematic camera.
// Picking a fight calls onStart({ choice, mapId, saber }); Game2Duel.jsx runs it.
const BASE = import.meta.env?.BASE_URL ?? '/';
const ASSET_BASE = `${BASE}game2/`;

const MENU_ITEMS = [
  { id: 'story', label: 'Story Mode', icon: BookOpen },
  { id: 'multiplayer', label: 'Multiplayer', icon: Users },
  { id: 'skirmish', label: 'Skirmish', icon: Trophy },
  { id: 'practice', label: 'Duel Practice', icon: Swords },
  { id: 'settings', label: 'Settings', icon: Settings2 },
  { id: 'controls', label: 'Controls', icon: Keyboard },
  { id: 'exit', label: 'Exit to Luna', icon: DoorOpen },
];

// offline matches against AI fighters (engine/teamMatch.js)
const SKIRMISH_MODES = [
  { id: 'ffa', title: 'Free-for-all', size: '1 + 49 AI', blurb: 'Fifty fighters, every one for themselves. First to 15 defeats wins. Respawn after 3 s with 3 s of immunity.' },
  { id: 'tdm', title: 'Team Deathmatch', size: '25 v 25', blurb: 'Blue against red. The first team to 50 defeats takes the match. Respawn after 4 s with 3 s of immunity.' },
  { id: 'ctf', title: 'Capture the Flag', size: '15 v 15', blurb: "Steal the enemy flag, carry it home and defend your own. First to three captures." },
  { id: 'sudden', title: 'Sudden Death', size: '25 v 25', blurb: 'One life each, fifty fighters. Eliminate the entire opposing team.' },
];

const SABER_KITS = [
  { id: 'single', title: 'Single blade', blurb: 'The classic. Fast, Medium and Strong stances.' },
  { id: 'dual', title: 'Dual sabers', blurb: 'A blade in each hand: both cut, faster follow-ups.' },
  { id: 'staff', title: 'Double-bladed', blurb: 'A saberstaff: blades at both ends, guards behind you too.' },
];

const CONTROLS = [
  ['Move · walk · crouch / roll', 'W A S D · Shift · C'],
  ['Jump · Force Jump', 'Space · hold Space'],
  ['Saber attack · stance', 'Left mouse (flick to aim the swing) · Tab'],
  ['Saber throw', 'Hold right mouse: it homes in on the nearest foe and spins inside them'],
  ['Saber kata', 'Left + right mouse together: a chain of your stance\'s attacks, pressing forward (50 Force)'],
  ['Draw saber · Execute', 'R (when a foe glows red and the prompt shows, R executes)'],
  ['Force Push (charge)', 'Hold 1, release to throw: the longer the hold, the harder the push'],
  ['Force Pull', '2 · jump first to yank them up in front of you; Push them while they hang there to blow them away'],
  ['Grip · Lightning · Heal', '3 · 4 · 5 (hold to channel)'],
  ['Speed · Mind Trick · Rage · Protect · Absorb', '6 · 7 · 8 · 9 · 0'],
  ['Force Levitate', 'G · lifts a foe helplessly; any hit on them, or an attack by you, drops them'],
  ['Force Repulse (special)', 'X when the REPULSE meter is full: rise, curl up, burst open; foes around you are blasted away and disintegrate'],
  ['Combos', 'Push, then Speed: dash in front of them before they land · throw the saber, then Lightning: charge it'],
  ['Taunt', 'T'],
  ['Force selector', 'Mouse wheel or [ ] · F casts the highlighted power'],
  ['Controls · mute · zoom', 'F1 · M · Ctrl + wheel'],
];

function useReducedMotion() {
  const [reduce, setReduce] = useState(() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } });
  useEffect(() => {
    let mq; try { mq = window.matchMedia('(prefers-reduced-motion: reduce)'); } catch { return undefined; }
    const on = () => setReduce(mq.matches); mq.addEventListener?.('change', on); return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduce;
}

// Drifting stars and nebula, drawn while the live duel loads (and instead of it with reduced motion / menu motion off).
function Starfield({ animate }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return undefined;
    const ctx = canvas.getContext('2d'); if (!ctx) return undefined;
    let raf = 0, w = 0, h = 0;
    const stars = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random(), z: 0.2 + Math.random() * 0.8, tw: Math.random() * 6 }));
    const resize = () => { const dpr = Math.min(window.devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = Math.max(1, Math.floor(w * dpr)); canvas.height = Math.max(1, Math.floor(h * dpr)); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      const n1 = ctx.createRadialGradient(w * (0.72 + 0.03 * Math.sin(t * 0.00007)), h * 0.38, 0, w * 0.72, h * 0.38, Math.max(w, h) * 0.6);
      n1.addColorStop(0, 'rgba(70,40,120,0.42)'); n1.addColorStop(0.5, 'rgba(20,40,90,0.18)'); n1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = n1; ctx.fillRect(0, 0, w, h);
      const n2 = ctx.createRadialGradient(w * 0.86, h * (0.78 + 0.03 * Math.cos(t * 0.00005)), 0, w * 0.86, h * 0.78, Math.max(w, h) * 0.45);
      n2.addColorStop(0, 'rgba(160,30,40,0.26)'); n2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = n2; ctx.fillRect(0, 0, w, h);
      for (const s of stars) {
        const x = ((s.x + t * 0.000004 * s.z) % 1) * w, y = s.y * h, a = 0.35 + 0.45 * Math.abs(Math.sin(s.tw + t * 0.0012 * s.z));
        ctx.fillStyle = `rgba(200,220,255,${a * s.z})`; ctx.fillRect(x, y, 1.4 * s.z + 0.3, 1.4 * s.z + 0.3);
      }
    };
    const loop = (t) => { draw(t); raf = requestAnimationFrame(loop); };
    resize(); const ro = new ResizeObserver(resize); ro.observe(canvas);
    if (animate) raf = requestAnimationFrame(loop); else draw(0);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [animate]);
  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}

// The live duel behind the menu (engine 'attract' mode). Fades in on its first rendered frame; muted, no input.
// With the system's reduced-motion preference the camera holds still (calm) and only the fighters move; the Settings
// switch "Live menu background" turns it off entirely.
function LiveDuel({ onLive, calm }) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current; if (!host) return undefined;
    let cancelled = false, game = null, renderer = null, raf = 0;
    const canvas = document.createElement('canvas'), hud = document.createElement('canvas');
    for (const el of [canvas, hud]) Object.assign(el.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', pointerEvents: 'none' });
    canvas.setAttribute('aria-hidden', 'true'); hud.setAttribute('aria-hidden', 'true');
    host.append(canvas, hud);
    (async () => {
      try {
        const [{ Renderer }, { loadAll }, { Game }] = await Promise.all([import('./engine/gl.js'), import('./engine/assets.js'), import('./engine/game.js')]);
        if (cancelled) return;
        renderer = new Renderer(canvas); renderer.maxDpr = 1;
        const assets = await loadAll(ASSET_BASE, () => {}, { map: true, mapId: 'training' });
        if (cancelled) return;
        game = new Game(renderer, assets, canvas, hud, { mode: 'attract', calm, sfxBase: `${ASSET_BASE}sfx/` });
        let first = true;
        const loop = (time) => { if (cancelled) return; game.frame(time); if (first) { first = false; onLive(true); } raf = requestAnimationFrame(loop); };
        raf = requestAnimationFrame(loop);
      } catch (error) { console.warn('Game 2 menu backdrop unavailable', error); }
    })();
    return () => {
      cancelled = true; cancelAnimationFrame(raf); onLive(false);
      if (game) game.dispose();
      try { renderer?.gl?.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* already gone */ }
      canvas.remove(); hud.remove();
    };
  }, [onLive, calm]);
  return <div ref={hostRef} aria-hidden="true" className="absolute inset-0" />;
}

function MenuBackdrop({ motion }) {
  const reduce = useReducedMotion(), [live, setLive] = useState(false);
  const onLive = useCallback((v) => setLive(v), []);
  return (
    <div className="absolute inset-0 overflow-hidden" data-testid="game2-menu-backdrop" data-live={live ? 'true' : 'false'}>
      <Starfield animate={!reduce && !live} />
      {motion && <div className="absolute inset-0" style={{ opacity: live ? 1 : 0, transition: 'opacity 1.6s ease' }}><LiveDuel onLive={onLive} calm={reduce} /></div>}
      <div className="absolute inset-0 bg-gradient-to-r from-[#02040a]/90 via-[#02040a]/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#02040a]/70 to-transparent" />
    </div>
  );
}

function Panel({ kicker, title, children }) {
  return (
    <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#060a14]/80 p-6 shadow-2xl backdrop-blur-md">
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">{kicker}</div>
      <h2 className="mt-1 text-2xl font-extrabold tracking-wide sm:text-3xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function PlayButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400/90 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#03101a] shadow-[0_0_24px_rgba(56,189,248,0.35)] transition hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
      {children} <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
    </button>
  );
}

function Choice({ on, onClick, title, sub, blurb }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={`rounded-xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${on ? 'border-cyan-300/70 bg-cyan-300/15' : 'border-white/10 bg-white/[0.03] hover:border-cyan-200/40'}`}>
      <div className="flex items-baseline justify-between gap-2"><span className="text-sm font-bold">{title}</span>{sub && <span className="text-[10px] font-semibold uppercase tracking-widest text-white/45">{sub}</span>}</div>
      {blurb && <p className="mt-1 text-[12px] leading-snug text-white/55">{blurb}</p>}
    </button>
  );
}

function SaberPicker({ saber, setSaber }) {
  return (
    <div className="mt-5">
      <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">Lightsaber</div>
      <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="Lightsaber">
        {SABER_KITS.map(k => <Choice key={k.id} on={saber === k.id} onClick={() => setSaber(k.id)} title={k.title} blurb={k.blurb} />)}
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, format }) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 text-white/75">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} aria-label={label} className="flex-1 accent-cyan-300" />
      <span className="w-12 text-right font-mono text-xs text-white/60">{format ? format(value) : value}</span>
    </label>
  );
}

function Toggle({ label, value, onChange, hint }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 text-white/75">{label}</span>
      <button type="button" role="switch" aria-checked={value} aria-label={label} onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition ${value ? 'bg-cyan-400/80' : 'bg-white/15'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
      {hint && <span className="text-xs text-white/40">{hint}</span>}
    </div>
  );
}

function SettingsPanel({ settings, setSettings }) {
  const set = (k) => (v) => setSettings(s => saveSettings({ ...s, [k]: v }));
  const pct = v => Math.round(v * 100) + '%';
  return (
    <Panel kicker="Options" title="Settings">
      <div className="space-y-4">
        <Slider label="Mouse sensitivity" value={settings.sensitivity} min={0.25} max={3} step={0.05} onChange={set('sensitivity')} format={v => v.toFixed(2) + 'x'} />
        <Toggle label="Invert mouse Y" value={settings.invertY} onChange={set('invertY')} />
        <Slider label="Sound effects" value={settings.masterVolume} min={0} max={1} step={0.05} onChange={set('masterVolume')} format={pct} />
        <Slider label="Music" value={settings.musicVolume} min={0} max={1} step={0.05} onChange={set('musicVolume')} format={pct} />
        <Slider label="Field of view" value={settings.fov} min={50} max={90} step={1} onChange={set('fov')} format={v => v + '°'} />
        <div className="flex items-center gap-3 text-sm">
          <span className="w-40 shrink-0 text-white/75">Render quality</span>
          <div className="flex gap-2" role="group" aria-label="Render quality">
            {['performance', 'balanced', 'sharp'].map(q => (
              <button key={q} type="button" aria-pressed={settings.quality === q} onClick={() => set('quality')(q)}
                className={`rounded-lg border px-3 py-1.5 text-xs capitalize transition ${settings.quality === q ? 'border-cyan-300/70 bg-cyan-300/15' : 'border-white/10 hover:border-cyan-200/40'}`}>{q}</button>
            ))}
          </div>
        </div>
        <Toggle label="Show FPS" value={settings.showFps} onChange={set('showFps')} />
        <Toggle label="Live menu background" value={settings.menuMotion} onChange={set('menuMotion')} hint="the duel behind this menu" />
      </div>
      <button type="button" onClick={() => setSettings(saveSettings(DEFAULT_SETTINGS))} className="mt-6 text-xs font-semibold uppercase tracking-widest text-white/50 hover:text-white">Restore defaults</button>
    </Panel>
  );
}

export default function Game2Menu({ onStart }) {
  const navigate = useNavigate();
  const [item, setItem] = useState('story');
  const [settings, setSettings] = useState(loadSettings);
  const [mode, setMode] = useState('ffa');
  const [mapId, setMapId] = useState('skybridge');
  const [saber, setSaber] = useState(() => { try { return window.localStorage.getItem('atomxe.game2.saber') || 'single'; } catch { return 'single'; } });
  const navRef = useRef(null);
  useEffect(() => { try { window.localStorage.setItem('atomxe.game2.saber', saber); } catch { /* private mode */ } }, [saber]);

  const start = (choice, extra = {}) => onStart({ choice, mapId, saber, ...extra });
  const pick = (id) => { if (id === 'exit') navigate(createPageUrl('LunaTemplate')); else setItem(id); };
  // Up / Down move through the menu, Enter opens an item (buttons already take Enter / Space)
  const onNavKey = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault(); const list = [...navRef.current.querySelectorAll('button')], i = list.indexOf(document.activeElement);
    list[(i + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length]?.focus();
  };

  let panel = null;
  if (item === 'story') panel = (
    <Panel kicker="Story Mode · Mission 1" title="Kejim Post">
      <p className="text-sm leading-relaxed text-white/70">Land in the canyon with Jan Ors, breach an Imperial outpost, pull its flight logs while the garrison counter-attacks, and face what waits in the hangar. Bryar pistol and lightsaber; the same saber and Force rules as every other mode.</p>
      <PlayButton onClick={() => start('single')}>Begin mission</PlayButton>
    </Panel>
  );
  else if (item === 'multiplayer') panel = (
    <Panel kicker="Multiplayer · online" title="Free-for-all arena">
      <p className="text-sm leading-relaxed text-white/70">Real-time free-for-all with players from anywhere, Jedi or Dark Jedi, with no player limit. Pick the map in the lobby: each map is its own arena. Join or leave at any time; defeated fighters are back in 3 s with 3 s of immunity. Needs a signed-in Atom XE account.</p>
      <SaberPicker saber={saber} setSaber={setSaber} />
      <PlayButton onClick={() => start('online')}>Find the arena</PlayButton>
    </Panel>
  );
  else if (item === 'skirmish') panel = (
    <Panel kicker="Skirmish · offline against AI" title="Choose a match">
      <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Match type">
        {SKIRMISH_MODES.map(m => <Choice key={m.id} on={mode === m.id} onClick={() => setMode(m.id)} title={m.title} sub={m.size} blurb={m.blurb} />)}
      </div>
      <div className="mb-2 mt-5 text-xs font-semibold uppercase tracking-widest text-white/50">Map</div>
      <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Map">
        {Object.values(GAME2_SKIRMISH_MAPS).map(m => <Choice key={m.id} on={mapId === m.id} onClick={() => setMapId(m.id)} title={m.label} sub={m.size} blurb={m.blurb} />)}
      </div>
      <SaberPicker saber={saber} setSaber={setSaber} />
      <PlayButton onClick={() => start(mode)}>Start {SKIRMISH_MODES.find(m => m.id === mode).title}</PlayButton>
    </Panel>
  );
  else if (item === 'practice') panel = (
    <Panel kicker="Duel Practice · offline" title="Dark Jedi duel">
      <p className="text-sm leading-relaxed text-white/70">One on one with a Reborn. He has the same Force powers, costs and rules as you: break his Grip, answer his Push, and finish him when he is low.</p>
      <div className="mb-2 mt-5 text-xs font-semibold uppercase tracking-widest text-white/50">Map</div>
      <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Map">
        {Object.values(GAME2_SKIRMISH_MAPS).map(m => <Choice key={m.id} on={mapId === m.id} onClick={() => setMapId(m.id)} title={m.label} sub={m.size} blurb={m.blurb} />)}
      </div>
      <SaberPicker saber={saber} setSaber={setSaber} />
      <PlayButton onClick={() => start('multi')}>Start the duel</PlayButton>
    </Panel>
  );
  else if (item === 'settings') panel = <SettingsPanel settings={settings} setSettings={setSettings} />;
  else if (item === 'controls') panel = (
    <Panel kicker="Keyboard and mouse" title="Controls">
      <dl className="grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-[minmax(0,13rem)_1fr]">
        {CONTROLS.map(([k, v]) => [<dt key={k + 'k'} className="font-semibold text-cyan-200/80">{k}</dt>, <dd key={k + 'v'} className="text-white/70">{v}</dd>])}
      </dl>
    </Panel>
  );

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#02040a] text-white" data-testid="game2-menu">
      <MenuBackdrop motion={settings.menuMotion} />
      <div className="relative z-10 flex h-full flex-col overflow-y-auto md:flex-row md:overflow-hidden">
        <nav ref={navRef} onKeyDown={onNavKey} aria-label="Game 2 main menu" className="flex shrink-0 flex-col justify-center px-6 pb-4 pt-8 md:w-[320px] md:px-10 md:py-0">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-300/80"><Gamepad2 className="h-4 w-4" />Game 2</div>
            <div className="mt-1 text-3xl font-black tracking-[0.08em]">JEDI DUELS</div>
            <div className="mt-1 h-px w-40 bg-gradient-to-r from-cyan-300/80 to-transparent" />
          </div>
          <ul className="space-y-1">
            {MENU_ITEMS.map(({ id, label, icon: Icon }) => {
              const on = item === id;
              return (
                <li key={id}>
                  <button type="button" onClick={() => pick(id)} aria-current={on ? 'page' : undefined} data-menu-item={id}
                    className={`group relative flex w-full items-center gap-3 rounded-lg py-2.5 pl-5 pr-3 text-left text-[15px] font-bold uppercase tracking-[0.16em] transition focus:outline-none focus-visible:bg-white/10 ${on ? 'text-white' : 'text-white/55 hover:text-white'}`}>
                    <span className={`absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full transition ${on ? 'bg-cyan-300 shadow-[0_0_12px_3px_rgba(103,232,249,0.65)]' : 'bg-transparent group-hover:bg-white/30'}`} />
                    <Icon className={`h-4 w-4 transition ${on ? 'text-cyan-300' : 'text-white/40 group-hover:text-white/70'}`} />
                    <span className={`transition ${on ? 'translate-x-1' : 'group-hover:translate-x-0.5'}`}>{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-8 hidden text-[11px] leading-relaxed text-white/35 md:block">↑ ↓ to move · Enter to open</p>
        </nav>
        <section className="flex min-h-0 flex-1 items-center justify-start px-4 pb-10 md:overflow-y-auto md:px-6 md:py-10" aria-live="polite">
          {panel}
        </section>
      </div>
    </div>
  );
}
