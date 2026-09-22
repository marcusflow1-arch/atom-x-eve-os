import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, ChevronRight, Cpu, Image as ImageIcon, Megaphone,
  MessageSquare, Send, Building2, ScrollText, X
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import GameImage from './GameImage';
import { mediaUrl, releaseLabel, requirementGroups } from './gameDetailData';

const dateLabel = value => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
};

export function GameIdentityFacts({ game }) {
  const facts = [
    ['Release date', releaseLabel(game)],
    ['Developer', game.developer || game.studio || 'Not published'],
    ['Publisher', game.publisher || 'Not published'],
    ['Genre', game.genre ? String(game.genre).replaceAll('_', ' ') : 'Not published'],
  ];
  return <section className="gd-restored-section gd-fact-strip" aria-label="Game publishing details">
    {facts.map(([name, value]) => <div key={name}><span>{name}</span><strong>{value}</strong></div>)}
  </section>;
}

export function GameScreenshots({ game }) {
  const screenshots = useMemo(() => {
    const seen = new Set();
    return (Array.isArray(game.screenshots) ? game.screenshots : [])
      .map(mediaUrl)
      .filter(url => url && !seen.has(url) && seen.add(url));
  }, [game.screenshots]);
  const [selected, setSelected] = useState(null);

  if (!screenshots.length) return <section id="game-screenshots" className="gd-restored-section">
    <div className="gd-section-heading"><div><span className="gd-eyebrow">Media</span><h2>Screenshots</h2><p>No screenshots have been published for this game yet.</p></div><ImageIcon size={24}/></div>
  </section>;

  return <section id="game-screenshots" className="gd-restored-section">
    <div className="gd-section-heading"><div><span className="gd-eyebrow">Media</span><h2>Screenshots</h2><p>Published images from {game.title}.</p></div><ImageIcon size={24}/></div>
    <div className="gd-screenshot-grid">
      {screenshots.slice(0, 8).map((url, index) => <button key={url} type="button" onClick={() => setSelected({ url, index })} aria-label={'Open Screenshot ' + (index + 1)}>
        <GameImage src={url} alt={game.title + ' screenshot ' + (index + 1)} loading="lazy" />
      </button>)}
    </div>
    {selected && <div className="gd-screenshot-modal" role="dialog" aria-modal="true" aria-label={'Screenshot ' + (selected.index + 1)} onClick={() => setSelected(null)}>
      <button className="gd-screenshot-close" type="button" onClick={() => setSelected(null)} aria-label="Close screenshot"><X size={18}/></button>
      <GameImage src={selected.url} alt={game.title + ' screenshot ' + (selected.index + 1)} />
    </div>}
  </section>;
}

export function GameAnnouncements({ game }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setFailed(false);
    const announcementRequest = base44.entities.GameAnnouncement?.filter
      ? base44.entities.GameAnnouncement.filter({ game_id: game.id, published: true }, '-created_date', 50)
      : Promise.resolve([]);
    const legacyEvents = base44.entities.Post?.filter
      ? base44.entities.Post.filter({ game_title: game.title, community: 'events' }, '-created_date', 50)
      : Promise.resolve([]);

    Promise.allSettled([announcementRequest, legacyEvents]).then(([announcements, posts]) => {
      if (cancelled) return;
      const published = announcements.status === 'fulfilled' ? announcements.value || [] : [];
      const legacy = posts.status === 'fulfilled' ? posts.value || [] : [];
      const normalizedLegacy = legacy
        .filter(post => !['removed', 'archived'].includes(post.status))
        .map(post => ({
          id: 'post:' + post.id,
          title: post.title,
          body: post.content,
          announcement_type: 'event',
          author_name: post.author_name,
          created_date: post.created_date,
        }));
      setRows([...published, ...normalizedLegacy].sort((a, b) => new Date(b.starts_at || b.created_date || 0) - new Date(a.starts_at || a.created_date || 0)));
      setFailed(announcements.status === 'rejected' && posts.status === 'rejected');
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [game.id, game.title, retry]);

  return <section id="game-events" className="gd-restored-section">
    <div className="gd-section-heading"><div><span className="gd-eyebrow">Stay current</span><h2>Events & announcements</h2><p>Updates published for this game.</p></div><Megaphone size={24}/></div>
    {loading ? <p className="gd-muted" role="status">Loading events and announcements…</p>
      : failed ? <div className="gd-empty" role="alert"><p>This feed could not be loaded.</p><button className="gd-text-button" onClick={() => setRetry(value => value + 1)}>Try again</button></div>
      : rows.length ? <div className="gd-announcement-grid">{rows.slice(0, 8).map(row => <article key={row.id}>
        <div className="gd-announcement-meta"><span>{String(row.announcement_type || 'announcement').replaceAll('_', ' ')}</span>{(row.starts_at || row.created_date) && <time>{dateLabel(row.starts_at || row.created_date)}</time>}</div>
        <h3>{row.title}</h3>
        {row.body && <p>{row.body}</p>}
        {row.author_name && <small>{row.author_name}</small>}
      </article>)}</div>
      : <p className="gd-muted">No events or announcements have been published for this game yet.</p>}
  </section>;
}

export function GameAbout({ game }) {
  const about = game.about_game || game.description || '';
  const history = game.development_history || '';
  const message = game.developer_message || '';
  return <section id="about-this-game" className="gd-restored-section">
    <div className="gd-section-heading"><div><span className="gd-eyebrow">From the creators</span><h2>About this game</h2><p>Developer-authored information, project background, and feature highlights.</p></div><Building2 size={24}/></div>
    <div className="gd-about-restored-grid">
      <div>
        <div className="gd-description">{about ? about.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p>The developer has not published an About This Game description yet.</p>}</div>
        {Array.isArray(game.features) && game.features.length > 0 && <ul className="gd-feature-list">{game.features.filter(Boolean).map(feature => <li key={feature}><ChevronRight size={14}/>{feature}</li>)}</ul>}
      </div>
      <aside>
        <span className="gd-eyebrow">Development history</span>
        <div className="gd-description">{history ? history.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p>No development history has been published yet.</p>}</div>
        {message && <blockquote>{message}</blockquote>}
      </aside>
    </div>
  </section>;
}

export function GameRequirementsSection({ game }) {
  const groups = requirementGroups(game);
  return <section id="game-requirements" className="gd-restored-section">
    <div className="gd-section-heading"><div><span className="gd-eyebrow">PC & platform setup</span><h2>System requirements</h2><p>Specifications provided for this game.</p></div><Cpu size={24}/></div>
    {groups.length ? <div className="gd-requirements">{groups.map(group => <section key={group.title}><h3>{group.title}</h3><dl>{group.rows.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl></section>)}</div>
      : <div className="gd-empty"><Cpu size={28}/><h3>Requirements haven't been published yet.</h3><p>Hardware and platform requirements will appear when the developer publishes them.</p></div>}
  </section>;
}

export function GameComments({ game }) {
  const { user, isAuthenticated, login } = useAuth();
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    base44.entities.Post.filter({ type: 'game_discussion', game_title: game.title }, '-created_date', 100)
      .then(rows => { if (!cancelled) setComments((rows || []).filter(row => !['removed', 'archived'].includes(row.status))); })
      .catch(() => { if (!cancelled) setError('Comments could not be loaded.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [game.title, retry]);

  const submit = async event => {
    event.preventDefault();
    if (!isAuthenticated) { login(); return; }
    if (!draft.trim() || saving) return;
    setSaving(true); setError('');
    try {
      const row = await base44.entities.Post.create({
        title: 'Comment: ' + game.title,
        content: draft.trim(),
        type: 'game_discussion',
        community: 'discussions',
        game_title: game.title,
        genre: game.genre,
        user_id: user.id,
        author_name: user.full_name || user.username || 'Player',
        status: 'published',
      });
      setComments(current => [row, ...current]);
      setDraft('');
    } catch {
      setError('Your comment could not be posted. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return <section id="game-comments" className="gd-restored-section gd-comments">
    <div className="gd-section-heading"><div><span className="gd-eyebrow">Community</span><h2>Comments</h2><p>Talk about the game without turning every post into a formal review.</p></div><MessageSquare size={24}/></div>
    <form className="gd-comment-form" onSubmit={submit}>
      <textarea value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000} rows={3} placeholder="Join the conversation…" disabled={saving} />
      <button type="submit" className="gd-secondary-button gd-button-fit" disabled={saving || !draft.trim()}><Send size={14}/>{saving ? 'Posting…' : 'Post comment'}</button>
    </form>
    {error && <div className="gd-inline-error" role="alert">{error} <button className="gd-text-button" onClick={() => setRetry(value => value + 1)}>Try again</button></div>}
    {loading ? <p className="gd-muted" role="status">Loading comments…</p>
      : comments.length ? <div className="gd-comment-list">{comments.slice(0, 20).map(comment => <article key={comment.id}>
        <div><strong>{comment.author_name || 'Player'}</strong>{comment.created_date && <time>{dateLabel(comment.created_date)}</time>}</div>
        <p>{comment.content}</p>
      </article>)}</div>
      : !error && <p className="gd-muted">No comments yet.</p>}
  </section>;
}

export default function GameStoreOverviewSections({ game }) {
  return <>
    <GameIdentityFacts game={game} />
    <GameScreenshots game={game} />
    <GameAnnouncements game={game} />
    <GameAbout game={game} />
    <GameRequirementsSection game={game} />
    <GameComments game={game} />
  </>;
}
