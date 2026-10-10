import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, LogIn, Swords, Users, Wifi } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Base44Signaling, LocalSignaling, makePeerId, pickArena, MAX_PLAYERS } from './net/signaling.js';

// Game 2 multiplayer: one free-for-all arena everybody shares. Pick a callsign and a look (Jedi or Dark Jedi) and enter;
// the first player in opens the arena, everyone after joins it, and anyone can leave at any time.
// The arena beacon and the WebRTC offer / answer go through the app's Base44 backend (Game2Room / Game2Signal); the match
// itself runs peer to peer. ?g2net=local switches to same-browser signaling for testing with several tabs.
const NAME_KEY = 'atomxe.game2.callsign';
const SIDE_KEY = 'atomxe.game2.side';
const store = {
  get(k, d) { try { return window.localStorage.getItem(k) || d; } catch { return d; } },
  set(k, v) { try { window.localStorage.setItem(k, v); } catch { /* private mode */ } },
};
const localNet = () => { try { return new URLSearchParams(window.location.search).get('g2net') === 'local'; } catch { return false; } };

let icePromise = null;
export function getIceServers() { // same helper as the voice chat: STUN, plus TURN when the backend has one configured
  if (!icePromise) icePromise = base44.functions.invoke('getIceServers', {}).then(r => r?.data?.iceServers || r?.iceServers || [{ urls: 'stun:stun.l.google.com:19302' }]).catch(() => [{ urls: 'stun:stun.l.google.com:19302' }]);
  return icePromise;
}

const LOOK = {
  light: { label: 'Jedi', blurb: 'Blue blade', on: 'border-sky-300/70 bg-sky-400/15 text-sky-100', dot: 'bg-sky-300' },
  dark: { label: 'Dark Jedi', blurb: 'Red blade, dark robes', on: 'border-rose-300/70 bg-rose-500/15 text-rose-100', dot: 'bg-rose-400' },
};

export default function Game2Lobby({ onBack, onStart, onPractice }) {
  const local = useMemo(localNet, []);
  const [user, setUser] = useState(null);
  const [auth, setAuth] = useState('checking');
  const [name, setName] = useState(() => store.get(NAME_KEY, ''));
  const [side, setSide] = useState(() => (store.get(SIDE_KEY, 'light') === 'dark' ? 'dark' : 'light'));
  const [arena, setArena] = useState(undefined); // undefined = loading, null = nobody in yet
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { // signed-in account (the arena and its signals are tied to it); local test mode needs none
    let off = false;
    if (local) { setUser({ id: 'local' + Math.random().toString(36).slice(2, 6), full_name: '' }); setAuth('in'); return undefined; }
    base44.auth.me().then(u => { if (!off) { setUser(u); setAuth(u ? 'in' : 'out'); } }).catch(() => { if (!off) setAuth('out'); });
    return () => { off = true; };
  }, [local]);
  useEffect(() => { if (user && !name) setName(((user.full_name || '').split(' ')[0] || 'Jedi').slice(0, 20)); }, [user, name]);

  const sig = useMemo(() => { // one signaling client to watch the arena
    if (!user) return null; const id = makePeerId(user.id);
    return local ? new LocalSignaling(id) : new Base44Signaling(base44, id);
  }, [user, local]);
  useEffect(() => () => { try { sig?.close(); } catch { /* closed */ } }, [sig]);
  useEffect(() => {
    if (!sig) return undefined; let off = false;
    const load = () => sig.listRooms().then(r => { if (!off) { setArena(pickArena(r)); setError(''); } }).catch(e => { if (off) return; const m = String(e?.message || e);
      setError(/404|not found|entity/i.test(m) ? 'Online play is not set up on the server yet: publish the latest version of the app in Base44 so its Game2Room and Game2Signal tables are created.' : 'Could not reach the arena: ' + m); });
    load(); const t = setInterval(load, 3000);
    return () => { off = true; clearInterval(t); };
  }, [sig]);

  const callsign = (name || 'Jedi').trim().slice(0, 20) || 'Jedi';
  const players = arena ? arena.players || 1 : 0, full = players >= MAX_PLAYERS;
  const enter = () => { store.set(NAME_KEY, callsign); store.set(SIDE_KEY, side); setBusy(true); onStart({ name: callsign, side, selfId: makePeerId(user.id), local }); };

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[radial-gradient(ellipse_at_top,#1a1530_0%,#070812_55%,#05060c_100%)] text-white">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-8">
        <button type="button" onClick={onBack} className="mb-5 inline-flex w-fit items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/[0.08] hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Main menu
        </button>
        <div className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-300/80">Game 2 · Multiplayer</div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-wide sm:text-3xl">Free-for-all arena</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/55">One Lightsaber Training arena for everybody: up to {MAX_PLAYERS} players and the AI Reborn, every fighter for themselves. Come in and leave whenever you like; defeated fighters are back in 3 seconds.</p>
        </div>

        {auth === 'checking' && <div className="flex items-center gap-2 text-sm text-white/60"><Loader2 className="h-4 w-4 animate-spin" /> Checking your account…</div>}
        {auth === 'out' && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-base font-bold">Sign in to play online</div>
            <p className="mt-1 text-sm text-white/55">The arena is tied to your Atom X Eve account. You can still practise against the Reborn without signing in.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => base44.auth.redirectToLogin(window.location.href)} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400/90 px-3 py-2 text-sm font-bold text-[#04121a] hover:bg-cyan-300"><LogIn className="h-4 w-4" /> Sign in</button>
              <button type="button" onClick={onPractice} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.06]"><Swords className="h-4 w-4" /> Practice vs the Reborn</button>
            </div>
          </div>
        )}

        {auth === 'in' && (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Lightsaber Training</div>
                  <div className="mt-1 flex items-center gap-2 text-lg font-bold">
                    <Users className="h-5 w-5 text-cyan-200" />
                    {arena === undefined ? 'Checking the arena…' : players === 0 ? 'Nobody in yet: you open it' : `${players}/${MAX_PLAYERS} players in`}
                  </div>
                  {arena && <div className="mt-0.5 text-xs text-white/50"><span className="text-sky-300">{arena.light || 0} Jedi</span> · <span className="text-rose-300">{arena.dark || 0} Dark Jedi</span>{arena.ai ? ` · ${arena.ai} AI Reborn` : ''}</div>}
                </div>
                <button type="button" disabled={busy || full || arena === undefined} onClick={enter}
                  className="rounded-xl bg-cyan-400/90 px-5 py-2.5 text-base font-extrabold text-[#04121a] hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40">
                  {full ? 'Arena full' : 'Enter the arena'}
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Callsign</span>
                  <input value={name} maxLength={20} onChange={e => setName(e.target.value)} placeholder="Jedi" className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-300/60" />
                </label>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Fight as</span>
                  <div className="mt-1 flex gap-2">
                    {['light', 'dark'].map(s => (
                      <button key={s} type="button" onClick={() => setSide(s)} aria-pressed={side === s}
                        className={`flex min-w-[8.5rem] items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-bold transition ${side === s ? LOOK[s].on : 'border-white/10 text-white/60 hover:bg-white/[0.06]'}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${LOOK[s].dot}`} />{LOOK[s].label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-1 text-[11px] text-white/45">{LOOK[side].blurb} · free-for-all: everyone fights everyone</div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-white/45">
              <span className="inline-flex items-center gap-1.5"><Wifi className="h-3.5 w-3.5" /> Players connect to each other directly. Your own moves never wait for the network; ping depends on the distance between players.</span>
              <button type="button" onClick={onPractice} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 font-semibold text-white/75 hover:bg-white/[0.06]"><Swords className="h-3.5 w-3.5" /> Practice offline vs the Reborn</button>
            </div>
            {error && <div className="mt-3 rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">{error}</div>}
          </>
        )}
      </div>
    </div>
  );
}
