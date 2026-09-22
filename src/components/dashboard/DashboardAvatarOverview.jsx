import PartyPortraitRail from './PartyPortraitRail';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Heart, Zap, Trophy, Gamepad2, Star, Shield, ChevronRight, BarChart3, Gauge, Target, Sparkles, Users, MessageSquare, Crown, PackageOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DashboardAvatarScene from './DashboardAvatarScene';
import { useAuth } from '../auth/AuthContext';
import { useCompanionIdentity } from '@/components/onboarding/CompanionIdentityContext';
import { useQuery } from '@tanstack/react-query';
import InventoryGrid from './InventoryGrid';
import LunaSplitInventory from './LunaSplitInventory';
import LunaCardsPanel from './LunaCardsPanel';
import { itemFitsSlot, getEquipmentSlotLabel } from './equipmentSlotRules';
import { inventoryData } from '../profile/mockData';
import { useEquipment } from '../luna/hooks/useEquipment';
import { showError } from '@/components/error/ErrorToast';

const FALLBACK_GENRES = ['Action','RPG','Strategy','Adventure','Shooter','Sci-Fi','Horror','Sports','Racing','Simulation','Puzzle'];

function GlassSlot({ icon: Icon, label, active, alert = false, badge = 0, onClick, compact = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      data-dashboard-quick-control
      onClick={onClick}
      className={`relative flex-shrink-0 border backdrop-blur-2xl transition-all duration-200 hover:bg-white/[0.10] ${compact ? 'h-[42px] w-full rounded-lg' : 'h-[54px] w-[54px] rounded-xl hover:-translate-y-1'} ${active ? 'border-cyan-300/45 bg-cyan-300/[0.10]' : alert ? 'border-cyan-200/45 bg-cyan-300/[0.09] animate-pulse' : 'border-white/[0.16] bg-white/[0.055]'}`}
      style={{
        boxShadow: active
          ? 'inset 0 1px 0 rgba(255,255,255,0.18), 0 0 20px rgba(34,211,238,0.16), 0 6px 18px rgba(0,0,0,0.18)'
          : 'inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 18px rgba(0,0,0,0.16)'
      }}
    >
      <div className={`pointer-events-none absolute inset-0 border ${compact ? 'rounded-lg' : 'rounded-xl'} ${active ? 'border-cyan-200/[0.12]' : 'border-cyan-300/[0.04]'}`} />
      {Icon && <Icon className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${compact ? 'top-[7px] h-3.5 w-3.5' : 'top-[12px] h-4 w-4'} ${active || alert ? 'text-cyan-100' : 'text-white/55'}`} />}
      {badge > 0 && <span className={`pointer-events-none absolute grid place-items-center rounded-full bg-cyan-300 px-1 font-black text-slate-950 shadow-[0_0_14px_rgba(103,232,249,.35)] ${compact ? '-right-1 -top-1 min-h-[14px] min-w-[14px] text-[6px]' : '-right-1 -top-1 min-h-[16px] min-w-[16px] text-[7px]'}`}>{badge > 99 ? '99+' : badge}</span>}
      <span className={`pointer-events-none absolute left-0 right-0 text-center uppercase tracking-wider ${compact ? 'bottom-[4px] text-[5px]' : 'bottom-[5px] text-[6px]'} ${active || alert ? 'text-white/80' : 'text-white/45'}`}>{label}</span>
    </button>
  );
}

function StatRow({ icon, label, value, accent = 'text-cyan-300' }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 border-b border-white/[0.055] last:border-b-0 min-h-[20px]">
      <div className="flex items-center gap-2 min-w-0">
        <span className={accent}>{icon}</span>
        <span className="text-white/55 text-[9px] uppercase tracking-wider truncate">{label}</span>
      </div>
      <span className="text-white text-[10px] font-semibold tabular-nums whitespace-nowrap">{value}</span>
    </div>
  );
}

function ProgressBar({ value }) {
  return <div className="h-1 rounded-full bg-white/[0.07] overflow-hidden"><div className="h-full rounded-full bg-cyan-300/65" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

function GenreRows({ genres }) {
  const list = (genres?.length ? genres : FALLBACK_GENRES.map(name => ({ name, level: 1, current_xp: 0, xp_to_next_level: 100 }))).slice(0, 11);
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
      {list.map((g, i) => {
        const name = g.name || g.genre || FALLBACK_GENRES[i];
        const level = Number(g.level || 1);
        const xp = Number(g.current_xp ?? g.xp ?? 0);
        const next = Math.max(1, Number(g.xp_to_next_level ?? g.next_xp ?? 100));
        return (
          <div key={`${name}-${i}`}>
            <div className="flex justify-between mb-0.5"><span className="text-white/55 text-[7px] truncate">{name}</span><span className="text-cyan-300/80 text-[7px]">Lv {level}</span></div>
            <ProgressBar value={xp / next * 100} />
            <div className="text-right text-[6px] text-white/25">{xp.toLocaleString()} XP</div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardAvatarOverview() {
  const { user } = useAuth();
  const companion = useCompanionIdentity();
  const { equipItem, equippedItems } = useEquipment();
  const [progression, setProgression] = useState(null);
  const [inventoryMode, setInventoryMode] = useState(false);
  const [inventorySlot, setInventorySlot] = useState(null);
  const [cardsMode, setCardsMode] = useState(false);
  const [surface, setSurface] = useState('dashboard');
  const [attributeView, setAttributeView] = useState('overview');
  const [attributeMenuOpen, setAttributeMenuOpen] = useState(false);
  const [interactionDimmed, setInteractionDimmed] = useState(false);
  const [avatarFocusMode, setAvatarFocusMode] = useState(false);
  const [activeQuickPanel, setActiveQuickPanel] = useState(null);
  const lastInteractiveRef = useRef(null);

  useEffect(() => {
    const s = e => setSurface(e.detail?.mode || 'dashboard');
    const g = () => setSurface('game');
    const c = () => setSurface('dashboard');
    window.addEventListener('lunaDashboardOverlayState', s);
    window.addEventListener('dashboardGameLaunched', g);
    window.addEventListener('dashboardGameClosed', c);
    return () => {
      window.removeEventListener('lunaDashboardOverlayState', s);
      window.removeEventListener('dashboardGameLaunched', g);
      window.removeEventListener('dashboardGameClosed', c);
    };
  }, []);

  useEffect(() => {
    if (surface !== 'dashboard') {
      setActiveQuickPanel(null);
      setInventoryMode(false);
      setInventorySlot(null);
      setCardsMode(false);
    }
  }, [surface]);

  useEffect(() => {
    const onFocus = (event) => {
      const active = Boolean(event.detail?.active);
      setAvatarFocusMode(active);
      if (active) {
        setActiveQuickPanel(null);
        setInventoryMode(false);
        setInventorySlot(null);
        setCardsMode(false);
        setAttributeMenuOpen(false);
        setInteractionDimmed(false);
      }
    };
    window.addEventListener('lunaAvatarFocusChanged', onFocus);
    return () => window.removeEventListener('lunaAvatarFocusChanged', onFocus);
  }, []);

  // Any dashboard control outside the 3D viewer / attribute panel puts those
  // two background surfaces into the same subdued state used for game/library
  // transitions. The seven quick-dock controls are excluded because their own
  // glass workspace supplies the blur without changing the surrounding layout.
  useEffect(() => {
    const handlePointerDown = event => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('canvas') || target.closest('[aria-label="AI Attribute Box"]') || target.closest('[data-dashboard-quick-control]') || target.closest('[data-dashboard-utility-workspace]') || target.closest('[data-player-animation-controls]') || target.closest('[data-social-controls]')) return;

      const interactive = target.closest('button, a, [role="button"], input, select, textarea');
      if (!interactive) return;

      if (lastInteractiveRef.current === interactive) {
        setInteractionDimmed(prev => !prev);
      } else {
        lastInteractiveRef.current = interactive;
        setInteractionDimmed(true);
      }
    };

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        if (inventoryMode && inventorySlot) {
          setInventorySlot(null);
          setInteractionDimmed(false);
          lastInteractiveRef.current = null;
          return;
        }
        if (inventoryMode) {
          setInventoryMode(false);
          setInventorySlot(null);
        }
        if (cardsMode) setCardsMode(false);
        setActiveQuickPanel(null);
        setInteractionDimmed(false);
        lastInteractiveRef.current = null;
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [inventoryMode, inventorySlot, cardsMode]);

  useEffect(() => {
    const toggleInventory = () => {
      setActiveQuickPanel(null);
      setInteractionDimmed(false);
      setInventorySlot(null);
      setCardsMode(false);
      setInventoryMode((current) => !current);
    };

    window.addEventListener('openLunaInventoryWorkspace', toggleInventory);
    return () => window.removeEventListener('openLunaInventoryWorkspace', toggleInventory);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const items = await base44.entities.AvatarProgression.filter({ user_id: user.id });
        if (!cancelled) setProgression(items?.[0] || null);
      } catch (e) {
        console.error('Failed to load avatar progression:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const stats = useMemo(() => ({
    power: Number(progression?.power || 0),
    hp: Number(progression?.hp || 100),
    rank: user?.rank || 'Recruit',
    level: Number(progression?.global_level || user?.level || 1),
    gamerScore: Number(user?.gamer_score || 0),
    aiPoints: Number(user?.ai_achievement_points || 0),
    gamesPlayed: Number(user?.games_played || 0),
    currentXP: Number(progression?.current_xp || 0),
    nextXP: Math.max(1, Number(progression?.next_xp || progression?.xp_to_next_level || 1000)),
    availablePoints: Number(progression?.available_points || progression?.unspent_points || 0),
    strength: Number(progression?.strength || 10),
    intelligence: Number(progression?.intelligence || 10),
    willpower: Number(progression?.willpower || 10),
    tenacity: Number(progression?.tenacity || 10),
    defense: Number(progression?.defense || progression?.armor || 0),
    agility: Number(progression?.agility || 10),
    endurance: Number(progression?.endurance || 10),
    luck: Number(progression?.luck || 10)
  }), [progression, user]);

  const { data: socialInbox = {} } = useQuery({
    queryKey: ['luna-social-inbox-summary', user?.id],
    queryFn: async () => {
      const response = await base44.functions.invoke('socialActions', { action: 'get_inbox', data: {} });
      const body = response?.data ?? response ?? {};
      if (body?.error) throw new Error(body.error);
      return body;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    const openMessages = () => {
      setActiveQuickPanel('messages');
      setInteractionDimmed(false);
    };
    const clearForPresenceMenu = () => {
      setInteractionDimmed(false);
      lastInteractiveRef.current = null;
    };
    window.addEventListener('openLunaMessages', openMessages);
    window.addEventListener('lunaPresenceMenuOpened', clearForPresenceMenu);
    return () => {
      window.removeEventListener('openLunaMessages', openMessages);
      window.removeEventListener('lunaPresenceMenuOpened', clearForPresenceMenu);
    };
  }, []);

  const levelProgress = Math.min(100, stats.currentXP / stats.nextXP * 100);
  const backgroundDimmed = !avatarFocusMode && (interactionDimmed || surface !== 'dashboard');
  const slotItems = [
    { id: 'inventory', icon: PackageOpen, label: 'Inventory' },
    { id: 'friends', icon: Users, label: 'Friends', alert: Number(socialInbox.friend_unread || 0) > 0, badge: Number(socialInbox.friend_unread || 0) },
    { id: 'messages', icon: MessageSquare, label: 'Message', alert: Number(socialInbox.unread_total || 0) > 0, badge: Number(socialInbox.unread_total || 0) },
    { id: 'cards', icon: Trophy, label: 'Cards' },
    { id: 'ai-story', icon: Sparkles, label: 'AI Story' },
    { id: 'ai-battle', icon: Shield, label: 'AI Battle' },
    { id: 'season', icon: Crown, label: 'Season' }
  ];
  const handleInventorySlot = (slotId) => {
    setInventorySlot(slotId);
  };

  const handleInventoryEquip = (item) => {
    if (!inventorySlot || !item) return;
    if (!itemFitsSlot(item, inventorySlot)) {
      showError(`${item.name || 'That item'} cannot be equipped in ${getEquipmentSlotLabel(inventorySlot)}.`);
      return;
    }
    equipItem(inventorySlot, item);
    setInventorySlot(null);
  };

  const handleQuickAction = (item) => {
    if (item.id === 'inventory') {
      setActiveQuickPanel(null);
      setInteractionDimmed(false);
      setInventorySlot(null);
      setCardsMode(false);
      setInventoryMode((current) => !current);
      return;
    }
    if (item.id === 'cards') {
      setActiveQuickPanel(null);
      setInteractionDimmed(false);
      setInventoryMode(false);
      setInventorySlot(null);
      setCardsMode((current) => !current);
      return;
    }
    setInventoryMode(false);
    setInventorySlot(null);
    setCardsMode(false);
    setActiveQuickPanel(current => current === item.id ? null : item.id);
  };

  const embeddedUtilityMode = inventoryMode || cardsMode;

  const circleOptions = [
    { id: 'blank-1', label: 'View 1', icon: Activity },
    { id: 'blank-2', label: 'View 2', icon: Gauge },
    { id: 'blank-3', label: 'View 3', icon: BarChart3 },
    { id: 'blank-4', label: 'View 4', icon: Target },
    { id: 'blank-5', label: 'View 5', icon: Sparkles }
  ];

  return (
    <div
      data-dashboard-avatar-overview
      className="fixed right-0 top-[164px] bottom-[48px] z-[25] pointer-events-none overflow-visible transition-[left] duration-500 ease-out"
      style={{ left: embeddedUtilityMode ? '330px' : '390px' }}
    >
      {!avatarFocusMode && surface === 'dashboard' && !embeddedUtilityMode && activeQuickPanel && (
        <div
          aria-label={`${activeQuickPanel} workspace`}
          className="absolute left-[8px] right-[8px] top-[8px] bottom-[8px] z-[35] pointer-events-auto overflow-hidden transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(20,29,44,0.52) 0%, rgba(10,16,28,0.30) 48%, rgba(22,34,50,0.44) 100%)',
            backdropFilter: 'blur(28px) saturate(145%)',
            WebkitBackdropFilter: 'blur(28px) saturate(145%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 0 60px rgba(103,232,249,0.025), 0 30px 70px rgba(0,0,0,0.24)',
            clipPath: 'polygon(18px 0, calc(100% - 18px) 0, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0 calc(100% - 18px), 0 18px)'
          }}
        >
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_24%_12%,rgba(103,232,249,0.08),transparent_33%),radial-gradient(circle_at_82%_82%,rgba(129,140,248,0.055),transparent_34%)]" />
          <div className="absolute inset-[1px] pointer-events-none border border-white/[0.025]" style={{ clipPath: 'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)' }} />
        </div>
      )}

      <div
        className={`absolute top-[72px] bottom-0 pointer-events-auto transition-all duration-500 ${backgroundDimmed ? 'blur-[10px] opacity-25 scale-[0.995]' : 'blur-0 opacity-100 scale-100'}`}
        style={embeddedUtilityMode
          ? {
              left: 'auto',
              right: 'calc(338px + min(560px, calc(100% - 638px)))',
              width: '300px',
            }
          : { left: '0px', right: '0px', width: 'auto' }}
      >
        <DashboardAvatarScene focusMode={avatarFocusMode} />
      </div>

      {!avatarFocusMode && surface === 'dashboard' && embeddedUtilityMode && (
        <div
          data-dashboard-utility-workspace
          className="absolute right-[338px] top-[26px] bottom-0 z-40 w-[560px] pointer-events-auto overflow-hidden"
          style={{
            maxWidth: 'calc(100% - 638px)',
            background: cardsMode
              ? 'radial-gradient(ellipse at 52% 48%, rgba(40,58,80,.54) 0%, rgba(26,42,62,.40) 58%, rgba(18,31,48,.18) 82%, transparent 100%)'
              : 'radial-gradient(ellipse at 50% 48%, rgba(3,6,11,.92) 0%, rgba(4,8,14,.84) 56%, rgba(4,8,14,.52) 76%, rgba(4,8,14,.18) 90%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, black 74%, rgba(0,0,0,.82) 86%, transparent 100%)',
            maskImage: 'radial-gradient(ellipse at center, black 0%, black 74%, rgba(0,0,0,.82) 86%, transparent 100%)',
          }}
        >
          <div className="relative h-full min-h-0">
            <section
              className="absolute bottom-0 right-0 top-0 min-h-0 w-full max-w-[560px] overflow-hidden"
              style={{
                background: cardsMode
                  ? 'radial-gradient(ellipse at 58% 48%, rgba(48,68,94,.34) 0%, rgba(27,45,67,.24) 60%, rgba(16,29,46,.08) 84%, transparent 100%)'
                  : 'radial-gradient(ellipse at 58% 48%, rgba(3,6,11,.84) 0%, rgba(4,8,14,.64) 58%, rgba(4,8,14,.24) 82%, transparent 100%)',
              }}
            >
              {cardsMode ? (
                <LunaCardsPanel />
              ) : inventorySlot ? (
                <LunaSplitInventory
                  inventory={inventoryData}
                  selectedSlotId={inventorySlot}
                  onEquipItem={handleInventoryEquip}
                  onBackToLoadout={() => setInventorySlot(null)}
                  compactSlotMode
                />
              ) : (
                <InventoryGrid
                  equippedItems={equippedItems}
                  handleBoxClick={handleInventorySlot}
                  compact
                  selectedSlotId={null}
                />
              )}
            </section>
          </div>
        </div>
      )}

      {!avatarFocusMode && surface === 'dashboard' && !embeddedUtilityMode && <PartyPortraitRail />}
      {!avatarFocusMode && <aside
        className={`absolute right-[-1px] top-[26px] z-50 w-[338px] max-w-[30vw] h-[calc(100%-26px)] overflow-visible transition-all duration-500 ${backgroundDimmed ? 'blur-[10px] opacity-25 pointer-events-none translate-x-3' : 'blur-0 opacity-100'}`}
        aria-label="AI Attribute Box"
      >
        <div className="relative h-full w-full bg-transparent border-b border-white/[0.06] shadow-[0_20px_45px_rgba(0,0,0,0.10)]">
          <div className="relative flex h-full w-full flex-col bg-transparent backdrop-blur-[10px] overflow-hidden">
            <div className="relative shrink-0 px-5 pt-3 pb-2 border-b border-white/[0.12]">
              <div className="flex items-center gap-2 pr-7">
                <span className="w-2 h-2 rounded-full bg-cyan-300" />
                <div>
                  <div className="text-white/45 text-[8px] uppercase tracking-[0.2em]">AI Attribute Box</div>
                  <div className="flex items-center gap-2">
                    <div className="text-white font-bold text-base">{companion?.name || 'AI Avatar'}</div>

                  </div>
                </div>
              </div>
              <button onClick={() => setAttributeMenuOpen(v => !v)} className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-16 bg-transparent flex items-center justify-center text-white/50 z-30">
                <ChevronRight className={`w-4 h-4 ${attributeMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {attributeMenuOpen && <div className="absolute right-[-54px] top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">{circleOptions.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setAttributeView(id)} aria-label={label} className="w-10 h-10 rounded-full border border-white/[0.18] bg-white/[0.08] backdrop-blur-xl flex items-center justify-center text-white/55"><Icon className="w-4 h-4" /></button>)}</div>}
            </div>

            <div className="relative min-h-0 flex-1 px-5 py-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {attributeView === 'overview' && <>
                <StatRow icon={<Zap className="w-3 h-3" />} label="Power" value={stats.power} />
                <StatRow icon={<Heart className="w-3 h-3" />} label="HP" value={stats.hp} />
                <StatRow icon={<Shield className="w-3 h-3" />} label="Rank" value={stats.rank} />
                <StatRow icon={<Star className="w-3 h-3" />} label="Global Level" value={stats.level} />
                <StatRow icon={<BarChart3 className="w-3 h-3" />} label="Global XP" value={`${stats.currentXP.toLocaleString()} / ${stats.nextXP.toLocaleString()}`} />
                <StatRow icon={<Trophy className="w-3 h-3" />} label="Gamer Score" value={stats.gamerScore.toLocaleString()} />
                <StatRow icon={<Zap className="w-3 h-3" />} label="AI Points" value={stats.aiPoints.toLocaleString()} />
                <StatRow icon={<Gamepad2 className="w-3 h-3" />} label="Games Played" value={stats.gamesPlayed} />
                <StatRow icon={<Target className="w-3 h-3" />} label="Available Points" value={stats.availablePoints} />
                <StatRow icon={<Shield className="w-3 h-3" />} label="Defense" value={stats.defense} />
                <StatRow icon={<Activity className="w-3 h-3" />} label="Agility" value={stats.agility} />
                <StatRow icon={<Heart className="w-3 h-3" />} label="Endurance" value={stats.endurance} />
                <StatRow icon={<Star className="w-3 h-3" />} label="Luck" value={stats.luck} />
              </>}

              {attributeView.startsWith('blank-') && <div className="min-h-[300px]" />}

              <div className="mt-1 pt-1 border-t border-white/[0.08]">
                <div className="flex justify-between mb-1"><span className="text-white/40 text-[7px] uppercase">Overall Level Progress</span><span className="text-cyan-300/80 text-[7px]">{Math.round(levelProgress)}%</span></div>
                <ProgressBar value={levelProgress} />
              </div>

              <div className="mt-1 pt-1 border-t border-white/[0.08]">
                <div className="flex justify-between mb-1"><span className="text-white/60 text-[7px] uppercase">Top Genres / Current Levels</span><span className="text-white/30 text-[6px]">XP / Level</span></div>
                <GenreRows genres={progression?.genres} />
              </div>

              <div className="mt-1 pt-1 border-t border-white/[0.08] grid grid-cols-2 gap-1">
                {[['Strength', stats.strength], ['Intelligence', stats.intelligence], ['Willpower', stats.willpower], ['Tenacity', stats.tenacity]].map(([label, value]) => (
                  <div key={label} className="border border-white/[0.07] bg-transparent px-2 py-1"><div className="text-white/35 text-[7px] uppercase">{label}</div><div className="text-white text-[10px] font-semibold">{value}</div></div>
                ))}
              </div>
            </div>

            {surface === 'dashboard' && (
              <div
                className="relative z-50 shrink-0 border-t border-white/[0.10] px-3 py-2 pointer-events-auto"
                data-dashboard-attribute-actions
              >
                <div className="grid grid-cols-4 gap-1.5">
                  {slotItems.map(item => (
                    <GlassSlot
                      key={item.id}
                      icon={item.icon}
                      label={item.label}
                      active={item.id === 'inventory' ? inventoryMode : item.id === 'cards' ? cardsMode : activeQuickPanel === item.id}
                      alert={item.alert}
                      badge={item.badge}
                      compact
                      onClick={() => handleQuickAction(item)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>}
    </div>
  );
}