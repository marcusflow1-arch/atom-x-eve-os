import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CircleHelp, Clock3, Eye, Gamepad2, MessageSquare, Plus, Route, Sparkles, Sprout, Trophy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import PostCard from '@/components/community/PostCard';
import CommentSection from '@/components/community/CommentSection';
import CreatePostModal from './CreatePostModal';
import './farmHub.css';

const unwrap = (result) => result?.data ?? result ?? {};
const timeAgo = (value) => {
  const delta = Math.max(0, Date.now() - new Date(value || Date.now()).getTime());
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d ago` : new Date(value).toLocaleDateString();
};
const isAchievementPost = (post) => post.community === 'achievements' || post.type === 'achievement_guide' || post.guide_kind === 'achievement';
const isHelpPost = (post) => post.type === 'help' || post.type === 'question' || post.community === 'question';

function HelpCard({ item, onOpen }) {
  return <button type="button" className="farm-help-card" onClick={() => onOpen(item.post)}>
    <div className="farm-help-top"><span>{item.post.game_title || 'All games'}</span><CircleHelp size={13} /></div>
    <h3>{item.post.title}</h3><p>{item.post.content}</p>
    <div className="farm-help-foot"><span><MessageSquare size={12} />{item.commentCount}</span><span><Clock3 size={12} />{timeAgo(item.lastActivity)}</span>{item.commentCount === 0 && <span className="unanswered">Needs an answer</span>}</div>
  </button>;
}

function MethodRow({ item, onOpen }) {
  return <button type="button" className="farm-method-row" onClick={() => onOpen(item.post)}>
    <div className="min-w-0"><h3>{item.post.title}</h3><p>{item.post.game_title || 'Platform-wide'} · {item.post.type === 'tip' ? 'Quick tip' : item.post.type === 'achievement_guide' ? 'Achievement farm' : 'Farming method'} · {item.post.author_name || item.post.created_by?.split('@')?.[0] || 'Player'}</p></div>
    <div className="farm-method-meta"><span><MessageSquare size={12} /><strong>{item.commentCount}</strong></span><span><Sparkles size={12} />{item.reactionCount}</span><span><Eye size={12} />{Number(item.post.view_count || 0)}</span><span><Clock3 size={12} />{timeAgo(item.lastActivity)}</span></div>
  </button>;
}

function AchievementCard({ item, onOpen }) {
  return <button type="button" className="farm-achievement-card" onClick={() => onOpen(item.post)}>
    <div className="farm-card-top"><span>{item.post.game_title || 'Achievement farming'}</span><Trophy size={13} /></div>
    <h3>{item.post.title}</h3><p>{item.post.content}</p>
    <div className="farm-card-foot"><span><MessageSquare size={12} />{item.commentCount} replies</span><span><Sparkles size={12} />{item.reactionCount}</span><span><Clock3 size={12} />{timeAgo(item.lastActivity)}</span></div>
  </button>;
}

function RouteCard({ route, game, onOpen }) {
  return <button type="button" className="farm-route-card" onClick={() => game && onOpen?.(game)}>
    <div className="farm-card-top"><span>{route.route_type || route.type || 'Route'} · {route.difficulty || 'medium'}</span><Route size={13} /></div>
    <h3>{route.title}</h3><p>{route.description || route.tactics || 'Community farming route.'}</p>
    <div className="farm-card-foot"><span><Gamepad2 size={12} />{game?.title || 'Game route'}</span>{route.yields && <span><Sprout size={12} />{route.yields}</span>}</div>
  </button>;
}

export default function FarmHub({ games = [], onSelectGame, activeSection = 'home' }) {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState('discussion');

  const invokeForum = useCallback(async (action, data = {}) => {
    const result = unwrap(await base44.functions.invoke('forumSystem', { action, data }));
    if (result?.success === false) throw new Error(result.error || 'Community request failed.');
    return result;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [postRows, commentRows, reactionRows, routeRows] = await Promise.all([
        base44.entities.Post.filter({ is_farm_hub: true }, '-created_date', 180),
        base44.entities.Comment.filter({ target_type: 'post' }, '-created_date', 1800).catch(() => []),
        base44.entities.ForumReaction.list('-created_date', 1800).catch(() => []),
        base44.entities.FarmRoute.list('-created_date', 160).catch(() => []),
      ]);
      setPosts((postRows || []).filter((post) => post.status !== 'removed'));
      setComments(commentRows || []);
      setReactions(reactionRows || []);
      setRoutes(routeRows || []);
    } catch (error) { showError(error, 'Load Farm Hub'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (selectedPost || activeSection === 'home') {
      if (activeSection === 'home') document.querySelector('.farm-shell')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    requestAnimationFrame(() => document.getElementById(activeSection === 'help' ? 'farm-help' : 'farm-achievements')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [activeSection, selectedPost]);

  const gameById = useMemo(() => new Map(games.map((game) => [String(game.id), game])), [games]);
  const enriched = useMemo(() => posts.map((post) => {
    const postComments = comments.filter((comment) => comment.target_type === 'post' && comment.target_id === post.id);
    const postReactions = reactions.filter((reaction) => reaction.target_type === 'post' && reaction.target_id === post.id);
    const latestComment = postComments.reduce((latest, comment) => Math.max(latest, new Date(comment.created_date || 0).getTime()), 0);
    const created = new Date(post.created_date || 0).getTime();
    const lastActivity = Math.max(created, latestComment);
    const commentCount = postComments.length;
    const reactionCount = postReactions.length;
    const recencyHours = Math.max(1, (Date.now() - lastActivity) / 3600000);
    const heat = commentCount * 9 + reactionCount * 6 + Math.log2(Number(post.view_count || 0) + 1) * 6 + Math.max(0, 48 - recencyHours) * .6 + (post.is_pinned ? 20 : 0);
    return { post, comments: postComments, reactions: postReactions, commentCount, reactionCount, lastActivity, heat };
  }), [posts, comments, reactions]);

  const helpRequests = useMemo(() => enriched.filter((item) => isHelpPost(item.post)).sort((a, b) => {
    if ((a.commentCount === 0) !== (b.commentCount === 0)) return a.commentCount === 0 ? -1 : 1;
    return b.lastActivity - a.lastActivity;
  }).slice(0, 6), [enriched]);
  const hotMethods = useMemo(() => enriched.filter((item) => !isHelpPost(item.post) && !isAchievementPost(item.post)).sort((a, b) => b.heat - a.heat).slice(0, 14), [enriched]);
  const achievementFarms = useMemo(() => enriched.filter((item) => isAchievementPost(item.post)).sort((a, b) => b.heat - a.heat).slice(0, 12), [enriched]);
  const recent = useMemo(() => [...enriched].sort((a, b) => b.lastActivity - a.lastActivity).slice(0, 16), [enriched]);

  const selectedComments = useMemo(() => selectedPost ? comments.filter((comment) => comment.target_type === 'post' && comment.target_id === selectedPost.id) : [], [comments, selectedPost]);
  const selectedReactions = useMemo(() => selectedPost ? reactions.filter((reaction) => reaction.target_type === 'post' && reaction.target_id === selectedPost.id) : [], [reactions, selectedPost]);

  const requireAuth = () => {
    if (isAuthenticated && user?.id) return true;
    showError('Please sign in to participate in Farm Hub.');
    return false;
  };
  const openComposer = (type) => { if (!requireAuth()) return; setComposerType(type); setComposerOpen(true); };
  const selectPost = async (post) => { setSelectedPost(post); try { await invokeForum('view_post', { post_id: post.id }); } catch (_) {} };
  const addComment = async ({ content, parent_comment_id }) => { if (!selectedPost || !requireAuth()) return; try { await invokeForum('add_comment', { post_id: selectedPost.id, content, parent_comment_id }); await load(); } catch (error) { showError(error, 'Add Comment'); } };
  const deleteComment = async (comment) => { if (!requireAuth() || !window.confirm('Delete this comment?')) return; try { await invokeForum('delete_comment', { comment_id: comment.id }); await load(); } catch (error) { showError(error, 'Delete Comment'); } };
  const deletePost = async (post) => { if (!requireAuth() || !window.confirm(`Delete “${post.title}”?`)) return; try { await invokeForum('delete_post', { post_id: post.id }); setSelectedPost(null); await load(); showSuccess('Post deleted.'); } catch (error) { showError(error, 'Delete Post'); } };
  const react = async (targetType, targetId, emoji) => { if (!requireAuth()) return; try { await invokeForum('toggle_reaction', { target_type: targetType, target_id: targetId, emoji }); await load(); } catch (error) { showError(error, 'Reaction'); } };
  const report = async (targetType, targetId) => { if (!requireAuth()) return; try { await invokeForum('report', { target_type: targetType, target_id: targetId, reason: 'other', details: 'Submitted from Farm Hub.' }); showSuccess('Report sent to moderators.'); } catch (error) { showError(error, 'Report'); } };

  return <div className="farm-hub relative h-full min-h-0">
    <div className="farm-shell">
      <header className="farm-header">
        <div className="farm-header-copy"><div className="farm-eyebrow">Community farming intelligence</div><h1>Farm Hub <span>/ Help, routes & achievements</span></h1></div>
        <div className="farm-header-actions"><button type="button" className="farm-glass-button" onClick={() => openComposer('help')}><CircleHelp size={14} />Request Help</button><button type="button" className="farm-glass-button primary" onClick={() => openComposer('farming_guide')}><Plus size={15} />Share Method</button></div>
      </header>

      {selectedPost ? <main className="farm-content farm-detail">
        <button type="button" className="farm-detail-back" onClick={() => setSelectedPost(null)}><ArrowLeft size={14} />Back to Farm Hub</button>
        <PostCard post={selectedPost} isDetailView currentUser={user} reactions={selectedReactions} commentCount={selectedComments.length} onReact={(post, emoji) => react('post', post.id, emoji)} onDelete={deletePost} onReport={report} />
        <div className="mt-4"><CommentSection post={selectedPost} comments={selectedComments} reactions={reactions} currentUser={user} onAddComment={addComment} onDelete={deleteComment} onReact={react} onReport={report} /></div>
      </main> : <main className="farm-content">
        {loading ? <div className="farm-empty"><Sprout size={28} /><h3>Loading farming knowledge</h3><p>Gathering routes, help requests, achievement methods, and recent activity.</p></div> : <>
          <section className="farm-section" id="farm-help"><div className="farm-section-head"><div><div className="farm-section-kicker"><CircleHelp size={12} />Players looking for answers</div><h2>Help requests</h2><p>Unanswered requests are pushed forward so players can get unstuck quickly.</p></div><span className="farm-section-count">{helpRequests.length} active</span></div>{helpRequests.length ? <div className="farm-help-grid">{helpRequests.slice(0, 3).map((item) => <HelpCard key={item.post.id} item={item} onOpen={selectPost} />)}</div> : <div className="farm-empty"><CircleHelp size={25} /><h3>No open help requests</h3><p>When players ask for farming help, their requests will surface here.</p></div>}</section>

          <section className="farm-section" id="farm-methods"><div className="farm-section-head"><div><div className="farm-section-kicker"><Sparkles size={12} />Community tested</div><h2>Hot farming methods</h2><p>Useful methods ranked from real replies, reactions, views, and recent activity.</p></div><span className="farm-section-count">{hotMethods.length} shown</span></div>{hotMethods.length ? <div className="farm-method-list">{hotMethods.map((item) => <MethodRow key={item.post.id} item={item} onOpen={selectPost} />)}</div> : <div className="farm-empty"><Sprout size={25} /><h3>No methods shared yet</h3><p>Share an XP loop, resource route, boss farm, currency method, or efficient reset.</p></div>}</section>

          <section className="farm-section" id="farm-achievements"><div className="farm-section-head"><div><div className="farm-section-kicker"><Trophy size={12} />Achievement hunting</div><h2>Achievement farming</h2><p>Routes, prerequisites, missables, card unlock conditions, and repeatable progress methods.</p></div><span className="farm-section-count">{achievementFarms.length} active</span></div>{achievementFarms.length ? <div className="farm-achievement-rail">{achievementFarms.map((item) => <AchievementCard key={item.post.id} item={item} onOpen={selectPost} />)}</div> : <div className="farm-empty"><Trophy size={25} /><h3>No achievement farms yet</h3><p>Achievement-focused methods will appear here as players publish them.</p></div>}</section>

          {!!routes.length && <section className="farm-section" id="farm-routes"><div className="farm-section-head"><div><div className="farm-section-kicker"><Route size={12} />Structured routes</div><h2>Farm routes</h2><p>Step-by-step community routes with difficulty, purpose, tactics, and estimated yield.</p></div><span className="farm-section-count">{routes.length} routes</span></div><div className="farm-route-rail">{routes.slice(0, 14).map((route) => <RouteCard key={route.id} route={route} game={gameById.get(String(route.game_id || route.gameId || ''))} onOpen={onSelectGame} />)}</div></section>}

          <section className="farm-section" id="farm-recent"><div className="farm-section-head"><div><div className="farm-section-kicker"><Clock3 size={12} />Latest movement</div><h2>Recently active</h2><p>Fresh replies and newly shared farming knowledge across every game.</p></div><span className="farm-section-count">{recent.length} shown</span></div>{recent.length ? <div className="farm-method-list">{recent.map((item) => <MethodRow key={item.post.id} item={item} onOpen={selectPost} />)}</div> : <div className="farm-empty"><Clock3 size={25} /><h3>No recent activity</h3><p>New farming discussions will appear here.</p></div>}</section>
        </>}
      </main>}
    </div>

    <CreatePostModal open={composerOpen} onClose={() => setComposerOpen(false)} defaultType={composerType} onCreated={() => load()} />
  </div>;
}
