import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, Box, Check, ChevronDown, Crown, Gamepad2, Maximize2, Megaphone, MessageSquare, Minimize2, Pause, Plus, RotateCcw, Settings, Shield, Sparkles, TrendingUp, Trophy, Users, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useClanHome from './useClanHome';
import './clanHome.css';

const StrongholdViewer = lazy(() => import('@/components/dashboard/TransparentModel3DViewer'));
const DEFAULT_ENVIRONMENT = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/ddff83a29_ModularEnvironment.fbx';
const number = (value) => Math.max(0, Number(value) || 0).toLocaleString();
const dateLabel = (value) => Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Clan update';

export function upgradeProgress(upgrade) {
  const duration = Number(upgrade.build_seconds);
  if (['completed', 'active'].includes(upgrade.status)) return 100;
  if (!(duration > 0)) return 0;
  return Math.max(0, Math.min(100, Math.round((Number(upgrade.progress_seconds) || 0) / duration * 100)));
}

class ViewerBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    return this.state.error ? <div className="clan-viewer-placeholder" role="alert"><Box size={34} /><h3>The 3D view couldn’t start</h3><p>Your clan information is still available below.</p><button type="button" onClick={() => this.setState({ error: false })}><RotateCcw size={15} />Try again</button></div> : this.props.children;
  }
}

export default function ClanHome({ clan, members = [], currentUserRole, isStrongholdEnabled, onToggleStronghold, onNavigate, onLeave, onDisband, leaving = false }) {
  const query = useClanHome(clan?.id);
  const [expanded, setExpanded] = useState(false);
  const [environmentUrl, setEnvironmentUrl] = useState(DEFAULT_ENVIRONMENT);
  const [composerOpen, setComposerOpen] = useState(false);
  const [content, setContent] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [published, setPublished] = useState(false);
  const [updateFilter, setUpdateFilter] = useState('all');
  const viewerRef = useRef(null);
  const publishTrigger = useRef(null);
  const state = query.data;
  const info = state?.clan || clan || {};
  const role = state?.role || currentUserRole || 'member';
  const canManage = ['leader', 'officer'].includes(role);
  const roster = state?.members || members;
  const announcements = (state?.announcements || []).filter((item) => updateFilter !== 'pinned' || item.isPinned);
  const upgrades = (state?.upgrades || []).filter((item) => ['in_progress', 'completed', 'active'].includes(item.status));
  const hall = state?.hall;
  const completedAchievements = (info.clanAchievements || []).filter((item) => item.completed);
  const tags = [...new Set([...(info.playstyles || info.focusTags || []), ...(info.genres || [])])].slice(0, 6);
  const failures = state?.failures || [];
  const openChat = () => window.dispatchEvent(new CustomEvent('openClanChatOverlay'));

  useEffect(() => {
    const change = (event) => { if (typeof event.detail === 'string' && event.detail) setEnvironmentUrl(event.detail); };
    window.addEventListener('changeStrongholdEnv', change);
    return () => window.removeEventListener('changeStrongholdEnv', change);
  }, []);
  useEffect(() => {
    const resize = requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    return () => cancelAnimationFrame(resize);
  }, [expanded]);
  useEffect(() => {
    const close = (event) => { if (event.key === 'Escape' && !event.defaultPrevented && !composerOpen) setExpanded(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [composerOpen]);
  const openComposer = () => { setPublishError(''); setPublished(false); setComposerOpen(true); };
  const publish = async (event) => {
    event.preventDefault();
    if (!canManage || !content.trim() || publishing) return;
    setPublishing(true); setPublishError('');
    try {
      const result = await base44.functions.invoke('clanSystem', { action: 'post_message', data: { divisionId: clan.id, channelId: 'clan_global', content: content.trim(), isAnnouncement: true } });
      const payload = result?.data || result;
      if (!payload?.success) throw new Error(payload?.error || 'The update could not be published.');
      setContent(''); setComposerOpen(false); setPublished(true);
      await query.refetch();
    } catch (error) { setPublishError(error?.message || 'Please try again. Your draft is still here.'); }
    finally { setPublishing(false); }
  };

  return <main className={'clan-home' + (expanded ? ' is-viewer-expanded' : '')}>
    <div className="clan-home-inner">
      <header className="clan-home-top"><div><Shield size={17} /><span>CLAN HEADQUARTERS</span><i /><strong>Your stronghold</strong></div><span className="clan-role"><Crown size={13} />{role}</span></header>
      <section className="clan-home-hero" aria-label="Clan stronghold">
        <div className="clan-home-identity">
          <div className="clan-identity-heading"><div className="clan-emblem">{info.icon ? <img src={info.icon} alt="" /> : <Shield size={32} />}</div><span className="clan-eyebrow">{info.tag || 'ONE GUILD. ONE HOME.'}</span></div>
          <h1>{info.name || 'Your clan'}</h1>
          <p>{info.description || 'Your shared home for clan announcements, collective progress, and the people you play with.'}</p>
          {!!tags.length && <div className="clan-identity-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
          <div className="clan-identity-facts"><div><Users size={16} /><strong>{failures.includes('members') ? '—' : number(roster.length)}</strong><span>members{info.sizeLimit ? ' / ' + number(info.sizeLimit) : ''}</span></div><div><Shield size={16} /><strong>{number(info.level || 1)}</strong><span>clan level</span></div></div>
          <div className="clan-identity-actions"><button type="button" className="clan-primary" onClick={openChat}><MessageSquare size={17} />Open clan chat<ArrowRight size={15} /></button><button type="button" className="clan-secondary" onClick={() => onNavigate('roster')}><Users size={16} />View roster</button></div>
        </div>
        <section ref={viewerRef} className="clan-stronghold-stage" aria-label="3D clan stronghold">
          <div className="clan-viewer-toolbar"><div><Box size={16} /><span>{hall?.hall_name || 'The stronghold'}</span></div><div><button type="button" aria-label={expanded ? 'Reduce stronghold view' : 'Expand stronghold view'} aria-expanded={expanded} onClick={() => { setExpanded((value) => !value); viewerRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }}>{expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>{isStrongholdEnabled && <button type="button" onClick={onToggleStronghold}><Pause size={14} /><span>Pause 3D</span></button>}</div></div>
          <div className="clan-viewer-content">
            {isStrongholdEnabled && !composerOpen ? <ViewerBoundary><Suspense fallback={<div className="clan-viewer-placeholder" role="status"><Box size={35} /><h3>Opening your stronghold…</h3></div>}><StrongholdViewer roomModelUrl={environmentUrl} /></Suspense></ViewerBoundary>
              : <div className="clan-viewer-placeholder">{info.banner && <img src={info.banner} alt="" className="clan-stronghold-poster" />}<div className="clan-viewer-emblem"><Shield size={45} strokeWidth={1.1} /></div><span className="clan-eyebrow">THE PLACE YOU BUILD TOGETHER</span><h2>Your guild. Your ground.</h2><p>Step into your shared 3D space.</p><button type="button" className="clan-primary" onClick={onToggleStronghold}><Box size={16} />Enter 3D stronghold<ArrowRight size={15} /></button></div>}
          </div>
          <div className="clan-viewer-caption"><span><i className={isStrongholdEnabled ? 'is-active' : ''} />{isStrongholdEnabled ? '3D view active' : 'Ready when you are'}</span><span>{hall ? hall.hall_type?.replaceAll('_', ' ') : 'Clan headquarters'}</span></div>
        </section>
      </section>

      <nav className="clan-home-shortcuts" aria-label="Clan destinations">
        <button type="button" onClick={() => document.getElementById('clan-updates')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><Megaphone size={20} /><span><strong>Clan updates</strong><small>The latest from your guild</small></span><ArrowRight size={16} /></button>
        <button type="button" onClick={() => onNavigate('roster')}><Users size={20} /><span><strong>Members</strong><small>Your people, together</small></span><ArrowRight size={16} /></button>
        <button type="button" onClick={() => onNavigate('games_chat')}><Gamepad2 size={20} /><span><strong>Game rooms</strong><small>Find your next squad</small></span><ArrowRight size={16} /></button>
        {canManage ? <button type="button" onClick={() => onNavigate('admin_overview')}><Settings size={20} /><span><strong>Manage clan</strong><small>Resources & operations</small></span><ArrowRight size={16} /></button> : <button type="button" onClick={openChat}><MessageSquare size={20} /><span><strong>Clan chat</strong><small>Keep the conversation going</small></span><ArrowRight size={16} /></button>}
      </nav>

      {query.isError && <div className="clan-home-notice" role="alert"><span>Clan updates couldn’t load. Your last available information is shown.</span><button type="button" onClick={() => query.refetch()}>Try again</button></div>}
      <div className="clan-home-grid">
        <section className="clan-updates-panel" id="clan-updates" aria-labelledby="clan-updates-title">
          <header className="clan-section-heading"><div><span className="clan-eyebrow">FROM YOUR LEADERSHIP</span><h2 id="clan-updates-title">Around the stronghold</h2></div>{canManage && <button ref={publishTrigger} type="button" className="clan-secondary" onClick={openComposer}><Plus size={15} />Post update</button>}</header>
          {info.motto && <div className="clan-message-of-day"><Megaphone size={20} /><div><span>Message of the day</span><p>{info.motto}</p></div></div>}
          <div className="clan-updates-filters"><button type="button" aria-pressed={updateFilter === 'all'} onClick={() => setUpdateFilter('all')}>All updates</button><button type="button" aria-pressed={updateFilter === 'pinned'} onClick={() => setUpdateFilter('pinned')}>Pinned</button><span>Clan announcements</span></div>
          {published && <p className="clan-published" role="status"><Check size={15} />Your update is published.</p>}
          {query.isPending ? <div className="clan-home-empty" role="status"><Megaphone size={26} /><p>Loading clan announcements…</p></div>
            : query.isError || failures.includes('announcements') ? <div className="clan-home-empty" role="alert"><p>Announcements couldn’t load.</p><button type="button" onClick={() => query.refetch()}>Try again</button></div>
            : announcements.length ? <div className="clan-announcement-list">{announcements.map((item) => <article key={item.id} className="clan-announcement"><div className="clan-announcement-avatar">{item.authorAvatar ? <img src={item.authorAvatar} alt="" loading="lazy" /> : (item.author || 'C').charAt(0)}</div><div><header><strong>{item.author || 'Clan leadership'}</strong><span>{item.role === 'leader' ? 'Leader' : 'Officer'}</span>{item.isPinned && <span className="clan-pinned">Pinned</span>}<time dateTime={item.created_date}>{dateLabel(item.created_date)}</time></header><p>{item.content}</p><button type="button" onClick={openChat}><MessageSquare size={13} />Discuss in clan chat <ArrowRight size={12} /></button></div></article>)}</div>
            : <div className="clan-home-empty"><Megaphone size={28} /><h3>{updateFilter === 'pinned' ? 'No pinned updates' : 'A quiet moment at the stronghold'}</h3><p>{updateFilter === 'pinned' ? 'Switch to all updates to catch up on your clan.' : 'Leadership announcements will appear here as your guild shares news and progress.'}</p>{canManage && updateFilter === 'all' && <button type="button" onClick={openComposer}>Write the first update <ArrowRight size={15} /></button>}</div>}
        </section>

        <aside className="clan-home-sidebar">
          <section className="clan-status-panel" aria-labelledby="clan-status-title"><header><TrendingUp size={17} /><h2 id="clan-status-title">Stronghold progress</h2></header><p className="clan-panel-intro">The work your clan has put in.</p>
            {query.isPending ? <p className="clan-small-empty" role="status">Loading saved progress…</p> : query.isError || failures.includes('upgrades') ? <p className="clan-small-empty">Upgrade progress is unavailable.</p> : upgrades.length ? <div className="clan-upgrade-list">{upgrades.slice(0, 4).map((item) => <div key={item.id}><div><strong>{item.upgrade_name}</strong><span>{['completed','active'].includes(item.status) ? <Check size={14} /> : 'In progress'}</span></div><progress max="100" value={upgradeProgress(item)} aria-label={item.upgrade_name + ' progress'} /><small>Tier {number(item.tier)} · {['completed','active'].includes(item.status) ? 'Completed' : upgradeProgress(item) + '% recorded'}</small></div>)}</div> : <p className="clan-small-empty">No upgrades have been started yet.</p>}
            {hall && <dl className="clan-hall-resources"><div><dt>Guild favor</dt><dd>{number(hall.favor)}</dd></div><div><dt>Aetherium</dt><dd>{number(hall.aetherium)}</dd></div></dl>}
            {canManage && <button type="button" className="clan-panel-link" onClick={() => onNavigate('admin_overview')}>Open clan operations <ArrowRight size={14} /></button>}
          </section>
          <section className="clan-status-panel"><header><Trophy size={17} /><h2>Earned together</h2></header>{completedAchievements.length ? <ul className="clan-achievement-list">{completedAchievements.slice(0, 4).map((item, index) => <li key={item.title + index}><Sparkles size={17} /><div><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}</div></li>)}</ul> : <p className="clan-small-empty">Completed clan achievements will be celebrated here.</p>}</section>
          {!!info.gameTags?.length && <section className="clan-status-panel"><header><Gamepad2 size={17} /><h2>Where we play</h2></header><div className="clan-games-tags">{info.gameTags.map((game) => <span key={game}>{game}</span>)}</div><button type="button" className="clan-panel-link" onClick={() => onNavigate('games_chat')}>Go to game rooms <ArrowRight size={14} /></button></section>}
        </aside>
      </div>
      <footer className="clan-home-footer"><span><Shield size={14} />{info.name} · Built together.</span><details><summary>Clan settings <ChevronDown size={13} /></summary><div><p>{role === 'leader' ? 'Manage your clan’s lifecycle.' : 'Manage your membership.'}</p><button type="button" disabled={leaving} onClick={role === 'leader' ? onDisband : onLeave}>{leaving ? 'Please wait…' : role === 'leader' ? 'Disband clan' : 'Leave clan'}</button></div></details></footer>
    </div>

    <Dialog.Root open={composerOpen && canManage} onOpenChange={(value) => { if (!publishing) setComposerOpen(value); }}><Dialog.Portal><Dialog.Overlay className="clan-update-scrim" /><Dialog.Content className="clan-update-dialog" onCloseAutoFocus={(event) => { event.preventDefault(); publishTrigger.current?.focus(); }}>
      <header><div><span className="clan-eyebrow">TO YOUR CLAN</span><Dialog.Title>Share an update</Dialog.Title></div><Dialog.Close aria-label="Close clan update" disabled={publishing}><X size={19} /></Dialog.Close></header>
      <Dialog.Description>Post news, celebrate a win, or share what your guild needs to know. Everyone in the clan can read this announcement.</Dialog.Description>
      <form onSubmit={publish}><label htmlFor="clan-update-content">Your announcement</label><textarea id="clan-update-content" autoFocus value={content} maxLength={4000} onChange={(event) => setContent(event.target.value)} placeholder="What’s happening in the clan?" disabled={publishing} /><span className="clan-update-count">{content.length.toLocaleString()} / 4,000</span>{publishError && <p className="clan-update-error" role="alert">{publishError}</p>}<footer><Dialog.Close type="button" disabled={publishing}>Cancel</Dialog.Close><button type="submit" className="clan-primary" disabled={!content.trim() || publishing}>{publishing ? 'Publishing…' : 'Publish update'}<ArrowRight size={15} /></button></footer></form>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </main>;
}
