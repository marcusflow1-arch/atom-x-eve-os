import { useMemo, useState } from 'react';
import {
  BellRing, Check, Compass, Crown, Gamepad2, Layers, Map, Shield,
  Skull, Swords, Trophy, Users, X, Zap
} from 'lucide-react';
import LunaDashboardArenaPanel from './LunaDashboardArenaPanel';
import useBattleArena from '@/components/battle/useBattleArena';
import { arenaPresentation, useArenaPresentation } from '@/components/battle/arenaPresentation';

const MODES = [
  {
    id: 'pvp',
    label: 'PvP',
    full: 'Player vs Player',
    icon: Swords,
    tone: 'text-rose-100',
    title: 'Challenge another avatar.',
    copy: 'Two players enter the same Luna dashboard, lock four achievement cards, trade turns, manage AP, and use active defense to outplay one another.',
    routeIds: ['duel'],
  },
  {
    id: 'pve',
    label: 'PvE',
    full: 'Player vs Environment',
    icon: Shield,
    tone: 'text-cyan-100',
    title: 'Push through dungeons.',
    copy: 'Run linked combat rooms solo or with a party. Health carries forward, camps restore part of the team, and the final room pays out a field chest.',
    routeIds: ['vault'],
  },
  {
    id: 'pvwe',
    label: 'PvWE',
    full: 'Player vs World Environment',
    icon: Crown,
    tone: 'text-amber-100',
    title: 'Explore the connected frontier.',
    copy: 'Enter the worlds represented by the games and cards you own. Take quests, hunt guardians, rally against world bosses, and bring rewards back to Luna.',
    routeIds: ['patrol', 'vault', 'colossus'],
  },
];

const routeIcon = {
  pvp: Swords,
  dungeon: Skull,
  quest: Map,
  world_boss: Crown,
};


function FieldMode({ battle }) {
  const [nodes, setNodes] = useState([]);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [prepared, setPrepared] = useState('');

  const locate = () => {
    if (!navigator.geolocation || locating) {
      if (!navigator.geolocation) setError('Location services are unavailable in this browser.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const cellLat = Math.round(position.coords.latitude * 100) / 100;
          const cellLng = Math.round(position.coords.longitude * 100) / 100;
          const response = await battle.field({ cell_lat: cellLat, cell_lng: cellLng });
          setNodes(response?.nodes || []);
        } catch (err) {
          setError(err?.message || 'Field signals could not be generated.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setError('Location permission is required only while you use Field Mode.');
        setLocating(false);
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 12000 }
    );
  };

  const prepare = (node) => {
    setPrepared(node.id);
    window.dispatchEvent(new CustomEvent('prepareAIBattleFieldNode', {
      detail: { world_id: node.world?.id, route_id: node.route_id, field_node_id: node.id },
    }));
  };

  return (
    <section className="mt-5 border border-amber-100/[0.08] bg-amber-100/[0.018] p-3.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[6px] font-black uppercase tracking-[0.15em] text-amber-100/38">Field Mode / Real-World Layer</p>
          <h3 className="mt-1 text-[11px] font-semibold text-white/70">Your surroundings become a discovery surface.</h3>
          <p className="mt-1 max-w-xl text-[7px] leading-4 text-white/30">Location is opt-in. The browser rounds it to a coarse cell before generating nearby game-world quests, caches, dungeon breaches and boss signals.</p>
        </div>
        <button type="button" onClick={locate} disabled={locating} className="flex h-9 shrink-0 items-center gap-2 border border-amber-100/12 bg-amber-100/[0.04] px-3 text-[7px] font-black uppercase tracking-[0.09em] text-amber-50/58 disabled:opacity-40">
          {locating ? <Compass className="h-3.5 w-3.5 animate-spin" /> : <Map className="h-3.5 w-3.5" />}
          {nodes.length ? 'Refresh Field' : 'Locate Field'}
        </button>
      </div>

      {error && <p className="mt-2 text-[7px] text-rose-100/52">{error}</p>}

      {nodes.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {nodes.slice(0, 4).map((node) => (
            <article key={node.id} className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2 border border-white/[0.05] bg-black/[0.12] p-2.5">
              <div className="grid h-8 w-8 place-items-center border border-white/[0.06] bg-white/[0.015]">
                <Compass className="h-3.5 w-3.5 text-amber-100/38" style={{ transform: 'rotate(' + String(node.bearing_deg || 0) + 'deg)' }} />
              </div>
              <div className="min-w-0">
                <strong className="block truncate text-[8px] text-white/62">{node.title}</strong>
                <span className="mt-0.5 block truncate text-[5.5px] uppercase tracking-[0.06em] text-white/24">{node.world?.title} · {Math.round(Number(node.distance_m || 0))} m · {String(node.type || '').replaceAll('_', ' ')}</span>
              </div>
              <button type="button" onClick={() => prepare(node)} className={'border px-2 py-1.5 text-[6px] font-black uppercase tracking-[0.08em] ' + (prepared === node.id ? 'border-emerald-100/12 bg-emerald-100/[0.04] text-emerald-100/55' : 'border-white/[0.06] text-white/36 hover:text-white/60')}>
                {prepared === node.id ? 'Prepared' : 'Prepare'}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ConnectedWorlds({ hub, selectedMode, battle }) {
  const worlds = hub?.worlds || [];
  const routes = (hub?.routes || []).filter((route) => selectedMode.routeIds.includes(route.id));
  return (
    <section className="min-h-0 border-r border-white/[0.055] bg-black/[0.10] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[6px] font-black uppercase tracking-[0.17em] text-cyan-100/28">Connected Worlds</p>
          <h2 className="mt-1 text-[16px] font-semibold text-white/82">{selectedMode.title}</h2>
          <p className="mt-2 max-w-2xl text-[8px] leading-4 text-white/36">{selectedMode.copy}</p>
        </div>
        <Compass className="h-6 w-6 shrink-0 text-white/20" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {worlds.slice(0, 8).map((world) => (
          <article key={world.id} className="relative min-h-[104px] overflow-hidden border border-white/[0.055] bg-white/[0.015] p-3">
            {world.image ? <img src={world.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" /> : null}
            <div className="absolute inset-0 bg-gradient-to-t from-[#071019] via-[#071019]/82 to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-end">
              <span className="text-[5px] font-black uppercase tracking-[0.12em] text-cyan-100/28">{world.id === 'luna' ? 'Universal frontier' : 'Game world'}</span>
              <strong className="mt-1 truncate text-[9px] text-white/68">{world.title}</strong>
              <small className="mt-1 text-[6px] text-white/28">{world.id === 'luna' ? 'Open to every player' : String(world.cards || 0) + ' owned cards · ' + String(world.earned || 0) + ' earned'}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-[6px] font-black uppercase tracking-[0.15em] text-white/24">Available Encounter Types</p>
          <span className="text-[6px] text-white/20">{routes.length} route{routes.length === 1 ? '' : 's'}</span>
        </div>
        <div className="mt-2 space-y-2">
          {routes.map((route) => {
            const Icon = routeIcon[route.type] || Gamepad2;
            return (
              <div key={route.id} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 border border-white/[0.05] bg-white/[0.012] p-3">
                <div className="grid h-9 w-9 place-items-center border border-white/[0.06] bg-white/[0.018]"><Icon className="h-4 w-4 text-white/36" /></div>
                <div className="min-w-0">
                  <strong className="block text-[9px] text-white/68">{route.title}</strong>
                  <p className="mt-1 line-clamp-2 text-[7px] leading-3.5 text-white/30">{route.description}</p>
                </div>
                <div className="text-right">
                  <span className="block text-[7px] font-semibold text-amber-100/46">{route.xp} XP</span>
                  <small className="mt-1 block text-[5px] uppercase tracking-[0.08em] text-white/20">{route.min === route.max ? route.min : route.min + '–' + route.max} players</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedMode.id === 'pvwe' && <FieldMode battle={battle} />}
    </section>
  );
}

function Arsenal({ hub }) {
  const cards = hub?.player?.cards || [];
  return (
    <aside className="min-h-0 bg-black/[0.13] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[6px] font-black uppercase tracking-[0.15em] text-white/24">Achievement Arsenal</p>
          <h3 className="mt-1 text-[12px] font-semibold text-white/72">Your four battle cards</h3>
        </div>
        <Layers className="h-5 w-5 text-cyan-100/28" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((index) => {
          const card = cards[index];
          return (
            <div key={index} className="relative min-h-[124px] overflow-hidden border border-white/[0.055] bg-white/[0.015]">
              {card?.image ? <img src={card.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-28" /> : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[#071019] via-[#071019]/84 to-transparent" />
              <div className="relative z-10 flex min-h-[124px] flex-col justify-end p-2.5">
                <span className="text-[5px] font-black uppercase tracking-[0.12em] text-white/22">Slot {index + 1}</span>
                <strong className="mt-1 line-clamp-2 text-[8px] leading-3 text-white/70">{card?.name || 'Empty slot'}</strong>
                {card && (
                  <>
                    <small className="mt-1 text-[5.5px] uppercase tracking-[0.07em] text-cyan-100/32">{card.rarity} · {card.type}</small>
                    <div className="mt-2 flex items-center justify-between text-[5.5px]">
                      <span className="text-white/27">{card.effect} {card.value}</span>
                      <span className="font-bold text-cyan-100/45">{card.cost} AP</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 border-t border-white/[0.055] pt-4">
        <div className="flex items-center gap-2 text-[6px] font-black uppercase tracking-[0.13em] text-amber-100/34"><Trophy className="h-3.5 w-3.5" />Achievement → Ability</div>
        <p className="mt-2 text-[7px] leading-4 text-white/31">
          Cards earned from game achievements are locked into the encounter when you deploy. Ability cards attack, Equipment cards shield, Companions heal, and cards from the selected game world gain resonance.
        </p>
      </div>
    </aside>
  );
}

function CurrentExpeditions({ hub, onResume }) {
  const active = (hub?.encounters || []).filter((encounter) => ['lobby', 'active'].includes(encounter.status));
  if (!active.length) return null;
  return (
    <section className="border-t border-white/[0.055] bg-black/[0.08] px-5 py-3">
      <div className="flex items-center gap-2 overflow-x-auto">
        <span className="shrink-0 text-[6px] font-black uppercase tracking-[0.14em] text-white/23">Current</span>
        {active.slice(0, 6).map((encounter) => (
          <button key={encounter.id} type="button" onClick={() => onResume(encounter.id)} className="flex min-w-[205px] items-center gap-2 border border-cyan-100/08 bg-cyan-100/[0.025] px-3 py-2 text-left">
            <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-200/55" />
            <span className="min-w-0">
              <strong className="block truncate text-[7px] text-white/54">{encounter.route?.title || 'Expedition'}</strong>
              <small className="mt-0.5 block truncate text-[5px] uppercase tracking-[0.07em] text-white/22">{encounter.world?.title} · {encounter.status}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function LunaAIBattleOverlay({ onClose }) {
  const [mode, setMode] = useState('pvp');
  const presentation = useArenaPresentation();
  const arenaStage = Boolean(presentation.encounterId);
  const battle = useBattleArena();
  const selectedMode = useMemo(() => MODES.find((item) => item.id === mode) || MODES[0], [mode]);
  const ActiveModeIcon = selectedMode.icon;

  const closeOverlay = () => {
    if (arenaStage) arenaPresentation.clear();
    onClose?.();
  };

  return (
    <div
      data-dashboard-utility-workspace
      aria-label="AI Battle workspace"
      className="fixed left-[330px] right-0 top-[64px] bottom-[32px] z-[130] pointer-events-auto overflow-hidden"
      style={{
        background: arenaStage
          ? 'linear-gradient(180deg, rgba(5,9,14,.22), rgba(5,9,14,.02) 30%, rgba(5,9,14,.01) 70%, rgba(5,9,14,.10))'
          : 'linear-gradient(135deg, rgba(7,11,17,.96), rgba(13,20,30,.94) 46%, rgba(6,10,16,.97))',
        backdropFilter: arenaStage ? 'none' : 'blur(26px) saturate(132%)',
        WebkitBackdropFilter: arenaStage ? 'none' : 'blur(26px) saturate(132%)',
        boxShadow: arenaStage ? 'none' : 'inset 1px 0 0 rgba(255,255,255,.055), inset 0 1px 0 rgba(255,255,255,.035)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(244,63,94,.055),transparent_30%),radial-gradient(circle_at_64%_18%,rgba(103,232,249,.05),transparent_34%),radial-gradient(circle_at_88%_88%,rgba(251,191,36,.04),transparent_30%)]" />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-5 border-b border-white/[0.07] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rotate-45 border border-white/[0.10] bg-white/[0.025]"><ActiveModeIcon className={'h-4 w-4 -rotate-45 ' + selectedMode.tone} /></div>
            <div>
              <p className="text-[7px] font-black uppercase tracking-[0.2em] text-white/28">Luna Combat Network</p>
              <h1 className="mt-0.5 text-[21px] font-semibold tracking-tight text-white/90">AI Battle</h1>
              <p className="mt-0.5 text-[8px] text-white/34">Your dashboard becomes the arena. Your achievements become your moves.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!arenaStage && (
              <>
                <span className="flex items-center gap-1.5 text-[6px] uppercase tracking-[0.09em] text-white/22"><Layers className="h-3 w-3" />{battle.hub?.player?.cards?.length || 0}/4 cards</span>
                <span className="flex items-center gap-1.5 text-[6px] uppercase tracking-[0.09em] text-white/22"><Users className="h-3 w-3" />{battle.hub?.contacts?.length || 0} connected players</span>
              </>
            )}
            <button type="button" onClick={closeOverlay} aria-label="Close AI Battle" className="grid h-9 w-9 place-items-center border border-white/[0.07] bg-black/25 text-white/45 backdrop-blur-lg hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button>
          </div>
        </header>

        {!arenaStage && (
          <div className="flex shrink-0 items-center border-b border-white/[0.055] px-6">
            {MODES.map(({ id, label, full, icon: Icon, tone }) => (
              <button key={id} type="button" onClick={() => setMode(id)} className={'relative flex min-w-[180px] items-center gap-2.5 px-4 py-3 text-left transition-colors ' + (mode === id ? 'bg-white/[0.03]' : 'hover:bg-white/[0.018]')}>
                <Icon className={'h-3.5 w-3.5 ' + (mode === id ? tone : 'text-white/25')} />
                <span>
                  <strong className={mode === id ? 'text-[9px] text-white/82' : 'text-[9px] text-white/42'}>{label}</strong>
                  <small className="mt-0.5 block text-[5.5px] uppercase tracking-[0.08em] text-white/22">{full}</small>
                </span>
                {mode === id && <i className="absolute inset-x-3 bottom-0 h-px bg-cyan-100/38" />}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 text-[6px] uppercase tracking-[0.1em] text-emerald-100/30"><BellRing className="h-3 w-3" />Server-authoritative combat</div>
          </div>
        )}

        <main className="min-h-0 flex-1">
          {arenaStage ? (
            <LunaDashboardArenaPanel mode={mode} />
          ) : battle.isLoading ? (
            <div className="grid h-full place-items-center text-[8px] uppercase tracking-[0.14em] text-white/28">Preparing expedition network…</div>
          ) : battle.error ? (
            <div className="grid h-full place-items-center text-center">
              <div><Shield className="mx-auto h-7 w-7 text-rose-100/30" /><p className="mt-3 text-[9px] text-white/42">AI Battle could not connect.</p><button type="button" onClick={() => battle.refresh()} className="mt-3 border border-white/[0.07] px-4 py-2 text-[7px] text-white/48">Reconnect</button></div>
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              <LunaDashboardArenaPanel mode={mode} />
              <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.45fr)_320px]">
                <ConnectedWorlds hub={battle.hub} selectedMode={selectedMode} battle={battle} />
                <Arsenal hub={battle.hub} />
              </div>
              <CurrentExpeditions hub={battle.hub} onResume={(id) => arenaPresentation.setEncounter(id)} />
            </div>
          )}
        </main>

        {!arenaStage && (
          <footer className="flex shrink-0 items-center justify-between border-t border-white/[0.055] px-6 py-2 text-[6px] uppercase tracking-[0.11em] text-white/22">
            <span>Play → earn achievement cards → equip → enter a game world → fight</span>
            <span className="flex items-center gap-1.5"><Zap className="h-3 w-3" />PvP · Dungeons · Quests · World Bosses</span>
          </footer>
        )}
      </div>
    </div>
  );
}
