import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, BookOpen, ChevronRight, Loader2, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function GameDiscussionTab({ game }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const fetchPosts = async () => {
      if (!game) return;
      setLoading(true);
      try {
        const gamePosts = await base44.entities.Post.filter({ game_title: game.title, type: 'general_discussion' }, '-created_date', 15);
        setPosts(gamePosts || []);
      } catch { setPosts([]); }
      finally { setLoading(false); }
    };
    fetchPosts();
  }, [game]);

  const goToForum = () => navigate(createPageUrl('Community'), { state: { selectedGame: game } });

  const filters = [
    { id: 'all', label: 'All Posts' },
    { id: 'guide', label: 'Guides' },
    { id: 'tips', label: 'Tips & Tricks' },
    { id: 'question', label: 'Questions' },
    { id: 'bugs', label: 'Bug Reports' },
  ];

  const filteredPosts = activeFilter === 'all' ? posts : posts.filter(p => p.community === activeFilter);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header with Guide navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeFilter === f.id ? 'bg-white/10 text-white border border-white/15' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {f.id === 'guide' && <BookOpen className="w-3.5 h-3.5 inline mr-1.5" />}
              {f.label}
            </button>
          ))}
        </div>
        <Button size="sm" className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30" onClick={goToForum}>
          <MessageSquare className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Guide Quick Access (shown when Guide filter is active) */}
      {activeFilter === 'guide' && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h4 className="text-white font-bold">Community Guides</h4>
          </div>
          <p className="text-white/50 text-sm mb-4">Browse player-created guides for {game?.title}. Find walkthroughs, build guides, and tips.</p>
          <div className="grid grid-cols-3 gap-3">
            {['Beginner Walkthrough', 'Best Builds', 'Boss Strategies'].map((guide, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                <h5 className="text-white text-sm font-medium group-hover:text-emerald-400 transition-colors">{guide}</h5>
                <p className="text-white/30 text-xs mt-1">{Math.floor(Math.random() * 20 + 5)} guides</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
      ) : filteredPosts.length > 0 ? (
        <div className="space-y-2">
          {filteredPosts.map((post) => (
            <div key={post.id} onClick={goToForum} className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 cursor-pointer transition-all group border-b border-white/5 last:border-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {post.created_by?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white/90 font-medium text-sm group-hover:text-cyan-400 transition-colors truncate">{post.title}</h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
                  <span>{post.created_by?.split('@')[0] || 'Anonymous'}</span>
                  <span>{new Date(post.created_date).toLocaleDateString()}</span>
                  {post.community && <Badge variant="outline" className="text-[9px] h-4 border-white/10 text-white/30">{post.community}</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-1 text-white/20 text-xs">
                <MessageSquare className="w-3 h-3" />
                <span>{post.score || 0}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="w-12 h-12 text-white/15 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Posts Found</h3>
          <p className="text-white/40 text-sm mb-4">
            {activeFilter === 'guide' ? 'No guides have been created yet for this game.' : 'No forum posts yet.'}
          </p>
          <Button className="bg-blue-600 hover:bg-blue-500 rounded-full px-6" onClick={goToForum}>Create Post</Button>
        </div>
      )}
    </motion.div>
  );
}