import PartyPortraitRail from './PartyPortraitRail';
import DashboardWindow, { focusDashboardWindow } from './windows/DashboardWindow';
import RecordsWorkspace from '@/components/records/RecordsWorkspace';
import { useRecordsCapture, stopRecording } from '@/components/records/recordsCapture';
import AIStoryOverlay from './AIStoryOverlay';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Heart, Zap, Trophy, Gamepad2, Star, Shield, ChevronRight, BarChart3, Gauge, Target, Sparkles, Users, UserPlus, MessageSquare, Crown, PackageOpen, Medal, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DashboardAvatarScene from './DashboardAvatarScene';
import { useAuth } from '../auth/AuthContext';
import { useCompanionIdentity } from '@/components/onboarding/CompanionIdentityContext';
import { useQuery } from '@tanstack/react-query';
import InventoryGrid from './InventoryGrid';
import LunaSplitInventory from './LunaSplitInventory';
import LunaCardsPanel from './LunaCardsPanel';
import useDashboardSkillLayout from './useDashboardSkillLayout';
import LunaLeaderboardOverlay from './LunaLeaderboardOverlay';
import LunaAIBattleOverlay from './LunaAIBattleOverlay';
import { useAIBattleSnapshot } from '@/components/battle/useAIBattleQueue';
import LunaFriendsQuickAccessPanel from './LunaFriendsQuickAccessPanel';
import LunaSeasonPassOverlay from './LunaSeasonPassOverlay';
import LunaSkillXpHud from './LunaSkillXpHud';
import LunaOrnateChrome from './LunaOrnateChrome';
import './luna-ornate-attributes.css';
import './luna-silver-attribute.css';
import LunaMessageFriendsPanel from './LunaMessageFriendsPanel';
import MessengerHub from '@/components/friends/MessengerHub';
import { itemFitsSlot, getEquipmentSlotLabel } from './equipmentSlotRules';
import { inventoryData } from '../profile/mockData';
import { useEquipment } from '../luna/hooks/useEquipment';
import { showError } from '@/components/error/ErrorToast';
import useAvatarCombatStats from '@/components/avatar/useAvatarCombatStats';
import AIBoxSocialPanel from './AIBoxSocialPanel';
import LunaGamerProfile from './LunaGamerProfile';
import { setAIBoxSocialMode } from './aiBoxSocialMode';

const FALLBACK_GENRES = ['Action','RPG','Strategy','Adventure','Shooter','Sci-Fi','Horror','Sports','Racing','Simulation','Puzzle'];

function GlassSlot({ icon: Icon, label, active, alert = false, badge = 0, onClick, compact = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      data-dashboard-quick-control
      onClick={onClick}
      className={`axe-ornate-action relative flex-shrink-0 border backdrop-blur-2xl transition-all duration-200 hover:bg-white/[0.10] ${compact ? 'h-[42px] w-full rounded-lg' : 'h-[54px] w-[54px] rounded-xl hover:-translate-y-1'} ${active ? 'border-cyan-300/45 bg-cyan-300/[0.10]' : alert ? 'border-cyan-200/45 bg-cyan-300/[0.09] animate-pulse' : 'border-white/[0.16] bg-white/[0.055]'}`}
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
    <div className="axe-stat-row flex items-center justify-between gap-3 py-1 border-b border-white/[0.055] last:border-b-0 min-h-[20px]">
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
  const recordsCapture = useRecordsCapture();
  useEffect(() => {
    if (recordsCapture.active && recordsCapture.record?.user_id !== user?.id) stopRecording();
  }, [user?.id, recordsCapture.active, recordsCapture.record?.user_id]);
  const { equipItem, equippedItems } = useEquipment();
  const {state:combatState}=useAvatarCombatStats();
  const progression=combatState?.progression;
  const [inventoryMode, setInventoryMode] = useState(false);
  const [inventorySlot, setInventorySlot] = useState(null);
  const [cardsMode, setCardsMode] = useState(false);
  const [cardsMinimized, setCardsMinimized] = useState(false);
  const [memoriesMode, setMemoriesMode] = useState(false);
  const [skillBookDock, setSkillBookDock] = useState(null);
  const [leaderboardMode, setLeaderboardMode] = useState(false);
  const [messagesMode, setMessagesMode] = useState(false);
  const [friendsMode, setFriendsMode] = useState(false);
  const [seasonMode, setSeasonMode] = useState(false);
  const [battleMode, setBattleMode] = useState(false);
  const [surface, setSurface] = useState('dashboard');
  const [attributeView, setAttributeView] = useState('overview');
  const [attributeMenuOpen, setAttributeMenuOpen] = useState(false);
  const [, setInteractionDimmed] = useState(false);
  const [avatarFocusMode, setAvatarFocusMode] = useState(false);
  const [activeQuickPanel, setActiveQuickPanel] = useState(null);
  const lastInteractiveRef = useRef(null);
  const [socialDirectoryMode, setSocialDirectoryMode] = useState(null);
  const [profileTarget, setProfileTarget] = useState(null);
  // Keep the AI Attribute panel unchanged: social modes now live in windows.
  const socialModeActive = false;

  useEffect(() => {
    setAIBoxSocialMode(null);
    const openDirectory = event => {
      const requested = String(event?.detail?.mode || 'friends');
      const mode = ['online','friends','party'].includes(requested) ? requested : 'friends';
      setSocialDirectoryMode(mode);
      focusDashboardWindow('social-directory');
    };
    const openProfile = event => {
      const player = event.detail?.player || event.detail;
      if (!player?.id && !player?.friend_id) return;
      setProfileTarget(player);
      focusDashboardWindow('gamer-profile');
    };
    window.addEventListener('openLunaSocialWindow', openDirectory);
    window.addEventListener('openLunaGamerProfile', openProfile);
    return () => {
      window.removeEventListener('openLunaSocialWindow', openDirectory);
      window.removeEventListener('openLunaGamerProfile', openProfile);
    };
  }, []);

  // Observe the always-mounted AI Battle query cache without starting another
  // poller. The parent dashboard owns the popup, so it also owns the final
  // matchmaking -> arena handoff and cannot be blocked by stale popup state.
  const { match: battleTransitionMatch } = useAIBattleSnapshot();
  const battleTransitionStatus = String(battleTransitionMatch?.status || '');

  useEffect(() => {
    if (!battleMode || !battleTransitionMatch?.id) return;
    // A reserved `matched` pair is not enough to leave the queue UI. Wait until
    // both clients have acknowledged the same reservation and the server unlocks
    // the shared arena as `connecting`.
    if (!['connecting', 'countdown', 'fighting'].includes(battleTransitionStatus)) return;
    setBattleMode(false);
    setActiveQuickPanel(null);
    setInteractionDimmed(false);
    window.dispatchEvent(new CustomEvent('lunaAIBattleStageEntered', {
      detail: { matchId: battleTransitionMatch.id, mode: battleTransitionMatch.mode || 'pvp' },
    }));
  }, [battleMode, battleTransitionMatch?.id, battleTransitionMatch?.mode, battleTransitionStatus]);

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
      setLeaderboardMode(false);
      setMessagesMode(false);
      setFriendsMode(false);
      setSeasonMode(false);
      setBattleMode(false);
      setAIBoxSocialMode(null);
      setSocialDirectoryMode(null);
      setProfileTarget(null);
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
        setLeaderboardMode(false);
        setMessagesMode(false);
        setFriendsMode(false);
        setSeasonMode(false);
        setBattleMode(false);
        setAttributeMenuOpen(false);
        setAIBoxSocialMode(null);
        setSocialDirectoryMode(null);
        setProfileTarget(null);
        setInteractionDimmed(false);
      }
    };
    window.addEventListener('lunaAvatarFocusChanged', onFocus);
    return () => window.removeEventListener('lunaAvatarFocusChanged', onFocus);
  }, []);

  useEffect(() => {
    const openInventory = () => { setInventoryMode(true); focusDashboardWindow('inventory'); };
    const openMemories = () => { setMemoriesMode(true); focusDashboardWindow('records'); };
    const openFriends = () => { setFriendsMode(true); focusDashboardWindow('friends'); };
    window.addEventListener('openLunaInventoryWorkspace', openInventory);
    window.addEventListener('openLunaMemories', openMemories);
    window.addEventListener('openLunaRecords', openMemories);
    window.addEventListener('openLunaFriends', openFriends);
    return () => {
      window.removeEventListener('openLunaInventoryWorkspace', openInventory);
      window.removeEventListener('openLunaMemories', openMemories);
      window.removeEventListener('openLunaRecords', openMemories);
      window.removeEventListener('openLunaFriends', openFriends);
    };
  }, []);

  const stats=useMemo(()=>{
    const core=combatState?.combat,a=combatState?.allocations||{};
    const level=core?.level||1;
    return {
      power:core?.attack??'—',hp:core?.max_hp??'—',maxHp:core?.max_hp??1000,rank:user?.rank||'Recruit',level,
      gamerScore:Number(user?.gamer_score||0),aiPoints:Number(user?.ai_achievement_points||0),gamesPlayed:Number(user?.games_played||0),
      currentXP:Math.max(0,Number(progression?.global_xp||0)-(level-1)*1000),nextXP:1000,availablePoints:combatState?.available??'—',
      strength:a.strength??'—',intelligence:a.intelligence??'—',wisdom:a.wisdom??'—',vitality:a.vitality??'—',defense:core?.defense??'—',
      dodge:core?`${(core.dodge_chance*100).toFixed(1)}%`:'—',attackSpeed:core?`${core.attack_speed.toFixed(3)}×`:'—',
      cooldown:core?`${(core.cooldown_reduction*100).toFixed(1)}%`:'—',
    };
  },[combatState,progression,user]);

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
    if (sessionStorage.getItem('luna_open_ai_battle') !== '1') return;
    sessionStorage.removeItem('luna_open_ai_battle');
    setBattleMode(true);
  }, []);

  useEffect(() => {
    const openBattle = (event) => {
      const requestedMode = event?.detail?.mode;
      if (requestedMode) window.__lunaAIBattlePreferredMode = requestedMode;
      setBattleMode(true);
      focusDashboardWindow('ai-battle');
    };
    window.addEventListener('openAIBattle', openBattle);
    return () => window.removeEventListener('openAIBattle', openBattle);
  }, []);

  useEffect(() => {
    const openMessages = (event) => {
      const target = event?.detail?.target || event?.detail;
      if (target?.friend_id || target?.player_id || target?.id || target?.partner_id) {
        window.__lunaPendingMessageTarget = target;
      }
      setMessagesMode(true);
      focusDashboardWindow('messages');
    };
    const clearForPresenceMenu = () => {
      setInteractionDimmed(false);
      lastInteractiveRef.current = null;
    };
    window.addEventListener('openLunaMessages', openMessages);
    if (window.__lunaPendingMessageTarget) openMessages({ detail: { target: window.__lunaPendingMessageTarget } });
    window.addEventListener('lunaPresenceMenuOpened', clearForPresenceMenu);
    return () => {
      window.removeEventListener('openLunaMessages', openMessages);
      window.removeEventListener('lunaPresenceMenuOpened', clearForPresenceMenu);
    };
  }, []);

  const backgroundDimmed = !avatarFocusMode && surface !== 'dashboard';
  const slotItems = [
    { id: 'inventory', icon: PackageOpen, label: 'Inventory' },
    { id: 'records', icon: Gamepad2, label: 'Records', alert: recordsCapture.active },
    { id: 'messages', icon: MessageSquare, label: 'Message', alert: Number(socialInbox.unread_total || 0) > 0, badge: Number(socialInbox.unread_total || 0) },
    { id: 'cards', icon: Trophy, label: 'Cards' },
    { id: 'ai-story', icon: Sparkles, label: 'AI Story' },
    { id: 'ai-battle', icon: Shield, label: 'AI Battle' },
    { id: 'season', icon: Crown, label: 'Season' },
    { id: 'leaderboard', icon: Medal, label: 'Leaderboard' }
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
    const setters = {
      inventory: setInventoryMode, cards: setCardsMode, leaderboard: setLeaderboardMode,
      messages: setMessagesMode, records: setMemoriesMode, season: setSeasonMode,
      'ai-battle': setBattleMode,
    };
    if (setters[item.id]) setters[item.id](true);
    else setActiveQuickPanel(item.id);
    focusDashboardWindow(item.id);
  };

  const skillLayout = useDashboardSkillLayout({ active: !avatarFocusMode && surface === 'dashboard', bookOpen: cardsMode && !cardsMinimized });

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
      style={{ left: '390px' }}
    >
      <div
        className={`absolute top-[26px] bottom-0 pointer-events-auto transition-all duration-500 ${backgroundDimmed ? 'blur-[10px] opacity-25 scale-[0.995]' : 'blur-0 opacity-100 scale-100'}`}
        style={{ left: '0px', right: 'min(338px, 30vw)', width: 'auto' }}>
        <DashboardAvatarScene focusMode={avatarFocusMode} />
      </div>

      {!avatarFocusMode && surface === 'dashboard' && <>
        <PartyPortraitRail />
        <LunaSkillXpHud dockStyle={skillLayout.hud} stacked={skillLayout.stacked}
          currentXp={stats.currentXP} nextXp={stats.nextXP} level={stats.level}
          showcaseEditing={cardsMode && !cardsMinimized} embedded={cardsMode && !cardsMinimized}
          dockTarget={skillBookDock} combatMode={false} />

        {inventoryMode && <DashboardWindow id="inventory" title="Inventory" width={640} height={600} onClose={() => setInventoryMode(false)}>
          <div className="luna-window__inventory">
            {inventorySlot ? <LunaSplitInventory inventory={inventoryData} selectedSlotId={inventorySlot}
              onEquipItem={handleInventoryEquip} onBackToLoadout={() => setInventorySlot(null)} compactSlotMode /> :
              <InventoryGrid equippedItems={equippedItems} handleBoxClick={handleInventorySlot} compact selectedSlotId={null} />}
          </div>
        </DashboardWindow>}
        {cardsMode && <DashboardWindow id="cards" title="Cards · Skill Book" width={850} height={680} index={1}
          onMinimizedChange={setCardsMinimized} onClose={() => { setCardsMode(false); setCardsMinimized(false); }}>
          <LunaCardsPanel onClose={() => setCardsMode(false)} slotDockRef={setSkillBookDock} />
        </DashboardWindow>}
        {friendsMode && <DashboardWindow id="friends" title="Friends" width={440} height={580} index={2} onClose={() => setFriendsMode(false)}>
          <LunaFriendsQuickAccessPanel />
        </DashboardWindow>}
        {socialDirectoryMode && <DashboardWindow id="social-directory" title={socialDirectoryMode === 'online' ? 'People Online' : socialDirectoryMode === 'party' ? 'Invite Friends to Party' : 'Friends Online'}
          width={420} height={590} anchor="ai-attributes" onClose={() => setSocialDirectoryMode(null)}>
          <div className="h-full min-h-0 overflow-auto bg-[linear-gradient(155deg,#1d3a54,#0a1727)] p-3">
            <AIBoxSocialPanel key={socialDirectoryMode} mode={socialDirectoryMode} />
          </div>
        </DashboardWindow>}
        {profileTarget && <DashboardWindow id="gamer-profile" title="Gamer Profile" width={1040} height={720} index={2}
          onClose={() => setProfileTarget(null)}>
          <LunaGamerProfile key={String(profileTarget.id || profileTarget.friend_id)} player={profileTarget} onClose={() => setProfileTarget(null)} />
        </DashboardWindow>}
        {messagesMode && <DashboardWindow id="messages" title="Messages" width={820} height={580} index={3} onClose={() => setMessagesMode(false)}>
          <div className="luna-window__messages"><LunaMessageFriendsPanel /><section><MessengerHub threadOnly /></section></div>
        </DashboardWindow>}
        {memoriesMode && <DashboardWindow id="records" title="Records" width={980} height={700} index={4} onClose={() => setMemoriesMode(false)}>
          <RecordsWorkspace />
        </DashboardWindow>}
        {activeQuickPanel === 'ai-story' && <DashboardWindow id="ai-story" title="AI Story" width={850} height={620} index={5} onClose={() => setActiveQuickPanel(null)}>
          <div className="luna-window__story"><AIStoryOverlay onClose={() => setActiveQuickPanel(null)} /></div>
        </DashboardWindow>}
        {seasonMode && <DashboardWindow id="season" title="Season Pass" width={960} height={660} index={6} onClose={() => setSeasonMode(false)}>
          <LunaSeasonPassOverlay embedded onClose={() => setSeasonMode(false)} />
        </DashboardWindow>}
        {battleMode && <DashboardWindow id="ai-battle" title="AI Battle" width={560} height={550} index={7} onClose={() => setBattleMode(false)}>
          <LunaAIBattleOverlay embedded onClose={() => setBattleMode(false)} />
        </DashboardWindow>}
        {leaderboardMode && <DashboardWindow id="leaderboard" title="Leaderboard" width={900} height={620} index={8} onClose={() => setLeaderboardMode(false)}>
          <LunaLeaderboardOverlay embedded onClose={() => setLeaderboardMode(false)} />
        </DashboardWindow>}
      </>}

      {!avatarFocusMode && <aside
        className={`absolute right-[-1px] top-[26px] z-50 w-[338px] max-w-[30vw] h-[calc(100%-26px)] overflow-visible transition-all duration-500 ${backgroundDimmed ? 'blur-[10px] opacity-25 pointer-events-none translate-x-3' : 'blur-0 opacity-100'}`}
        aria-label="AI Attribute Box"
      >
        <div className="axe-attribute-shell relative h-full w-full bg-transparent border-b border-white/[0.06] shadow-[0_20px_45px_rgba(0,0,0,0.10)]">
          <LunaOrnateChrome variant="silver" />
          <div className="axe-attribute-content relative flex h-full w-full flex-col bg-transparent backdrop-blur-[10px] overflow-hidden">
            <div className="axe-attribute-heading relative shrink-0 px-5 pt-3 pb-2 border-b border-white/[0.12]">
              <div className="flex items-center gap-2 pr-9">
                <span className="w-2 h-2 rounded-full bg-cyan-300" />
                <div className="min-w-0 flex-1">
                  <div data-axe-panel-label className="text-white/45 text-[8px] uppercase tracking-[0.2em]">{'AI Attribute Box'}</div>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="truncate text-white font-bold text-base">
                      {companion?.name || 'AI Avatar'}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5" aria-label="AI Attribute social modes">
                      {[
                        { id: 'online', label: 'People Online', icon: UserPlus },
                        { id: 'friends', label: 'Friends Online', icon: Users },
                      ].map(({ id, label, icon: Icon }) => {
                        const active = socialDirectoryMode === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => { setSocialDirectoryMode(id); focusDashboardWindow('social-directory'); }}
                            title={label}
                            aria-label={label}
                            aria-pressed={active}
                            className={`grid h-6 w-6 place-items-center rounded-full border transition-all ${active
                              ? 'border-cyan-200/40 bg-cyan-200/[0.12] text-cyan-100 shadow-[0_0_12px_rgba(103,232,249,.12)]'
                              : 'border-white/[0.10] bg-white/[0.035] text-white/40 hover:border-white/[0.18] hover:bg-white/[0.07] hover:text-white/70'}`}
                          >
                            <Icon className="h-3 w-3" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {socialModeActive ? (
                <button
                  type="button"
                  onClick={() => { setAIBoxSocialMode(null); setAttributeView('overview'); }}
                  aria-label="Close social view"
                  className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-white/[0.10] bg-white/[0.035] text-white/45 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <>
                  <button onClick={() => setAttributeMenuOpen(v => !v)} className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-16 bg-transparent flex items-center justify-center text-white/50 z-30">
                    <ChevronRight className={`w-4 h-4 ${attributeMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {attributeMenuOpen && <div className="absolute right-[-54px] top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">{circleOptions.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setAttributeView(id)} aria-label={label} className="w-10 h-10 rounded-full border border-white/[0.18] bg-white/[0.08] backdrop-blur-xl flex items-center justify-center text-white/55"><Icon className="w-4 h-4" /></button>)}</div>}
                </>
              )}
            </div>

            <div
              className={`axe-attribute-body relative min-h-0 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent ${socialModeActive ? 'px-3 py-2' : 'px-5 py-1'}`}
              style={socialModeActive ? {
                background: 'linear-gradient(145deg, rgba(5,12,22,.48), rgba(2,7,14,.26))',
                backdropFilter: 'blur(20px) saturate(125%)',
                WebkitBackdropFilter: 'blur(20px) saturate(125%)',
              } : undefined}
            >
              {socialModeActive ? (
                <AIBoxSocialPanel mode={aiBoxSocialMode} />
              ) : (
                <>
                  {attributeView === 'overview' && <>
                    <StatRow icon={<Zap className="w-3 h-3" />} label="Power" value={stats.power} />
                    <StatRow icon={<Heart className="w-3 h-3" />} label="HP" value={stats.hp} />
                    <StatRow icon={<Shield className="w-3 h-3" />} label="Rank" value={stats.rank} />
                    <StatRow icon={<Star className="w-3 h-3" />} label="Avatar Level" value={stats.level} />
                    <StatRow icon={<BarChart3 className="w-3 h-3" />} label="Avatar XP" value={`${stats.currentXP.toLocaleString()} / ${stats.nextXP.toLocaleString()}`} />
                    <StatRow icon={<Trophy className="w-3 h-3" />} label="Gamer Score" value={stats.gamerScore.toLocaleString()} />
                    <StatRow icon={<Zap className="w-3 h-3" />} label="AI Points" value={stats.aiPoints.toLocaleString()} />
                    <StatRow icon={<Gamepad2 className="w-3 h-3" />} label="Games Played" value={stats.gamesPlayed} />
                    <StatRow icon={<Target className="w-3 h-3" />} label="Available Points" value={stats.availablePoints} />
                    <StatRow icon={<Shield className="w-3 h-3" />} label="Defense" value={stats.defense} />
                    <StatRow icon={<Activity className="w-3 h-3" />} label="Dodge" value={stats.dodge} />
                    <StatRow icon={<Heart className="w-3 h-3" />} label="Attack Speed" value={stats.attackSpeed} />
                    <StatRow icon={<Star className="w-3 h-3" />} label="Cooldown Reduction" value={stats.cooldown} />
                  </>}

                  {attributeView.startsWith('blank-') && <div className="min-h-[300px]" />}

                  <div className="axe-genre-block mt-1 pt-1 border-t border-white/[0.08]">
                    <div className="flex justify-between mb-1"><span className="axe-genre-heading text-white/60 text-[7px] uppercase">Top Genres / Current Levels</span><span className="text-white/30 text-[6px]">XP / Level</span></div>
                    <GenreRows genres={progression?.genres} />
                  </div>

                  <div className="axe-stat-points mt-1 pt-1 border-t border-white/[0.08] grid grid-cols-2 gap-1">
                    {[['Strength', stats.strength], ['Intelligence', stats.intelligence], ['Wisdom', stats.wisdom], ['Vitality', stats.vitality]].map(([label, value]) => (
                      <div key={label} className="border border-white/[0.07] bg-transparent px-2 py-1"><div className="text-white/35 text-[7px] uppercase">{label}</div><div className="text-white text-[10px] font-semibold">{value}</div></div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {surface === 'dashboard' && !socialModeActive && (
              <div
                className="axe-attribute-actions relative z-50 shrink-0 border-t border-white/[0.10] px-3 py-2 pointer-events-auto"
                data-dashboard-attribute-actions
              >
                <div className="grid grid-cols-4 gap-1.5">
                  {slotItems.map(item => (
                    <GlassSlot
                      key={item.id}
                      icon={item.icon}
                      label={item.label}
                      active={item.id === 'records' ? memoriesMode : item.id === 'inventory' ? inventoryMode : item.id === 'cards' ? cardsMode : item.id === 'messages' ? messagesMode : item.id === 'season' ? seasonMode : item.id === 'ai-battle' ? battleMode : item.id === 'leaderboard' ? leaderboardMode : activeQuickPanel === item.id}
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