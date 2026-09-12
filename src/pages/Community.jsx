import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowLeft, CheckCircle2, Clock3, Eye, Flag, Flame,
  Gamepad2, MessageSquare, Plus, Shield, Sparkles, UserRoundCog, Wheat,
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
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
};

function TopicCard({ item, onOpen }) {
  return <button type="button" className="forum-topic-card" onClick={() => onOpen(item.post)}>
    <div className="forum-topic-art">{item.art && <img src={item.art} alt="" />}</div>
    <div className="forum-topic-fade" />
    <div className="forum-topic-body">
      <div className="forum-topic-meta">
        <span>{item.post.game_title || 'Platform'}</span>
        <span>·</span>
        <span>{postLabel(item.post)}</span>
        {item.commentCount >= 8 && <><span>·</span><span className="hot">Heated</span></>}
      </div>
      <h3 className="forum-topic-title">{item.post.title}</h3>
      <p className="forum-topic-excerpt">{item.post.content}</p>
      <div className="forum-topic-stats">
        <span><MessageSquare size={12} />{item.commentCount}</span>
        <span><Eye size={12} />{Number(item.post.view_count || 0)}</span>
        <span><Sparkles size={12} />{item.reactionCount}</span>
        <span className="activity"><Activity size={12} />{timeAgo(item.lastActivity)}</span>
      </div>
    </div>
  </button>;
}

function ActivityRow({ item, onOpen }) {
  return <button type="button" className="forum-activity-row" onClick={() => onOpen(item.post)}>
    <div className="min-w-0">
      <h3>{item.post.title}</h3>
      <p>{item.post.game_title || 'Platform-wide'} · {postLabel(item.post)} · {item.post.author_name || item.post.created_by?.split('@')?.[0] || 'Player'}</p>
    </div>
    <div className="forum-activity-meta">
      <span><MessageSquare size={12} /><strong>{item.commentCount}</strong></span>
      <span><Eye size={12} />{Number(item.post.view_count || 0)}</span>
      <span><Clock3 size={12} />{timeAgo(item.lastActivity)}</span>
    </div>
  </button>;
}

function HeatedCard({ item, onOpen }) {
  return <button type="button" className="forum-heated-card" onClick={() => onOpen(item.post)}>
    <div className="forum-heated-top"><span>Heated discussion</span><Flame size={13} /></div>
    <h3>{item.post.title}</h3>
    <p>{item.post.content}</p>
    <div className="forum-heated-foot">
      <span><MessageSquare size={12} />{item.commentCount} replies</span>
      <span><Sparkles size={12} />{item.reactionCount}</span>
      <span><Clock3 size={12} />{timeAgo(item.lastActivity)}</span>
    </div>
  </button>;
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
    const views = Number(post.view_count || 0);
    const recencyHours = Math.max(1, (Date.now() - lastActivity) / 3600000);
    const heat = commentCount * 9 + reactionCount * 5 + Math.log2(views + 1) * 7 + (post.is_pinned ? 18 : 0) + Math.max(0, 36 - recencyHours) * .7;
    const heated = commentCount * 13 + reactionCount * 4 + Math.log2(views + 1) * 3 + Math.max(0, 24 - recencyHours);
    const game = gameMap.get(String(post.game_title || '').toLowerCase());
    return { post, comments: postComments, reactions: postReactions, commentCount, reactionCount, lastActivity, heat, heated, art: artFor(game) };
  }), [posts, comments, reactions, gameMap]);

  const hotTopics = useMemo(() => [...enriched].sort((a, b) => b.heat - a.heat).slice(0, 3), [enriched]);
  const recentTopics = useMemo(() => [...enriched].sort((a, b) => b.lastActivity - a.lastActivity).slice(0, 14), [enriched]);
  const heatedTopics = useMemo(() => [...enriched].filter((item) => item.commentCount > 0).sort((a, b) => b.heated - a.heated).slice(0, 10), [enriched]);

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
    setBottomTab('home');
  };

  const handleBottomTab = (tab) => {
    setBottomTab(tab);
    if (tab === 'home') {
      document.querySelector('.forum-shell')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    requestAnimationFrame(() => document.getElementById(tab === 'recent' ? 'forum-recent' : 'forum-heated')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return <PageErrorBoundary pageName="Community">
    <GlassPageFrame
      sidebarVisible={sidebarVisible}
      onSidebarToggle={toggleSidebar}
      bottomContent={<ForumBottomNav activeTab={bottomTab} onBrowseForums={() => setDirectoryOpen(true)} onTabSelect={handleBottomTab} />}
    >
      <div className="forum-hub relative h-screen w-full overflow-hidden bg-[#020617] text-white">
        <div className="forum-shell">
          <header className="forum-header">
            <div className="forum-header-copy">
              <div className="forum-eyebrow">Community conversations</div>
              <h1>Forum <span>/ {activeGame?.title || 'All Communities'}</span></h1>
            </div>
            <div className="forum-header-actions">
              {session.restriction && <span className="hidden text-[10px] text-amber-100/55 lg:inline">{session.restriction.type} active</span>}
              <button type="button" className="forum-glass-button" onClick={() => navigate(createPageUrl('Farm'))}><Wheat size={14} />Farm Hub</button>
              {session.isModerator && <button type="button" className="forum-glass-button" onClick={() => setModerationOpen((value) => !value)}><Shield size={14} />Moderation</button>}
              <button type="button" className="forum-glass-button primary" onClick={() => requireAuth() && setComposerOpen(true)}><Plus size={15} />New Topic</button>
            </div>
          </header>

          {selectedPost ? <main className="forum-content forum-detail">
            <div className="flex items-center gap-3">
              <button type="button" className="forum-detail-back" onClick={() => setSelectedPost(null)}><ArrowLeft size={14} />Back to discussions</button>
              {session.isModerator && <button onClick={muteSelectedAuthor} className="ml-auto rounded-full bg-amber-300/[0.06] px-3 py-1.5 text-[10px] text-amber-100/55">Mute author 24h</button>}
            </div>
            <PostCard post={selectedPost} isDetailView currentUser={user} isModerator={session.isModerator} reactions={selectedPostReactions} commentCount={selectedComments.length} onReact={(post, emoji) => react('post', post.id, emoji)} onDelete={deletePost} onReport={report} onModerate={moderatePost} />
            <div className="mt-4"><CommentSection post={selectedPost} comments={selectedComments} reactions={reactions} currentUser={user} isModerator={session.isModerator} onAddComment={addComment} onDelete={deleteComment} onReact={react} onReport={report} /></div>
          </main> : <main className="forum-content">
            {activeGame && <div className="forum-context"><Gamepad2 size={13} /><span>You are viewing the {activeGame.title} forum.</span><button type="button" onClick={() => selectForum(null)}>Return to all communities</button></div>}

            {loading ? <div className="forum-empty"><Activity size={27} /><h3>Loading conversations</h3><p>Gathering the latest activity from the community.</p></div> : <>
              <section className="forum-section" id="forum-hot">
                <div className="forum-section-head"><div><div className="forum-section-kicker"><Sparkles size={12} />Trending now</div><h2>Hot topics</h2><p>The discussions getting the strongest mix of replies, reactions and attention.</p></div><span className="forum-section-count">{hotTopics.length} active</span></div>
                {hotTopics.length ? <div className="forum-hot-grid">{hotTopics.map((item) => <TopicCard key={item.post.id} item={item} onOpen={selectPost} />)}</div> : <div className="forum-empty"><MessageSquare size={26} /><h3>No hot topics yet</h3><p>Start a conversation and it can surface here as players join in.</p></div>}
              </section>

              <section className="forum-section" id="forum-recent">
                <div className="forum-section-head"><div><div className="forum-section-kicker"><Clock3 size={12} />Live activity</div><h2>Recently commented</h2><p>Threads ordered by the latest reply, not by when the original post was created.</p></div><span className="forum-section-count">{recentTopics.length} shown</span></div>
                {recentTopics.length ? <div className="forum-activity-list">{recentTopics.map((item) => <ActivityRow key={item.post.id} item={item} onOpen={selectPost} />)}</div> : <div className="forum-empty"><Clock3 size={26} /><h3>No recent activity</h3><p>New replies and fresh topics will appear here.</p></div>}
              </section>

              <section className="forum-section" id="forum-heated">
                <div className="forum-section-head"><div><div className="forum-section-kicker"><Flame size={12} />High-engagement threads</div><h2>Heated discussions</h2><p>Debates and fast-moving conversations with the most back-and-forth.</p></div><span className="forum-section-count">{heatedTopics.length} active</span></div>
                {heatedTopics.length ? <div className="forum-heated-rail">{heatedTopics.map((item) => <HeatedCard key={item.post.id} item={item} onOpen={selectPost} />)}</div> : <div className="forum-empty"><Flame size={26} /><h3>Nothing heated right now</h3><p>Fast-moving discussions will be surfaced automatically.</p></div>}
              </section>
            </>}
          </main>}
        </div>

        <ForumDirectoryOverlay open={directoryOpen} games={games} activeGame={activeGame} onClose={() => setDirectoryOpen(false)} onSelectGame={selectForum} />

        {moderationOpen && session.isModerator && <div className="absolute right-5 top-[146px] z-[60] max-h-[calc(100vh-220px)] w-[360px] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#06111b]/95 p-4 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between"><div><div className="forum-eyebrow">Operations</div><h3 className="mt-1 text-sm font-semibold text-white/80">Moderation queue</h3></div><button onClick={() => setModerationOpen(false)} className="text-xs text-white/35">Close</button></div>
          {session.isAdmin && <div className="mt-4 rounded-lg bg-white/[0.035] p-3"><div className="flex items-center gap-2 text-xs text-white/50"><UserRoundCog size={14} />Appoint moderator</div><div className="mt-2 flex gap-2"><input value={moderatorUserId} onChange={(e) => setModeratorUserId(e.target.value)} placeholder="User ID" className="h-8 min-w-0 flex-1 rounded border border-white/[0.07] bg-black/20 px-2 text-xs text-white outline-none" /><button onClick={appointModerator} className="rounded bg-cyan-300/10 px-3 text-xs text-cyan-100">Add</button></div></div>}
          <div className="mt-4 space-y-2">{reports.map((item) => <div key={item.id} className="rounded-lg bg-white/[0.025] p-3"><div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-amber-100/50"><Flag size={12} />{item.target_type} · {item.reason}</div><p className="mt-1 break-all text-xs text-white/35">{item.target_id}</p><div className="mt-3 flex gap-2"><button onClick={() => resolveReport(item.id)} className="flex items-center gap-1 rounded bg-cyan-300/10 px-2 py-1 text-[10px] text-cyan-100"><CheckCircle2 size={12} />Resolve</button><button onClick={() => resolveReport(item.id, 'dismissed')} className="rounded px-2 py-1 text-[10px] text-white/30 hover:bg-white/[0.04]">Dismiss</button></div></div>)}{!reports.length && <p className="py-5 text-center text-xs text-white/25">No open reports.</p>}</div>
        </div>}

        <PostComposer isOpen={composerOpen} onCancel={() => setComposerOpen(false)} onSubmit={createPost} games={games} initialGame={activeGame} />
      </div>
    </GlassPageFrame>
  </PageErrorBoundary>;
}
