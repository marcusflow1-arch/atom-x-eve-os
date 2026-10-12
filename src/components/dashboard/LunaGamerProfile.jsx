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
import { buildSelfConsoleProfile, loadSelfConsoleProfile } from './selfConsoleProfile.mjs';
import { gameArtifacts, gameMedia, nextGameIndex } from './gameProfileSelectors.mjs';
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

function GameMontage({ game, onOpen }) {
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
        <button type="button" className="gamer-montage-open" onClick={() => onOpen?.(game)}><ArrowUpRight size={13} /> View Game Details</button>
        {!media.video && media.stills.length > 1 && <div className="gamer-montage-dots" aria-label="Preview frames">
          {media.stills.map((_, index) => <i key={index} className={index === frame ? 'active' : ''} />)}
        </div>}
      </div>
    </> : <div className="gamer-montage-placeholder"><Gamepad2 size={54} /><span>Select a title from the game shelf below</span></div>}
  </div>;
}


function GamerAchievementRail({ items, title, side, onSelect }) {
  return <aside className={'gamer-console-rail gamer-console-rail-' + side} aria-label={title}>
    <div className="gamer-console-rail-heading"><Trophy size={13} /><span>{title}</span></div>
    <div className="gamer-console-rail-cards">
      {items.length ? items.map((item, index) => <button type="button" className="gamer-console-achievement" key={item.type + ':' + (item.id || index)} title={'View ' + item.name} onClick={() => onSelect?.(item)} aria-label={'View ' + item.name + ' details'}>
        <div className="gamer-console-achievement-art">
          {item.image ? <img src={item.image} alt="" loading="lazy" /> : (item.type === 'card' ? <Layers3 size={30} /> : <Trophy size={30} />)}
        </div>
        <strong>{item.name}</strong>
        <span>{item.detail}</span>
      </button>) : <div className="gamer-console-no-rewards">No achievements or cards earned for this game yet.</div>}
    </div>
  </aside>;
}

export default function LunaGamerProfile({ player, onClose, initialTab = 'overview' }) {
  const { user, avatar: ownAvatar, updateUserData } = useAuth();
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
  const [selectedReward, setSelectedReward] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftBio, setDraftBio] = useState('');
  const [saving, setSaving] = useState(false);
  const featureRef = useRef(null);
  const galleryRef = useRef(null);

  const { data: fetchedProfile, isLoading, error, refetch } = useQuery({
    queryKey: ['console-profile', user?.id, p.id, self ? ownAvatar?.id || 'avatar-loading' : 'friend'],
    enabled: Boolean(user?.id && p.id),
    retry: false,
    staleTime: 60000,
    queryFn: async () => self
      ? loadSelfConsoleProfile(base44, user, ownAvatar)
      : unwrap(await base44.functions.invoke('friendConsoleProfile', { target_user_id: p.id })).profile,
  });
  // Own identity renders immediately, even if the avatar or library is still loading.
  // Friend profiles retain their existing server-side privacy checks.
  const profile = self
    ? { ...buildSelfConsoleProfile(user, ownAvatar), ...fetchedProfile, avatar: ownAvatar || fetchedProfile?.avatar || null }
    : fetchedProfile;
  const name = profile?.name || p.name;
  const games = profile?.games || [];
  const selectedIndex = Math.max(0, games.findIndex(game => game.id === selectedId));
  const selectedGame = games[selectedIndex] || null;
  const playedCount = profile?.counts?.games || 0;

  useEffect(() => { setSelectedId(''); setMenu(null); setSelectedReward(null); setEditing(false); }, [p.id]);
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

  const openGameDetails = game => {
    if (!game?.id) return;
    navigate('/GameDetail?id=' + encodeURIComponent(game.id) + '&from=library');
    onClose?.();
  };
  const openEdit = () => { setDraftName(user?.username || user?.display_name || user?.full_name || ''); setDraftBio(user?.bio || ''); setEditing(true); };
  const saveEdits = async () => {
    const username = draftName.trim();
    if (!username || saving) return;
    setSaving(true);
    try {
      const result = await updateUserData({ username, bio: draftBio.trim() });
      if (!result?.success) throw new Error(result?.error || 'Could not save your profile.');
      setEditing(false);
      await refetch();
      showSuccess('Your profile was updated.');
    } catch (e) { showError(e, 'Save profile'); }
    finally { setSaving(false); }
  };
  const showGame = index => {
    const game = games[index];
    if (!game) return;
    setSelectedId(game.id);
  };
  const handleGameKeys = event => {
    if (event.target?.closest?.('input,textarea,select,[contenteditable="true"]')) return;
    const next = nextGameIndex(event.key, selectedIndex, games.length, 1);
    if (next === selectedIndex) return;
    event.preventDefault();
    showGame(next);
    galleryRef.current?.querySelector(`[data-game-position="${next}"]`)?.focus({ preventScroll: false });
  };
  const rewardData = gameArtifacts(profile, selectedGame);
  const rewards = [
    ...rewardData.cards.map(card => ({ type: 'card', id: card.id, name: card.name || 'Achievement card', image: card.image, detail: card.rarity || 'Card' })),
    ...rewardData.achievements.map(item => ({ type: 'achievement', id: item.id, name: item.title || 'Achievement', image: item.icon, detail: (Number(item.points) || 0) + ' points' })),
  ];
  const rewardsLeft = rewards.filter((_, index) => index % 2 === 0);
  const rewardsRight = rewards.filter((_, index) => index % 2 === 1);
  const wallpaper = gameMedia(selectedGame).stills[0] || '';
  const gender = String(profile?.avatar?.gender || profile?.gender || '').toLowerCase();
  const hasPortrait = Boolean(profile?.avatar_url || p.avatar);
  const galleryStep = delta => {
    const next = Math.max(0, Math.min(games.length - 1, selectedIndex + delta));
    showGame(next);
    galleryRef.current?.querySelector('[data-game-position="' + next + '"]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  return <div className={'gamer-profile gamer-console ' + (gender === 'female' ? 'gamer-console-female' : gender === 'male' ? 'gamer-console-male' : '')}
    data-luna-gamer-profile={p.id}
    data-profile-layout="profile-console"
    data-profile-owner={self ? 'you' : 'friend'}
    style={wallpaper ? { '--gamer-wallpaper': 'url(' + JSON.stringify(wallpaper) + ')' } : undefined}>
    <nav className="gamer-console-nav" aria-label="Player profile">
      <span className="gamer-console-brand"><Shield size={19} /> ATOM <b>X</b> EVE</span>
      <span className="gamer-console-nav-active">{self ? 'Your Profile · You' : 'Profile'}</span>
      <button type="button" className="gamer-console-nav-link" onClick={() => galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}>Games</button>
      <button type="button" className="gamer-console-nav-link" onClick={() => { navigate('/Friends'); onClose?.(); }}>Social</button>
      <button type="button" className="gamer-console-nav-link" onClick={() => featureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}>Achievements</button>
      <span className="gamer-console-nav-spacer" />
      <button type="button" onClick={() => refetch()} aria-label="Refresh player profile" title="Refresh profile"><RefreshCw size={15} /></button>
    </nav>

    <div className="gamer-profile-stage">
      <aside className="gamer-console-identity gamer-console-panel" aria-label="Player details">
        <div className="gamer-console-portrait">
          {hasPortrait ? <img src={profile?.avatar_url || p.avatar} alt={name + ' portrait'} /> : <span aria-hidden="true">{name.charAt(0).toUpperCase()}</span>}
          <i className={profile?.online ? 'online' : ''} aria-label={profile?.online ? 'Online' : 'Offline'} />
        </div>
        <h1>{name}</h1>
        <div className={'gamer-presence ' + (profile?.online ? 'online' : '')}><i />{profile?.status || p.status}{self ? ' · You' : friend ? ' · Friend' : ''}</div>
        {profile?.bio && <p className="gamer-console-bio">{profile.bio}</p>}
        <div className="gamer-console-level">
          <div><strong>Lv. {profile?.level || 1}</strong>{profile?.xp != null && <span>{Number(profile.xp).toLocaleString()} XP</span>}</div>
          {Number(profile?.next_level_xp) > 0 && Number(profile?.xp) >= 0 && <div className="gamer-console-level-track"><i style={{ width: Math.min(100, Math.max(0, Number(profile.xp) / Number(profile.next_level_xp) * 100)) + '%' }} /></div>}
        </div>
        <div className="gamer-console-tags">
          <span><Gamepad2 size={12} /> {profile?.current_game || 'Atom X Eve player'}</span>
          {friend && <span><Users size={12} /> Friend</span>}
          {profile?.avatar && <span><Shield size={12} /> AI companion</span>}
        </div>
        <div className="gamer-console-stats">
          <div><strong>{playedCount}</strong><span>Games</span></div>
          <div><strong>{profile?.counts?.achievements || 0}</strong><span>Achievements</span></div>
          <div><strong>{profile?.counts?.cards || 0}</strong><span>Cards</span></div>
        </div>
        <div className="gamer-console-identity-actions">
          {self && <button type="button" onClick={openEdit}><Shield size={13} /> Edit Your Profile</button>}
          <button type="button" onClick={() => { navigate('/PlayerProfile?userId=' + encodeURIComponent(p.id) + '&view=dashboard'); onClose?.(); }} disabled={!profile}><LayoutDashboard size={13} /> {self ? 'Open Your Profile Page' : 'Open dashboard profile'}</button>
          {!self && <button type="button" onClick={join} disabled={!!busy}><LogIn size={13} /> Join dashboard</button>}
          {!self && <button type="button" onClick={trade} disabled={!!busy}><Repeat2 size={13} /> Trade cards</button>}
          {!self && <div className="gamer-profile-more-wrap">
            <button type="button" onClick={() => setMore(!more)} aria-expanded={more}><ChevronDown size={13} /> More player actions</button>
            {more && <div className="gamer-profile-more">
              <button type="button" onClick={friendAction} disabled={!!busy || requested}>{friend ? <UserMinus size={14} /> : <UserPlus size={14} />}{friend ? 'Remove friend' : requested ? 'Request sent' : 'Add friend'}</button>
              <button type="button" onClick={toggleFollow} disabled={!!busy}><Heart size={14} />{following ? 'Unfollow' : 'Follow'}</button>
              <button type="button" onClick={() => setReporting(!reporting)}><Flag size={14} /> Report player</button>
            </div>}
          </div>}
        </div>
      </aside>

      <main ref={featureRef} className="gamer-console-feature gamer-console-panel">
        <div className="gamer-console-feature-top">
          <span className="gamer-eyebrow">{self ? 'YOUR GAMES · YOUR ACHIEVEMENTS' : 'FEATURED GAME · PLAYER COLLECTION'}</span>
          <span className="gamer-console-feature-count">{rewards.length} unlocked rewards</span>
        </div>
        {isLoading && <p className="gamer-status" role="status">Loading player games, achievements and cards…</p>}
        {error && <div className="gamer-status" role="alert">{error.message || 'Profile could not load.'} <button type="button" onClick={() => refetch()}>Try again</button></div>}
        <div className="gamer-console-feature-grid">
          <GamerAchievementRail title="FEATURED ACHIEVEMENTS" side="left" items={rewardsLeft} onSelect={setSelectedReward} />
          <div className="gamer-console-feature-hero">
            <GameMontage game={selectedGame} onOpen={openGameDetails} />
            {!!selectedGame && <div className="gamer-console-feature-subtitle"><Gamepad2 size={13} />{selectedGame.genre || 'Game'} · {selectedGame.played ? 'Played' : 'In collection'}</div>}
          </div>
          <GamerAchievementRail title="RECENT REWARDS" side="right" items={rewardsRight} onSelect={setSelectedReward} />
        </div>
        {reporting && <div className="gamer-report">
          <label>Reason<select value={reason} onChange={event => setReason(event.target.value)}>{['harassment', 'spam', 'hate', 'other'].map(value => <option key={value}>{value}</option>)}</select></label>
          <textarea value={details} onChange={event => setDetails(event.target.value)} maxLength={1000} aria-label="Report details" placeholder="Optional details" />
          <button type="button" onClick={report} disabled={!!busy}>Submit report</button>
        </div>}
      </main>

      <aside className="gamer-console-avatar gamer-console-panel" aria-label="Live AI companion model">
        <div className="gamer-console-avatar-heading"><span><Shield size={13} /> AI COMPANION / AVATAR</span><b>LIVE 3D</b></div>
        <div className="gamer-console-avatar-viewer">
          {profile?.avatar
            ? <GenesisModelPreview key={p.id + ':' + gender} config={profile.avatar} compact idleOnly initialYaw={-0.2} />
            : <div className="gamer-avatar-fallback">
                {hasPortrait ? <img src={profile?.avatar_url || p.avatar} alt={name} /> : <Shield size={44} />}
                <span>{isLoading ? 'Loading avatar…' : 'No live 3D avatar available for this player'}</span>
              </div>}
          <div className="gamer-console-avatar-platform" aria-hidden="true" />
          <span className="gamer-console-avatar-caption">{profile?.avatar ? 'Drag to rotate · Scroll to zoom' : '3D preview'}</span>
        </div>
        {!self ? <div className="gamer-profile-actions">
          <div className="gamer-dropdown">
            <button type="button" aria-haspopup="menu" aria-expanded={menu === 'message'} onClick={() => setMenu(menu === 'message' ? null : 'message')} disabled={!user?.id}>
              <MessageSquare size={15} /> Message <ChevronDown size={12} />
            </button>
            {menu === 'message' && <div className="gamer-dropdown-menu" role="menu">
              <button type="button" role="menuitem" onClick={message}><MessageSquare size={14} /> Regular Chat</button>
              <button type="button" role="menuitem" onClick={voice}><Mic size={14} /> Voice Chat</button>
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
        </div> : <div className="gamer-profile-actions gamer-own-profile-actions">
          <button type="button" onClick={openEdit}><Shield size={14} /> Edit Profile</button>
          <button type="button" onClick={() => galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}><Gamepad2 size={14} /> My Games</button>
        </div>}
      </aside>
    </div>

    {selectedReward && <div className="gamer-console-detail-backdrop" onClick={() => setSelectedReward(null)}>
      <section role="dialog" aria-label="Achievement details" className="gamer-console-detail" onClick={event => event.stopPropagation()}>
        <div className="gamer-console-detail-header"><strong>{selectedReward.type === 'card' ? 'COLLECTIBLE CARD' : 'ACHIEVEMENT'}</strong>
          <button type="button" onClick={() => setSelectedReward(null)} aria-label="Close achievement details">×</button></div>
        {selectedReward.image && <img src={selectedReward.image} alt="" />}
        <h2>{selectedReward.name}</h2><p>{selectedReward.detail}</p>
        <button type="button" onClick={() => setSelectedReward(null)}>Close</button>
      </section>
    </div>}
    {self && editing && <div className="gamer-console-detail-backdrop" onClick={() => !saving && setEditing(false)}>
      <form className="gamer-console-detail gamer-console-editor" onClick={event => event.stopPropagation()} onSubmit={event => { event.preventDefault(); saveEdits(); }}>
        <div className="gamer-console-detail-header"><strong>EDIT YOUR PROFILE</strong>
          <button type="button" onClick={() => setEditing(false)} disabled={saving} aria-label="Close profile editor">×</button></div>
        <label>Your display name<input value={draftName} onChange={event => setDraftName(event.target.value)} maxLength={80} required /></label>
        <label>Your bio<textarea value={draftBio} onChange={event => setDraftBio(event.target.value)} maxLength={500} rows={4} /></label>
        <div className="gamer-console-editor-actions">
          <button type="button" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
          <button type="submit" disabled={saving || !draftName.trim()}>{saving ? 'Saving…' : 'Save Profile'}</button>
        </div>
      </form>
    </div>}

    <section className="gamer-gallery" aria-label="Player game collection">
      <header className="gamer-gallery-header">
        <div><span className="gamer-eyebrow">PLAYER LIBRARY</span><h2><Gamepad2 size={15} /> Games played & collected</h2></div>
        <span>{playedCount} played · {games.length} shown</span>
        <span className="gamer-console-nav-spacer" />
        <span className="gamer-gallery-help">Hover a game to change wallpaper</span>
      </header>
      <div className="gamer-gallery-band">
        <button type="button" className="gamer-carousel-arrow" aria-label="Previous game" disabled={!games.length || selectedIndex === 0} onClick={() => galleryStep(-1)}><ChevronDown size={19} /></button>
        <div ref={galleryRef} className="gamer-game-shelf" tabIndex={0} onKeyDown={handleGameKeys} aria-label="Game shelf. Use left and right arrows or A and D to navigate.">
          {games.map((game, index) => <button
            key={game.id}
            type="button"
            data-game-position={index}
            aria-label={game.title + ', ' + (game.played ? 'played' : 'not played')}
            aria-pressed={selectedIndex === index}
            onClick={() => showGame(index)}
            onFocus={() => showGame(index)}
            onMouseEnter={() => showGame(index)}
            className={'gamer-game-tile ' + (!game.played ? 'unplayed' : '')}
            title={game.title}>
            <span className="gamer-tile-art">
              {game.cover_image ? <img src={game.cover_image} alt="" loading="lazy" /> : <Gamepad2 size={23} />}
              {!game.played && <i>NOT PLAYED</i>}
            </span>
            <span className="gamer-tile-name">{game.title}</span>
          </button>)}
          {!games.length && !isLoading && <p className="gamer-gallery-empty">No games shared in this profile yet.</p>}
        </div>
        <button type="button" className="gamer-carousel-arrow gamer-carousel-next" aria-label="Next game" disabled={!games.length || selectedIndex === games.length - 1} onClick={() => galleryStep(1)}><ChevronDown size={19} /></button>
      </div>
    </section>
  </div>;
}
