import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDown, ArrowLeft, ArrowUp, BookOpen, CheckCircle2, Clock3,
  Eye, Flag, Flame, Gamepad2, Home, Lock, MessageSquare, Plus, Search, Shield,
  Sparkles, Trophy, UserRoundCog, Wheat,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import PostComposer from '@/components/community/PostComposer';
import PostCard from '@/components/community/PostCard';
import CommentSection from '@/components/community/CommentSection';
import ForumBottomNav from '@/components/community/ForumBottomNav';
import ForumDirectoryOverlay from '@/components/community/ForumDirectoryOverlay';
import '@/components/community/forumHub.css';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import { useSidebarVisible } from '@/hooks/useSidebarVisible';
import { useAuth } from '@/components/auth/AuthContext';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

const unwrap = (result) => result?.data ?? result ?? {};
const artFor = (game) => game?.cover_image || game?.banner_image || game?.image || game?.thumbnail || '';
const postLabel = (post) => {
  if (post.community === 'guide') return 'Guide';
  if (post.community === 'achievements') return 'Achievement';
  if (post.community === 'farming') return 'Farming';
  if (post.community === 'tips') return 'Tip';
  return 'Discussion';
};
const timeAgo = (value) => {
  const when = new Date(value || Date.now()).getTime();
  const delta = Math.max(0, Date.now() - when);
  const mins = Math.floor(delta / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(value).toLocaleDateString();
};

const FEED_MODES = [
  { id: 'home', label: 'Home', hint: 'For you', icon: Home },
  { id: 'popular', label: 'Popular', hint: 'Most active', icon: Flame },
  { id: 'new', label: 'New', hint: 'Latest posts', icon: Clock3 },
  { id: 'guides', label: 'Guides', hint: 'Player knowledge', icon: BookOpen },
  { id: 'achievements', label: 'Achievements', hint: 'Hunts & unlocks', icon: Trophy },
];

function ForumPostRow({ item, currentUser, isModerator, onOpen, onVote, onReport, onDelete, onModerate }) {
  const { post } = item;
  const ownPost = Boolean(currentUser && (
    String(post.user_id || '') === String(currentUser.id) ||
    (!post.user_id && post.created_by === currentUser.email)
  ));
  const myVote = item.reactions.find((reaction) => String(reaction.user_id) === String(currentUser?.id))?.emoji;

  return <article className="forum-feed-post">
    <div className="forum-vote-rail" aria-label="Post score">
      <button
        type="button"
        className={myVote === '👍' ? 'is-active' : ''}
        onClick={() => onVote(post, '👍')}
        aria-label="Upvote"
      ><ArrowUp size={17} /></button>
      <strong className={item.score < 0 ? 'is-negative' : ''}>{item.score}</strong>
      <button
        type="button"
        className={myVote === '👎' ? 'is-down-active' : ''}
        onClick={() => onVote(post, '👎')}
        aria-label="Downvote"
      ><ArrowDown size={17} /></button>
    </div>

    <div className="forum-post-main">
      <div className="forum-post-meta">
        <span className="forum-community-dot" />
        <button type="button" onClick={() => onOpen(post)}>{post.game_title || 'Atom X Eve'}</button>
        <span>·</span>
        <span>{postLabel(post)}</span>
        <span>·</span>
        <span>Posted by {post.author_name || post.created_by?.split('@')?.[0] || 'Player'}</span>
        <span>{timeAgo(post.created_date)}</span>
        {post.is_pinned && <span className="forum-state-tag">Pinned</span>}
        {post.is_locked && <span className="forum-state-tag"><Lock size={10} />Locked</span>}
      </div>

      <button type="button" className="forum-post-open" onClick={() => onOpen(post)}>
        <h2>{post.title}</h2>
        <p>{post.content}</p>
        {post.image_url && <img src={post.image_url} alt="" loading="lazy" />}
      </button>

      <div className="forum-post-actions">
        <button type="button" onClick={() => onOpen(post)}><MessageSquare size={15} />{item.commentCount} comments</button>
        <span><Eye size={14} />{Number(post.view_count || 0)} views</span>
        <span><Sparkles size={14} />{item.reactionCount} reactions</span>
        {post.tags?.slice(0, 3).map((tag) => <span key={tag} className="forum-tag">#{tag}</span>)}
        <div className="forum-post-ops">
          {!ownPost && <button type="button" onClick={() => onReport('post', post.id)} title="Report"><Flag size={14} /></button>}
          {(ownPost || isModerator) && <button type="button" onClick={() => onDelete(post)}>Delete</button>}
          {isModerator && <button type="button" onClick={() => onModerate(post, post.is_pinned ? 'unpin' : 'pin')}>{post.is_pinned ? 'Unpin' : 'Pin'}</button>}
        </div>
      </div>
    </div>
  </article>;
}

function FeedModeStrip({ value, onChange }) {
  return <nav className="forum-feed-modes" aria-label="Feed type">
    {FEED_MODES.map((mode) => {
      const Icon = mode.icon;
      return <button
        type="button"
        key={mode.id}
        className={value === mode.id ? 'is-active' : ''}
        onClick={() => onChange(mode.id)}
      >
        <span className="forum-feed-mode-icon"><Icon size={17} /></span>
        <span><strong>{mode.label}</strong><small>{mode.hint}</small></span>
      </button>;
    })}
  </nav>;
}

export default function CommunityPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarVisible, toggleSidebar] = useSidebarVisible();
  const [games, setGames] = useState([]);
  const [activeGame, setActiveGame] = useState(location.state?.selectedGame || null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState('home');
  const [feedMode, setFeedMode] = useState('home');
  const [feedQuery, setFeedQuery] = useState('');
  const [session, setSession] = useState({ isModerator: false, isAdmin: false, restriction: null });
  const [reports, setReports] = useState([]);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [moderatorUserId, setModeratorUserId] = useState('');

  const invoke = useCallback(async (action, data = {}) => {
    const result = unwrap(await base44.functions.invoke('forumSystem', { action, data }));
    if (result?.success === false) throw new Error(result.error || 'Forum request failed');
    return result;
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setSession({ isModerator: false, isAdmin: false, restriction: null });
      return;
    }
    invoke('session').then(setSession).catch((error) => console.warn('Forum session unavailable', error));
  }, [invoke, isAuthenticated, user?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let list;
        try { list = await base44.entities.Game.list('-original_year', 1000); }
        catch (_) { list = await base44.entities.Game.list('-original_year', 250); }
        if (!cancelled) setGames(list || []);
      } catch (error) { console.error('Failed to load forum games', error); }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const gameTitle = new URLSearchParams(location.search).get('game');
    if (!gameTitle || !games.length) return;
    const match = games.find((game) => String(game.title).toLowerCase() === gameTitle.toLowerCase());
    if (match) setActiveGame(match);
  }, [games, location.search]);

  useEffect(() => {
    if (!activeGame) return;
    try {
      const stored = JSON.parse(localStorage.getItem('recent_forum_games') || '[]');
      const next = [{ id: activeGame.id, name: activeGame.title, image: artFor(activeGame) }, ...stored.filter((item) => item.name !== activeGame.title)].slice(0, 8);
      localStorage.setItem('recent_forum_games', JSON.stringify(next));
      window.dispatchEvent(new Event('recentForumGamesUpdated'));
    } catch (error) { console.warn('Could not save recent forum game', error); }
  }, [activeGame]);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const filter = { is_farm_hub: { $ne: true } };
      if (activeGame?.title) filter.game_title = activeGame.title;
      const [postRows, reactionRows, commentRows] = await Promise.all([
        base44.entities.Post.filter(filter, '-created_date', 180),
        base44.entities.ForumReaction.list('-created_date', 1800).catch(() => []),
        base44.entities.Comment.filter({ target_type: 'post' }, '-created_date', 1800).catch(() => []),
      ]);
      setPosts((postRows || []).filter((post) => post.status !== 'removed'));
      setReactions(reactionRows || []);
      setComments(commentRows || []);
    } catch (error) { showError(error, 'Load Forum'); }
    finally { setLoading(false); }
  }, [activeGame?.title]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const gameMap = useMemo(() => new Map(games.map((game) => [String(game.title || '').toLowerCase(), game])), [games]);
  const enriched = useMemo(() => posts.map((post) => {
    const postComments = comments.filter((item) => item.target_type === 'post' && item.target_id === post.id);
    const postReactions = reactions.filter((item) => item.target_type === 'post' && item.target_id === post.id);
    const latestComment = postComments.reduce((latest, item) => Math.max(latest, new Date(item.created_date || 0).getTime()), 0);
    const created = new Date(post.created_date || 0).getTime();
    const lastActivity = Math.max(created, latestComment);
    const commentCount = postComments.length;
    const reactionCount = postReactions.length;
    const upVotes = postReactions.filter((item) => item.emoji === '👍').length;
    const downVotes = postReactions.filter((item) => item.emoji === '👎').length;
    const score = upVotes - downVotes;
    const views = Number(post.view_count || 0);
    const recencyHours = Math.max(1, (Date.now() - lastActivity) / 3600000);
    const heat = commentCount * 9 + reactionCount * 5 + Math.log2(views + 1) * 7 + (post.is_pinned ? 18 : 0) + Math.max(0, 36 - recencyHours) * .7;
    const game = gameMap.get(String(post.game_title || '').toLowerCase());
    return { post, comments: postComments, reactions: postReactions, commentCount, reactionCount, upVotes, downVotes, score, lastActivity, heat, art: artFor(game), game };
  }), [posts, comments, reactions, gameMap]);

  const feedRows = useMemo(() => {
    const q = feedQuery.trim().toLowerCase();
    let rows = enriched.filter((item) => {
      const post = item.post;
      if (feedMode === 'guides' && !['guide', 'tips'].includes(post.community) && !String(post.type || '').includes('guide')) return false;
      if (feedMode === 'achievements' && post.community !== 'achievements') return false;
      if (!q) return true;
      return [post.title, post.content, post.game_title, post.author_name, ...(post.tags || [])]
        .some((value) => String(value || '').toLowerCase().includes(q));
    });

    if (feedMode === 'new') rows = [...rows].sort((a, b) => new Date(b.post.created_date || 0) - new Date(a.post.created_date || 0));
    else if (feedMode === 'popular') rows = [...rows].sort((a, b) => b.heat - a.heat);
    else if (feedMode === 'guides' || feedMode === 'achievements') rows = [...rows].sort((a, b) => b.lastActivity - a.lastActivity);
    else rows = [...rows].sort((a, b) => (Number(b.post.is_pinned) - Number(a.post.is_pinned)) || (b.lastActivity - a.lastActivity));
    return rows;
  }, [enriched, feedMode, feedQuery]);

  const communityStats = useMemo(() => {
    const map = new Map();
    enriched.forEach((item) => {
      const name = item.post.game_title || 'Atom X Eve';
      const key = name.toLowerCase();
      const previous = map.get(key) || { name, game: gameMap.get(key), posts: 0, activity: 0 };
      previous.posts += 1;
      previous.activity += item.commentCount + item.reactionCount;
      map.set(key, previous);
    });
    return [...map.values()].sort((a, b) => (b.posts + b.activity) - (a.posts + a.activity)).slice(0, 7);
  }, [enriched, gameMap]);

  const selectedComments = useMemo(() => selectedPost ? comments.filter((comment) => comment.target_id === selectedPost.id && comment.target_type === 'post') : [], [comments, selectedPost]);
  const selectedPostReactions = useMemo(() => selectedPost ? reactions.filter((reaction) => reaction.target_type === 'post' && reaction.target_id === selectedPost.id) : [], [reactions, selectedPost]);

  const requireAuth = () => {
    if (isAuthenticated && user?.id) return true;
    showError('Please sign in to participate in the forum.');
    return false;
  };

  const createPost = async (data) => {
    if (!requireAuth()) return;
    try { await invoke('create_post', data); setComposerOpen(false); await loadFeed(); showSuccess('Published to the Forum.'); }
    catch (error) { showError(error, 'Publish Post'); }
  };

  const selectPost = async (post) => {
    setSelectedPost(post);
    try { await invoke('view_post', { post_id: post.id }); } catch (_) {}
  };

  const deletePost = async (post) => {
    if (!requireAuth() || !window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    try { await invoke('delete_post', { post_id: post.id }); if (selectedPost?.id === post.id) setSelectedPost(null); await loadFeed(); showSuccess('Post deleted.'); }
    catch (error) { showError(error, 'Delete Post'); }
  };

  const addComment = async ({ content, parent_comment_id }) => {
    if (!requireAuth() || !selectedPost) return;
    try { await invoke('add_comment', { post_id: selectedPost.id, content, parent_comment_id }); await loadFeed(); }
    catch (error) { showError(error, 'Add Comment'); }
  };

  const deleteComment = async (comment) => {
    if (!requireAuth() || !window.confirm('Delete this comment?')) return;
    try { await invoke('delete_comment', { comment_id: comment.id }); await loadFeed(); }
    catch (error) { showError(error, 'Delete Comment'); }
  };

  const react = async (targetType, targetId, emoji) => {
    if (!requireAuth()) return;
    try {
      await invoke('toggle_reaction', { target_type: targetType, target_id: targetId, emoji });
      setReactions(await base44.entities.ForumReaction.list('-created_date', 1800) || []);
    } catch (error) { showError(error, 'Reaction'); }
  };

  const report = async (targetType, targetId) => {
    if (!requireAuth()) return;
    try { await invoke('report', { target_type: targetType, target_id: targetId, reason: 'other', details: 'Submitted from Forum.' }); showSuccess('Report sent to moderators.'); }
    catch (error) { showError(error, 'Report'); }
  };

  const moderatePost = async (post, operation) => {
    try {
      await invoke('moderate_post', { post_id: post.id, operation });
      await loadFeed();
      if (selectedPost?.id === post.id) setSelectedPost((current) => ({ ...current, is_pinned: operation === 'pin' ? true : operation === 'unpin' ? false : current.is_pinned, is_locked: operation === 'lock' ? true : operation === 'unlock' ? false : current.is_locked }));
    } catch (error) { showError(error, 'Moderate Post'); }
  };

  const loadReports = useCallback(async () => {
    if (!session.isModerator) { setReports([]); return; }
    try { setReports(await base44.entities.ForumReport.filter({ status: 'open' }, '-created_date', 100)); }
    catch (error) { console.warn('Could not load forum reports', error); }
  }, [session.isModerator]);
  useEffect(() => { if (moderationOpen) loadReports(); }, [moderationOpen, loadReports]);

  const muteSelectedAuthor = async () => {
    if (!selectedPost?.user_id) { showError('This legacy post has no stable author ID to restrict.'); return; }
    try { await invoke('restrict_user', { user_id: selectedPost.user_id, type: 'mute', duration_hours: 24, reason: 'Moderator action from Forum' }); showSuccess(`${selectedPost.author_name || 'User'} muted for 24 hours.`); }
    catch (error) { showError(error, 'Mute User'); }
  };

  const resolveReport = async (reportId, status = 'resolved') => {
    try { await invoke('resolve_report', { report_id: reportId, status, resolution: status === 'dismissed' ? 'Dismissed in moderation queue.' : 'Reviewed and resolved.' }); await loadReports(); }
    catch (error) { showError(error, 'Resolve Report'); }
  };

  const appointModerator = async () => {
    if (!moderatorUserId.trim()) return;
    try { await invoke('assign_moderator', { user_id: moderatorUserId.trim(), role: 'moderator' }); setModeratorUserId(''); showSuccess('Moderator appointed.'); }
    catch (error) { showError(error, 'Appoint Moderator'); }
  };

  const selectForum = (game) => {
    setActiveGame(game || null);
    setSelectedPost(null);
    setDirectoryOpen(false);
    setFeedMode('home');
    setBottomTab('home');
  };

  const changeFeedMode = (mode) => {
    setFeedMode(mode);
    setBottomTab(mode === 'new' ? 'recent' : mode === 'popular' ? 'heated' : 'home');
    document.querySelector('.forum-shell')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBottomTab = (tab) => {
    setBottomTab(tab);
    changeFeedMode(tab === 'recent' ? 'new' : tab === 'heated' ? 'popular' : 'home');
  };

  return <PageErrorBoundary pageName="Community">
    <GlassPageFrame
      sidebarVisible={sidebarVisible}
      onSidebarToggle={toggleSidebar}
      bottomContent={<ForumBottomNav activeTab={bottomTab} onBrowseForums={() => setDirectoryOpen(true)} onTabSelect={handleBottomTab} />}
    >
      <div className={`forum-hub forum-mode-${feedMode} relative h-screen w-full overflow-hidden text-white`}>
        <div className="forum-ambient" aria-hidden="true" />
        <div className="forum-shell">
          <header className="forum-header">
            <div className="forum-brand-block">
              <div className="forum-mark"><MessageSquare size={16} /></div>
              <div>
                <div className="forum-eyebrow">Atom X Eve Community</div>
                <h1>{activeGame?.title || 'Forum'}</h1>
              </div>
            </div>

            <label className="forum-top-search">
              <Search size={15} />
              <input value={feedQuery} onChange={(event) => setFeedQuery(event.target.value)} placeholder="Search this feed" />
            </label>

            <div className="forum-header-actions">
              {session.isModerator && <button type="button" className="forum-icon-action" onClick={() => setModerationOpen((value) => !value)} title="Moderation"><Shield size={16} /></button>}
              <button type="button" className="forum-new-post" onClick={() => requireAuth() && setComposerOpen(true)}><Plus size={16} />Create</button>
            </div>
          </header>

          {selectedPost ? <main className="forum-content forum-detail">
            <div className="forum-detail-toolbar">
              <button type="button" className="forum-detail-back" onClick={() => setSelectedPost(null)}><ArrowLeft size={14} />Back to feed</button>
              {session.isModerator && <button onClick={muteSelectedAuthor} className="forum-muted-action">Mute author 24h</button>}
            </div>
            <PostCard
              post={selectedPost}
              isDetailView
              currentUser={user}
              isModerator={session.isModerator}
              reactions={selectedPostReactions}
              commentCount={selectedComments.length}
              onReact={(post, emoji) => react('post', post.id, emoji)}
              onDelete={deletePost}
              onReport={report}
              onModerate={moderatePost}
            />
            <div className="forum-comments-wrap"><CommentSection post={selectedPost} comments={selectedComments} reactions={reactions} currentUser={user} isModerator={session.isModerator} onAddComment={addComment} onDelete={deleteComment} onReact={react} onReport={report} /></div>
          </main> : <main className="forum-content">
            <FeedModeStrip value={feedMode} onChange={changeFeedMode} />

            {activeGame && <div className="forum-context">
              <div><Gamepad2 size={14} /><span>Viewing <strong>{activeGame.title}</strong></span></div>
              <button type="button" onClick={() => selectForum(null)}>All communities</button>
            </div>}

            <div className="forum-main-grid">
              <section className="forum-feed-column" aria-label="Forum feed">
                <div className="forum-compose-bar">
                  <div className="forum-avatar-dot">{String(user?.username || user?.display_name || user?.email || 'P').charAt(0).toUpperCase()}</div>
                  <button type="button" onClick={() => requireAuth() && setComposerOpen(true)}>Share something with {activeGame?.title || 'the community'}…</button>
                  <button type="button" className="forum-compose-plus" onClick={() => requireAuth() && setComposerOpen(true)}><Plus size={17} /></button>
                </div>

                <div className="forum-feed-head">
                  <div>
                    <strong>{FEED_MODES.find((mode) => mode.id === feedMode)?.label || 'Home'} feed</strong>
                    <span>{feedRows.length} {feedRows.length === 1 ? 'post' : 'posts'}</span>
                  </div>
                  {session.restriction && <span className="forum-restriction">{session.restriction.type} active</span>}
                </div>

                {loading ? <div className="forum-feed-loading">
                  <Activity size={22} />
                  <span>Loading community activity…</span>
                </div> : feedRows.length ? <div className="forum-feed-list">
                  {feedRows.map((item) => <ForumPostRow
                    key={item.post.id}
                    item={item}
                    currentUser={user}
                    isModerator={session.isModerator}
                    onOpen={selectPost}
                    onVote={(post, emoji) => react('post', post.id, emoji)}
                    onReport={report}
                    onDelete={deletePost}
                    onModerate={moderatePost}
                  />)}
                </div> : <div className="forum-empty">
                  <MessageSquare size={25} />
                  <h3>Nothing in this feed yet</h3>
                  <p>{feedQuery ? 'Try a different search or feed type.' : 'Start the first conversation here.'}</p>
                  {!feedQuery && <button type="button" onClick={() => requireAuth() && setComposerOpen(true)}>Create a post</button>}
                </div>}
              </section>

              <aside className="forum-side-column">
                <section className="forum-side-card forum-about-card">
                  <div className="forum-side-card-head"><span>Community</span><Gamepad2 size={14} /></div>
                  <h2>{activeGame?.title || 'Atom X Eve Forum'}</h2>
                  <p>{activeGame ? `Discuss builds, achievements, guides and player discoveries for ${activeGame.title}.` : 'One place for game discussion, guides, achievement hunts and player knowledge across Atom X Eve.'}</p>
                  <div className="forum-side-stats">
                    <div><strong>{posts.length}</strong><span>Posts</span></div>
                    <div><strong>{comments.length}</strong><span>Replies</span></div>
                    <div><strong>{reactions.length}</strong><span>Reactions</span></div>
                  </div>
                  <button type="button" className="forum-side-primary" onClick={() => requireAuth() && setComposerOpen(true)}>Create post</button>
                </section>

                <section className="forum-side-card">
                  <div className="forum-side-card-head"><span>Active communities</span><Sparkles size={14} /></div>
                  <div className="forum-community-list">
                    {communityStats.map((community, index) => <button key={community.name} type="button" onClick={() => community.game ? selectForum(community.game) : selectForum(null)}>
                      <span className="forum-community-rank">{index + 1}</span>
                      <span className="forum-community-art">{artFor(community.game) ? <img src={artFor(community.game)} alt="" /> : <Gamepad2 size={15} />}</span>
                      <span className="forum-community-copy"><strong>{community.name}</strong><small>{community.posts} posts · {community.activity} interactions</small></span>
                    </button>)}
                    {!communityStats.length && <p className="forum-side-empty">Communities will appear as conversations become active.</p>}
                  </div>
                  <button type="button" className="forum-side-link" onClick={() => setDirectoryOpen(true)}>Browse all forums</button>
                </section>

                <section className="forum-side-card forum-utility-card">
                  <button type="button" onClick={() => navigate(createPageUrl('Farm'))}><Wheat size={15} /><span><strong>Farm Hub</strong><small>Farming routes, drops and resource discussion</small></span></button>
                  {session.isModerator && <button type="button" onClick={() => setModerationOpen(true)}><Shield size={15} /><span><strong>Moderation</strong><small>Review reports and community actions</small></span></button>}
                </section>
              </aside>
            </div>
          </main>}
        </div>

        <ForumDirectoryOverlay open={directoryOpen} games={games} activeGame={activeGame} onClose={() => setDirectoryOpen(false)} onSelectGame={selectForum} />

        {moderationOpen && session.isModerator && <div className="forum-moderation-panel">
          <div className="forum-moderation-head"><div><div className="forum-eyebrow">Operations</div><h3>Moderation queue</h3></div><button onClick={() => setModerationOpen(false)}>Close</button></div>
          {session.isAdmin && <div className="forum-appoint-mod"><div><UserRoundCog size={14} />Appoint moderator</div><div><input value={moderatorUserId} onChange={(event) => setModeratorUserId(event.target.value)} placeholder="User ID" /><button onClick={appointModerator}>Add</button></div></div>}
          <div className="forum-report-list">{reports.map((item) => <div key={item.id} className="forum-report-item"><div><Flag size={12} />{item.target_type} · {item.reason}</div><p>{item.target_id}</p><div><button onClick={() => resolveReport(item.id)}><CheckCircle2 size={12} />Resolve</button><button onClick={() => resolveReport(item.id, 'dismissed')}>Dismiss</button></div></div>)}{!reports.length && <p className="forum-no-reports">No open reports.</p>}</div>
        </div>}

        <PostComposer isOpen={composerOpen} onCancel={() => setComposerOpen(false)} onSubmit={createPost} games={games} initialGame={activeGame} />
      </div>
    </GlassPageFrame>
  </PageErrorBoundary>;
}
