import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, Flag, Gamepad2, Lightbulb, MessageSquare, Pin, Plus, Search, Shield, Trophy, UserRoundCog, Wheat } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import PostComposer from '@/components/community/PostComposer';
import PostCard from '@/components/community/PostCard';
import CommentSection from '@/components/community/CommentSection';
import ForumBottomNav from '@/components/community/ForumBottomNav';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import { useSidebarVisible } from '@/hooks/useSidebarVisible';
import { useAuth } from '@/components/auth/AuthContext';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

const SECTIONS = [
  { id: 'all', label: 'All', icon: Gamepad2 },
  { id: 'guide', label: 'Guides', icon: BookOpen },
  { id: 'achievement', label: 'Achievement Hunts', icon: Trophy },
  { id: 'farming', label: 'Farming', icon: Wheat },
  { id: 'tips', label: 'Tips', icon: Lightbulb },
  { id: 'discussion', label: 'Discussion', icon: MessageSquare },
];
const unwrap = (result) => result?.data ?? result ?? {};

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
  const [section, setSection] = useState('all');
  const [search, setSearch] = useState('');
  const [gameSearch, setGameSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [session, setSession] = useState({ isModerator: false, isAdmin: false, restriction: null });
  const [reports, setReports] = useState([]);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [moderatorUserId, setModeratorUserId] = useState('');

  const invoke = useCallback(async (action, data = {}) => {
    const result = unwrap(await base44.functions.invoke('forumSystem', { action, data }));
    if (result?.success === false) throw new Error(result.error || 'Forum request failed');
    return result;
  }, []);

  const loadSession = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setSession({ isModerator: false, isAdmin: false, restriction: null });
      return;
    }
    try { setSession(await invoke('session')); }
    catch (error) { console.warn('Forum session unavailable', error); }
  }, [invoke, isAuthenticated, user?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await base44.entities.Game.list('-original_year', 100);
        if (!cancelled) setGames(list || []);
      } catch (error) { console.error('Failed to load forum games', error); }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { loadSession(); }, [loadSession]);

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
      const next = [{ id: activeGame.id, name: activeGame.title, image: activeGame.cover_image || activeGame.banner_image || activeGame.image || '' }, ...stored.filter((item) => item.name !== activeGame.title)].slice(0, 6);
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
        base44.entities.Post.filter(filter, '-created_date', 120),
        base44.entities.ForumReaction.list('-created_date', 1200).catch(() => []),
        base44.entities.Comment.filter({ target_type: 'post' }, '-created_date', 1200).catch(() => []),
      ]);
      setPosts((postRows || []).filter((post) => post.status !== 'removed'));
      setReactions(reactionRows || []);
      setComments(commentRows || []);
    } catch (error) { showError(error, 'Load Forum'); }
    finally { setLoading(false); }
  }, [activeGame?.title]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const loadReports = useCallback(async () => {
    if (!session.isModerator) { setReports([]); return; }
    try { setReports(await base44.entities.ForumReport.filter({ status: 'open' }, '-created_date', 100)); }
    catch (error) { console.warn('Could not load forum reports', error); }
  }, [session.isModerator]);

  useEffect(() => { if (moderationOpen) loadReports(); }, [moderationOpen, loadReports]);

  const reactionCount = useCallback((postId) => reactions.filter((r) => r.target_type === 'post' && r.target_id === postId).length, [reactions]);
  const commentCount = useCallback((postId) => comments.filter((c) => c.target_id === postId && c.target_type === 'post').length, [comments]);

  const visiblePosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = posts.filter((post) => {
      if (section === 'guide' && !(post.community === 'guide' || ['guide', 'full_guide'].includes(post.type))) return false;
      if (section === 'achievement' && !(post.community === 'achievements' || String(post.type).includes('achievement'))) return false;
      if (section === 'farming' && !(post.community === 'farming' || post.type === 'farming_guide')) return false;
      if (section === 'tips' && !(post.community === 'tips' || post.type === 'tip')) return false;
      if (section === 'discussion' && !['discussion', 'game_discussion', 'general_discussion'].includes(post.type)) return false;
      if (!query) return true;
      return [post.title, post.content, post.game_title, ...(post.tags || [])].some((value) => String(value || '').toLowerCase().includes(query));
    });
    return [...rows].sort((a, b) => {
      if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) return a.is_pinned ? -1 : 1;
      if (sort === 'popular') {
        const aHeat = reactionCount(a.id) * 8 + commentCount(a.id) * 4 + Number(a.view_count || 0);
        const bHeat = reactionCount(b.id) * 8 + commentCount(b.id) * 4 + Number(b.view_count || 0);
        return bHeat - aHeat;
      }
      return new Date(b.created_date || 0) - new Date(a.created_date || 0);
    });
  }, [posts, search, section, sort, reactionCount, commentCount]);

  const filteredGames = useMemo(() => games.filter((game) => !gameSearch || game.title?.toLowerCase().includes(gameSearch.toLowerCase())).slice(0, 40), [games, gameSearch]);
  const guideDesk = useMemo(() => visiblePosts.filter((post) => post.is_pinned || post.community === 'guide' || ['full_guide', 'achievement_guide', 'farming_guide'].includes(post.type)).slice(0, 6), [visiblePosts]);
  const selectedComments = useMemo(() => selectedPost ? comments.filter((comment) => comment.target_id === selectedPost.id && comment.target_type === 'post') : [], [comments, selectedPost]);
  const selectedPostReactions = useMemo(() => selectedPost ? reactions.filter((reaction) => reaction.target_type === 'post' && reaction.target_id === selectedPost.id) : [], [reactions, selectedPost]);

  const requireAuth = () => {
    if (isAuthenticated && user?.id) return true;
    showError('Please sign in to participate in the forum.');
    return false;
  };

  const createPost = async (data) => {
    if (!requireAuth()) return;
    try { await invoke('create_post', data); setComposerOpen(false); await loadFeed(); showSuccess('Published to the Forum Hub.'); }
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
      setReactions(await base44.entities.ForumReaction.list('-created_date', 1200) || []);
    } catch (error) { showError(error, 'Reaction'); }
  };

  const report = async (targetType, targetId) => {
    if (!requireAuth()) return;
    try { await invoke('report', { target_type: targetType, target_id: targetId, reason: 'other', details: 'Submitted from Forum Hub.' }); showSuccess('Report sent to moderators.'); }
    catch (error) { showError(error, 'Report'); }
  };

  const moderatePost = async (post, operation) => {
    try {
      await invoke('moderate_post', { post_id: post.id, operation });
      await loadFeed();
      if (selectedPost?.id === post.id) setSelectedPost((current) => ({ ...current, is_pinned: operation === 'pin' ? true : operation === 'unpin' ? false : current.is_pinned, is_locked: operation === 'lock' ? true : operation === 'unlock' ? false : current.is_locked }));
    } catch (error) { showError(error, 'Moderate Post'); }
  };

  const muteSelectedAuthor = async () => {
    if (!selectedPost?.user_id) { showError('This legacy post has no stable author ID to restrict.'); return; }
    try { await invoke('restrict_user', { user_id: selectedPost.user_id, type: 'mute', duration_hours: 24, reason: 'Moderator action from Forum Hub' }); showSuccess(`${selectedPost.author_name || 'User'} muted for 24 hours.`); }
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

  const handleBottomTab = (tabId) => {
    if (tabId === 'hub') { setActiveGame(null); setSelectedPost(null); setSection('all'); }
    if (tabId === 'farm_hub') navigate(createPageUrl('Farm'));
  };

  return <PageErrorBoundary pageName="Community">
    <GlassPageFrame sidebarVisible={sidebarVisible} onSidebarToggle={toggleSidebar} bottomContent={<ForumBottomNav activeTab="hub" onTabSelect={handleBottomTab} />}>
      <div className="relative h-screen w-full overflow-hidden bg-[#060a10] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_38%_0%,rgba(56,189,248,0.07),transparent_30%),linear-gradient(180deg,#080d14_0%,#060a10_100%)]" />
        <div className="relative flex h-full flex-col pb-12 pt-16">
          <header className="flex h-[78px] shrink-0 items-center gap-4 border-b border-white/[0.06] px-5 lg:px-8">
            <div className="min-w-0"><p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-cyan-200/45">Player knowledge network</p><h1 className="truncate text-xl font-semibold text-white">Forum Hub <span className="font-normal text-white/30">/ {activeGame?.title || 'All Games'}</span></h1></div>
            <div className="ml-auto flex items-center gap-2">
              {session.restriction && <span className="hidden rounded-full border border-amber-300/15 bg-amber-300/[0.06] px-3 py-1.5 text-xs text-amber-100/70 md:block">{session.restriction.type} active</span>}
              {session.isModerator && <button type="button" onClick={() => setModerationOpen((value) => !value)} className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 text-xs text-white/55 hover:text-white"><Shield className="h-3.5 w-3.5" />Moderation</button>}
              <button type="button" onClick={() => requireAuth() && setComposerOpen(true)} className="flex h-9 items-center gap-2 rounded-lg border border-cyan-200/15 bg-cyan-300/10 px-3 text-xs font-semibold text-cyan-100"><Plus className="h-4 w-4" />Create</button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <aside className="hidden w-[230px] shrink-0 border-r border-white/[0.055] bg-black/10 p-4 lg:flex lg:flex-col">
              <div className="relative"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" /><input value={gameSearch} onChange={(e) => setGameSearch(e.target.value)} placeholder="Find a game" className="h-9 w-full rounded-lg border border-white/[0.07] bg-white/[0.025] pl-9 pr-3 text-xs text-white outline-none placeholder:text-white/22" /></div>
              <button type="button" onClick={() => { setActiveGame(null); setSelectedPost(null); }} className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs ${!activeGame ? 'bg-cyan-300/10 text-cyan-100' : 'text-white/45 hover:bg-white/[0.04] hover:text-white'}`}><Gamepad2 className="h-4 w-4" />All Games</button>
              <div className="mt-2 flex-1 space-y-1 overflow-y-auto pr-1">{filteredGames.map((game) => <button type="button" key={game.id} onClick={() => { setActiveGame(game); setSelectedPost(null); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs ${activeGame?.id === game.id ? 'bg-white/[0.07] text-white' : 'text-white/42 hover:bg-white/[0.035] hover:text-white/75'}`}><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-200/35" /><span className="truncate">{game.title}</span></button>)}</div>
              <div className="mt-3 border-t border-white/[0.06] pt-3 text-[10px] leading-5 text-white/25">Browse by game, then narrow to full guides, achievement hunts, farming routes, tips or discussion.</div>
            </aside>

            <main className="min-w-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 lg:px-8">
              {selectedPost ? <div className="mx-auto max-w-4xl space-y-4">
                <div className="flex items-center gap-2"><button type="button" onClick={() => setSelectedPost(null)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-white/40 hover:bg-white/[0.04] hover:text-white"><ArrowLeft className="h-4 w-4" />Back to forum</button>{session.isModerator && <button onClick={muteSelectedAuthor} className="ml-auto rounded-lg border border-amber-300/10 px-3 py-1.5 text-xs text-amber-100/55 hover:bg-amber-300/[0.05]">Mute author 24h</button>}</div>
                <PostCard post={selectedPost} isDetailView currentUser={user} isModerator={session.isModerator} reactions={selectedPostReactions} commentCount={selectedComments.length} onReact={(post, emoji) => react('post', post.id, emoji)} onDelete={deletePost} onReport={report} onModerate={moderatePost} />
                <CommentSection post={selectedPost} comments={selectedComments} reactions={reactions} currentUser={user} isModerator={session.isModerator} onAddComment={addComment} onDelete={deleteComment} onReact={react} onReport={report} />
              </div> : <div className="mx-auto max-w-5xl">
                <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center">
                  <div className="flex flex-wrap gap-1.5">{SECTIONS.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setSection(id)} className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-medium ${section === id ? 'bg-cyan-300/10 text-cyan-100' : 'text-white/38 hover:bg-white/[0.04] hover:text-white/70'}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}</div>
                  <div className="flex gap-2 xl:ml-auto"><div className="relative min-w-[220px] flex-1 xl:flex-none"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guides, cards, bosses, routes…" className="h-8 w-full rounded-lg border border-white/[0.07] bg-white/[0.025] pl-9 pr-3 text-xs text-white outline-none placeholder:text-white/22" /></div><select value={sort} onChange={(e) => setSort(e.target.value)} className="h-8 rounded-lg border border-white/[0.07] bg-[#0a1018] px-2 text-xs text-white/55"><option value="newest">Newest</option><option value="popular">Useful / Popular</option></select></div>
                </div>
                {activeGame && <div className="mb-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.022] px-4 py-3"><div><p className="text-[9px] uppercase tracking-[0.2em] text-white/28">Game intelligence channel</p><p className="mt-1 text-sm font-semibold text-white/80">{activeGame.title} <span className="font-normal text-white/30">· {activeGame.genre || 'Game'}</span></p></div><button type="button" onClick={() => setActiveGame(null)} className="text-xs text-white/30 hover:text-white">Clear game</button></div>}
                <div className="space-y-3">{loading ? <div className="py-20 text-center text-sm text-white/25">Loading player knowledge…</div> : visiblePosts.length ? visiblePosts.map((post) => <PostCard key={post.id} post={post} currentUser={user} isModerator={session.isModerator} reactions={reactions.filter((r) => r.target_type === 'post' && r.target_id === post.id)} commentCount={commentCount(post.id)} onSelect={selectPost} onReact={(item, emoji) => react('post', item.id, emoji)} onDelete={deletePost} onReport={report} onModerate={moderatePost} />) : <div className="rounded-xl border border-dashed border-white/[0.07] py-20 text-center"><BookOpen className="mx-auto h-8 w-8 text-cyan-200/25" /><h3 className="mt-3 text-sm font-semibold text-white/60">No knowledge entry here yet</h3><p className="mt-1 text-xs text-white/28">Start the guide, farming route, achievement hunt or discussion.</p></div>}</div>
              </div>}
            </main>

            {!selectedPost && <aside className="hidden w-[280px] shrink-0 border-l border-white/[0.055] bg-black/10 p-4 xl:block">
              <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-cyan-200/55" /><h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Guide Desk</h2></div><p className="mt-2 text-xs leading-5 text-white/28">The strongest walkthroughs, achievement hints and farming routes for this channel.</p>
              <div className="mt-4 space-y-2">{guideDesk.map((post) => <button key={post.id} type="button" onClick={() => selectPost(post)} className="w-full rounded-lg border border-white/[0.055] bg-white/[0.022] p-3 text-left hover:bg-white/[0.04]"><div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-cyan-200/45">{post.is_pinned && <Pin className="h-3 w-3" />}{post.guide_kind?.replaceAll('_', ' ') || post.community}</div><div className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-white/70">{post.title}</div><div className="mt-2 text-[10px] text-white/25">{post.game_title || 'Platform'} · {commentCount(post.id)} replies</div></button>)}{!guideDesk.length && <div className="rounded-lg border border-white/[0.05] p-4 text-xs leading-5 text-white/25">Pinned guides will appear here as the community builds its knowledge base.</div>}</div>
              <div className="mt-5 rounded-lg border border-cyan-200/[0.07] bg-cyan-200/[0.025] p-3 text-[11px] leading-5 text-white/30"><Trophy className="mr-1 inline h-3.5 w-3.5 text-cyan-200/45" />Achievement hunters can tag missables, boss routes, collectibles, XP methods and card unlock conditions.</div>
            </aside>}
          </div>
        </div>

        {moderationOpen && session.isModerator && <div className="absolute right-4 top-[150px] z-50 max-h-[calc(100vh-220px)] w-[360px] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#080d14]/95 p-4 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between"><div><p className="text-[9px] uppercase tracking-[0.2em] text-cyan-200/45">Operations</p><h3 className="text-sm font-semibold text-white/75">Moderation queue</h3></div><button onClick={() => setModerationOpen(false)} className="text-xs text-white/30">Close</button></div>{session.isAdmin && <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.025] p-3"><div className="flex items-center gap-2 text-xs text-white/50"><UserRoundCog className="h-3.5 w-3.5" />Appoint moderator</div><div className="mt-2 flex gap-2"><input value={moderatorUserId} onChange={(e) => setModeratorUserId(e.target.value)} placeholder="User ID" className="h-8 min-w-0 flex-1 rounded border border-white/[0.07] bg-black/20 px-2 text-xs text-white outline-none" /><button onClick={appointModerator} className="rounded bg-cyan-300/10 px-3 text-xs text-cyan-100">Add</button></div></div>}<div className="mt-4 space-y-2">{reports.map((item) => <div key={item.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"><div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-amber-100/50"><Flag className="h-3 w-3" />{item.target_type} · {item.reason}</div><p className="mt-1 break-all text-xs text-white/35">{item.target_id}</p><div className="mt-3 flex gap-2"><button onClick={() => resolveReport(item.id)} className="flex items-center gap-1 rounded bg-cyan-300/10 px-2 py-1 text-[10px] text-cyan-100"><CheckCircle2 className="h-3 w-3" />Resolve</button><button onClick={() => resolveReport(item.id, 'dismissed')} className="rounded px-2 py-1 text-[10px] text-white/30 hover:bg-white/[0.04]">Dismiss</button></div></div>)}{!reports.length && <p className="py-5 text-center text-xs text-white/25">No open reports.</p>}</div></div>}

        <PostComposer isOpen={composerOpen} onCancel={() => setComposerOpen(false)} onSubmit={createPost} games={games} initialGame={activeGame} />
      </div>
    </GlassPageFrame>
  </PageErrorBoundary>;
}
