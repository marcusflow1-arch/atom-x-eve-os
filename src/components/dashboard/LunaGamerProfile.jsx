import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, ChevronDown, Flag, Gamepad2, Heart, Layers3, LayoutDashboard,
  LogIn, MessageSquare, Mic, Play, RefreshCw, Repeat2, Shield, Trophy,
  UserMinus, UserPlus, Users, Volume2,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { joinDashboard, openPlayerMessage } from '@/components/social/dashboardSession';
import { sendTradeRequest } from '@/components/game3d/social/tradeRequest';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import GenesisModelPreview from '@/components/onboarding/GenesisModelPreview';
import { GAME_SHELF_COLUMNS, gameArtifacts, gameMedia, nextGameIndex } from './gameProfileSelectors.mjs';
import './gamer-profile.css';

const unwrap = result => {
  const body = result?.data ?? result ?? {};
  if (body.error || body.success === false) throw new Error(body.error || 'Action unsuccessful');
  return body;
};
export const asSocialTarget = player => ({
  id: String(player?.friend_id || player?.player_id || player?.id || ''),
  name: player?.friend_name || player?.name || player?.display_name || 'Player',
  avatar: player?.friend_avatar || player?.avatar_url || (typeof player?.avatar === 'string' ? player.avatar : '') || '',
  is_friend: Boolean(player?.friend || player?.is_friend),
  status: player?.status || 'offline',
});
const fmtDate = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

function GameMontage({ game }) {
  const media = useMemo(() => gameMedia(game), [game]);
  const [frame, setFrame] = useState(0);
  useEffect(() => { setFrame(0); }, [game?.id]);
  useEffect(() => {
    if (media.video || media.stills.length < 2) return undefined;
    const timer = setInterval(() => setFrame(index => (index + 1) % media.stills.length), 4600);
    return () => clearInterval(timer);
  }, [game?.id, media.video, media.stills.length]);
  return <div className="gamer-montage" aria-label={game ? `${game.title} preview` : 'Select a game to preview'}>
    {game ? <>
      {media.video
        ? <video key={media.video} src={media.video} poster={media.stills[0]} autoPlay muted loop playsInline preload="metadata" aria-label={game.title + ' trailer'} />
        : media.stills.length
          ? <img src={media.stills[frame % media.stills.length]} alt={game.title + ' screenshot'} />
          : <div className="gamer-montage-placeholder"><Gamepad2 size={54} /><span>No gameplay media shared yet</span></div>}
      <div className="gamer-montage-shade" />
      <div className="gamer-montage-bottom">
        <small>{game.played ? 'PLAYED' : game.in_library ? 'IN LIBRARY · NOT PLAYED' : 'NOT PLAYED'}</small>
        <h3>{game.title}</h3>
        <p>{game.description || game.genre || 'Game showcase'}</p>
        {!media.video && media.stills.length > 1 && <div className="gamer-montage-dots" aria-label="Preview frames">
          {media.stills.map((_, index) => <i key={index} className={index === frame ? 'active' : ''} />)}
        </div>}
      </div>
    </> : <div className="gamer-montage-placeholder"><Gamepad2 size={54} /><span>Select a title from the game shelf below</span></div>}
  </div>;
}

function UnlocksForGame({ game, profile }) {
  const { achievements, cards } = gameArtifacts(profile, game);
  return <div className="gamer-unlocks">
    <div className="gamer-unlocks-heading">
      <div><span className="gamer-eyebrow">THIS GAME'S REWARDS</span><h3>Achievement cards</h3></div>
      <small>{achievements.length} achievements · {cards.length} cards</small>
    </div>
    <div className="gamer-unlocks-scroll">
      {cards.length ? <div className="gamer-reward-grid">
        {cards.slice(0, 8).map(card => <article key={card.id} className="gamer-reward" title={card.name}>
          <div className="gamer-reward-art">{card.image ? <img src={card.image} alt="" loading="lazy" /> : <Layers3 size={24} />}</div>
          <div className="gamer-reward-copy"><strong>{card.name}</strong><span>{card.rarity || 'Card'}{card.equipped ? ' · Equipped' : ''}</span></div>
        </article>)}
      </div> : <p className="gamer-reward-empty">{game?.played ? 'No cards earned from this game yet.' : 'Cards will appear here once earned.'}</p>}
      {cards.length > 8 && <p className="gamer-reward-count">+ {cards.length - 8} more cards in the collection</p>}
      {achievements.length > 0 && <div className="gamer-achievement-list">
        <div className="gamer-achievement-label"><Trophy size={13} /> Achievements unlocked</div>
        {achievements.slice(0, 5).map(item => <div key={item.id} className="gamer-achievement-row">
          {item.icon ? <img src={item.icon} alt="" loading="lazy" /> : <Trophy size={13} />}
          <span>{item.title}</span><small>{Number(item.points) || 0} pts</small>
        </div>)}
        {achievements.length > 5 && <small className="gamer-reward-count">+ {achievements.length - 5} additional achievements</small>}
      </div>}
    </div>
  </div>;
}

export default function LunaGamerProfile({ player, onClose, initialTab = 'overview' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const p = asSocialTarget(player);
  const self = p.id === String(user?.id);
  const [selectedId, setSelectedId] = useState('');
  const [menu, setMenu] = useState(null);
  const [busy, setBusy] = useState('');
  const [friend, setFriend] = useState(p.is_friend);
  const [following, setFollowing] = useState(false);
  const [more, setMore] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('harassment');
  const [details, setDetails] = useState('');
  const [requested, setRequested] = useState(false);
  const galleryRef = useRef(null);

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ['friend-console-profile', user?.id, p.id],
    enabled: Boolean(user?.id && p.id),
    retry: false,
    staleTime: 30000,
    queryFn: async () => unwrap(await base44.functions.invoke('friendConsoleProfile', { target_user_id: p.id })).profile,
  });
  const name = profile?.name || p.name;
  const games = profile?.games || [];
  const selectedIndex = Math.max(0, games.findIndex(game => game.id === selectedId));
  const selectedGame = games[selectedIndex] || null;
  const playedCount = profile?.counts?.games || 0;

  useEffect(() => { setSelectedId(''); setMenu(null); }, [p.id]);
  useEffect(() => {
    if (!user?.id || !p.id || self) return undefined;
    let active = true;
    Promise.all([
      base44.entities.Follow.filter({ follower_id: user.id, followed_id: p.id }),
      base44.entities.Friend.filter({ user_id: user.id, friend_id: p.id }),
    ]).then(([follows, friends]) => {
      if (active) { setFollowing(Boolean(follows?.length)); setFriend(Boolean(friends?.length)); }
    }).catch(() => {});
    return () => { active = false; };
  }, [p.id, user?.id, self]);
  useEffect(() => {
    const refresh = () => refetch();
    window.addEventListener('lunaSocialChanged', refresh);
    return () => window.removeEventListener('lunaSocialChanged', refresh);
  }, [refetch]);

  const act = async (label, task, success) => {
    if (busy || !p.id || !user?.id) return;
    setBusy(label);
    setMenu(null);
    try { await task(); if (success) showSuccess(success); }
    catch (e) { showError(e, label); }
    finally { setBusy(''); }
  };
  const toLuna = () => { if (!/LunaTemplate/i.test(location.pathname)) navigate('/LunaTemplate'); };
  const message = () => { setMenu(null); openPlayerMessage({ id: p.id, friend_id: p.id, friend_name: name, name, friend_avatar: profile?.avatar_url || p.avatar, is_friend: friend }); toLuna(); };
  const voice = () => { window.__lunaPendingVoiceTargetId = p.id; message(); };
  const join = () => act('Join dashboard', async () => { toLuna(); await joinDashboard({ ...p, name }); onClose?.(); });
  const trade = () => act('Trade', () => sendTradeRequest({ id: user.id }, { id: p.id, name }), 'Trade request sent.');
  const invite = () => act('Party invite', async () => unwrap(await base44.functions.invoke('partySystem', { action: 'invite_member', data: { inviteeId: p.id } })), 'Party invitation sent.');
  const inviteDashboard = () => act('Dashboard invite', async () => unwrap(await base44.functions.invoke('socialActions', { action: 'send_dashboard_invite', data: { target_user_id: p.id } })), 'Dashboard invitation sent.');
  const toggleFollow = () => act('Follow', async () => {
    const rows = await base44.entities.Follow.filter({ follower_id: user.id, followed_id: p.id });
    if (rows?.length) { await Promise.all(rows.map(row => base44.entities.Follow.delete(row.id))); setFollowing(false); }
    else { await base44.entities.Follow.create({ follower_id: user.id, followed_id: p.id }); setFollowing(true); }
  });
  const friendAction = () => act(friend ? 'Unfriend' : 'Add friend', async () => {
    if (friend) {
      if (!window.confirm('Remove ' + name + ' from your friends?')) return;
      unwrap(await base44.functions.invoke('socialActions', { action: 'remove_friend', data: { friend_user_id: p.id } }));
      setFriend(false);
    } else {
      unwrap(await base44.functions.invoke('socialActions', { action: 'send_friend_request', data: { target_user_id: p.id } }));
      setRequested(true);
      showSuccess('Friend request sent.');
    }
    window.dispatchEvent(new CustomEvent('lunaSocialChanged', { detail: { type: 'friends', friendId: p.id } }));
    refetch();
  });
  const report = () => act('Report', async () => {
    unwrap(await base44.functions.invoke('forumSystem', { action: 'report', data: { target_type: 'user', target_id: p.id, reason, details: details.trim() } }));
    setReporting(false); setMore(false);
  }, 'Report submitted.');

  const showGame = index => {
    const game = games[index];
    if (!game) return;
    setSelectedId(game.id);
  };
  const handleGameKeys = event => {
    if (event.target?.closest?.('input,textarea,select,[contenteditable="true"]')) return;
    const next = nextGameIndex(event.key, selectedIndex, games.length, GAME_SHELF_COLUMNS);
    if (next === selectedIndex) return;
    event.preventDefault();
    showGame(next);
    galleryRef.current?.querySelector(`[data-game-position="${next}"]`)?.focus({ preventScroll: false });
  };

  return <div className="gamer-profile" data-luna-gamer-profile={p.id} data-profile-layout="70-30">
    <div className="gamer-profile-stage">
      <aside className="gamer-avatar-pane">
        <div className="gamer-eyebrow">ATOM XE · LIVE AI AVATAR</div>
        <div className="gamer-profile-name">
          <h1>{name}</h1>
          <span className={'gamer-presence ' + (profile?.online ? 'online' : '')}><i />{profile?.status || p.status}{self ? ' · You' : friend ? ' · Friend' : ''}</span>
        </div>
        <div className="gamer-avatar-viewer">
          {profile?.avatar
            ? <GenesisModelPreview key={p.id} config={profile.avatar} compact controls="none" idleOnly initialYaw={-0.2} />
            : <div className="gamer-avatar-fallback">
                {profile?.avatar_url || p.avatar ? <img src={profile?.avatar_url || p.avatar} alt={name} /> : <Shield size={48} />}
                <span>{isLoading ? 'Loading avatar…' : 'No 3D avatar shared yet'}</span>
              </div>}
          <div className="gamer-avatar-level"><small>AVATAR LEVEL</small><strong>{profile?.level || 1}</strong></div>
        </div>
        <div className="gamer-avatar-activity"><small>CURRENT ACTIVITY</small><strong>{profile?.current_game || (profile?.online ? 'Online in Atom XE' : 'Offline')}</strong></div>
        {!self && <div className="gamer-profile-actions">
          <div className="gamer-dropdown">
            <button type="button" aria-haspopup="menu" aria-expanded={menu === 'message'} onClick={() => setMenu(menu === 'message' ? null : 'message')} disabled={!user?.id}>
              <MessageSquare size={15} /> Message <ChevronDown size={12} />
            </button>
            {menu === 'message' && <div className="gamer-dropdown-menu" role="menu">
              <button type="button" role="menuitem" onClick={message}><MessageSquare size={14} /> Regular chat</button>
              <button type="button" role="menuitem" onClick={voice}><Mic size={14} /> Voice call</button>
            </div>}
          </div>
          <div className="gamer-dropdown">
            <button type="button" aria-haspopup="menu" aria-expanded={menu === 'invite'} onClick={() => setMenu(menu === 'invite' ? null : 'invite')} disabled={!!busy || !user?.id}>
              <Users size={15} /> Invite <ChevronDown size={12} />
            </button>
            {menu === 'invite' && <div className="gamer-dropdown-menu" role="menu">
              <button type="button" role="menuitem" onClick={invite}><Users size={14} /> To Party</button>
              <button type="button" role="menuitem" onClick={inviteDashboard}><LayoutDashboard size={14} /> To Dashboard</button>
            </div>}
          </div>
        </div>}
        <div className="gamer-avatar-secondary">
          <button type="button" onClick={() => { navigate('/PlayerProfile?userId=' + encodeURIComponent(p.id) + '&view=dashboard'); onClose?.(); }} disabled={!profile}>
            <LayoutDashboard size={13} /> Dashboard <ArrowUpRight size={12} />
          </button>
          {!self && <button type="button" onClick={join} disabled={!!busy}><LogIn size={13} /> Join</button>}
          {!self && <button type="button" onClick={trade} disabled={!!busy}><Repeat2 size={13} /> Trade</button>}
        </div>
      </aside>

      <main className="gamer-feature">
        <header className="gamer-feature-header">
          <div><span className="gamer-eyebrow">THE GAMES BEHIND THE PLAYER</span>
            <h2>{selectedGame?.title || 'Select a game to explore'}</h2>
            <p>{selectedGame ? `${selectedGame.genre || 'Game'} · ${selectedGame.played ? 'Played' : 'Not played yet'}` : 'Choose one of the titles in the gallery below.'}</p>
          </div>
          <button type="button" className="gamer-refresh" aria-label="Refresh player profile" onClick={() => refetch()}><RefreshCw size={16} /></button>
        </header>
        {isLoading && <p className="gamer-status" role="status">Loading player games, achievements and cards…</p>}
        {error && <div className="gamer-status" role="alert">{error.message || 'Profile could not load.'} <button onClick={() => refetch()}>Try again</button></div>}
        <div className="gamer-feature-content">
          <GameMontage game={selectedGame} />
          <UnlocksForGame game={selectedGame} profile={profile} />
        </div>
        <div className="gamer-feature-footer">
          <div><Trophy size={14} /><strong>{profile?.counts?.achievements || 0}</strong><span>Achievements</span></div>
          <div><Layers3 size={14} /><strong>{profile?.counts?.cards || 0}</strong><span>Cards</span></div>
          <div><Gamepad2 size={14} /><strong>{playedCount}</strong><span>Games played</span></div>
          {initialTab === 'dashboard' && <span className="gamer-dashboard-indicator"><LayoutDashboard size={13} /> Player dashboard profile</span>}
          {!self && <div className="gamer-profile-more-wrap">
            <button type="button" onClick={() => setMore(!more)} aria-expanded={more}><ChevronDown size={13} /> More</button>
            {more && <div className="gamer-profile-more">
              <button type="button" onClick={friendAction} disabled={!!busy || requested}>{friend ? <UserMinus size={14} /> : <UserPlus size={14} />}{friend ? 'Remove friend' : requested ? 'Request sent' : 'Add friend'}</button>
              <button type="button" onClick={toggleFollow} disabled={!!busy}><Heart size={14} />{following ? 'Unfollow' : 'Follow'}</button>
              <button type="button" onClick={() => setReporting(!reporting)}><Flag size={14} /> Report player</button>
            </div>}
          </div>}
        </div>
        {reporting && <div className="gamer-report">
          <label>Reason<select value={reason} onChange={event => setReason(event.target.value)}>{['harassment', 'spam', 'hate', 'other'].map(value => <option key={value}>{value}</option>)}</select></label>
          <textarea value={details} onChange={event => setDetails(event.target.value)} maxLength={1000} aria-label="Report details" placeholder="Optional details" />
          <button type="button" onClick={report} disabled={!!busy}>Submit report</button>
        </div>}
      </main>
    </div>

    <section className="gamer-gallery" aria-label="Player game collection">
      <header className="gamer-gallery-header">
        <div><span className="gamer-eyebrow">GAME HISTORY & DISCOVERY</span><h2>Game collection</h2></div>
        <span>{playedCount} played · {games.length} shown</span>
        <span className="gamer-gallery-help">Select or hover · A / D one game · W / S one row · scroll for more</span>
      </header>
      <div className="gamer-gallery-band">
        <div className="gamer-gallery-blank" aria-hidden="true" />
        <div ref={galleryRef} className="gamer-game-shelf" tabIndex={0} onKeyDown={handleGameKeys} aria-label="Game shelf. Use A and D or W and S to navigate." >
          {games.map((game, index) => <button
            key={game.id}
            type="button"
            data-game-position={index}
            aria-label={`${game.title}, ${game.played ? 'played' : 'not played'}`}
            aria-pressed={selectedIndex === index}
            onClick={() => showGame(index)}
            onFocus={() => showGame(index)}
            onMouseEnter={() => showGame(index)}
            className={'gamer-game-tile ' + (!game.played ? 'unplayed' : '')}
            title={game.title}
          >
            <span className="gamer-tile-art">
              {game.cover_image ? <img src={game.cover_image} alt="" loading="lazy" /> : <Gamepad2 size={23} />}
              {!game.played && <i>NOT PLAYED</i>}
            </span>
            <span className="gamer-tile-name">{game.title}</span>
          </button>)}
          {!games.length && !isLoading && <p className="gamer-gallery-empty">No games are available in the catalog yet.</p>}
        </div>
        <div className="gamer-gallery-blank" aria-hidden="true" />
      </div>
    </section>
  </div>;
}
