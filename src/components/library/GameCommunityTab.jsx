import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, ThumbsUp, ChevronRight, Loader2, Flame, Swords } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const MOCK_SKIRMISHES = [
  { id: 's1', title: 'Guild War: Iron Legion vs Shadow Pact', participants: 64, status: 'live', type: 'guild_war' },
  { id: 's2', title: '1v1 Arena Championship - Round 3', participants: 128, status: 'upcoming', type: 'tournament' },
  { id: 's3', title: 'Faction Raid: Neon District', participants: 32, status: 'completed', type: 'raid' },
];

export default function GameCommunityTab({ game }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!game) return;
      setLoading(true);
      try {
        const gamePosts = await base44.entities.Post.filter({ game_title: game.title }, '-created_date', 8);
        setPosts(gamePosts || []);
      } catch { setPosts([]); }
      finally { setLoading(false); }
    };
    fetchPosts();
  }, [game]);

  const goToForum = () => navigate(createPageUrl('Community'), { state: { selectedGame: game, section: 'general_discussion' } });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Skirmishes & Events */}
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Swords className="w-5 h-5 text-red-400" />
          Active Skirmishes & Events
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MOCK_SKIRMISHES.map((s) => (
            <div key={s.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
              <div className="flex items-center gap-2 mb-2">
                {s.status === 'live' && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                <Badge variant="outline" className={`text-[10px] ${
                  s.status === 'live' ? 'border-red-500/40 text-red-400' :
                  s.status === 'upcoming' ? 'border-yellow-500/40 text-yellow-400' :
                  'border-white/20 text-white/40'
                }`}>{s.status.toUpperCase()}</Badge>
              </div>
              <h4 className="text-white font-semibold text-sm group-hover:text-cyan-400 transition-colors">{s.title}</h4>
              <div className="flex items-center gap-2 mt-2 text-xs text-white/40">
                <Users className="w-3 h-3" />
                <span>{s.participants} participants</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Community Posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Community Activity
          </h3>
          <Button variant="outline" size="sm" className="border-white/20 hover:bg-white/10 text-white" onClick={goToForum}>
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
        ) : posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} onClick={goToForum} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {post.created_by?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium group-hover:text-cyan-400 transition-colors truncate">{post.title}</h4>
                  <p className="text-white/40 text-sm mt-1 line-clamp-1">{post.content?.replace(/<[^>]*>/g, '').substring(0, 120)}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-white/30">
                    <span>{post.created_by?.split('@')[0] || 'Anonymous'}</span>
                    <span>{new Date(post.created_date).toLocaleDateString()}</span>
                    {post.community && <Badge variant="outline" className="text-[10px] border-white/10 text-white/30">{post.community}</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 rounded-2xl border border-white/10">
            <MessageSquare className="w-12 h-12 text-white/20 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Community Activity Yet</h3>
            <p className="text-white/40 text-sm mb-4">Be the first to start a conversation about {game?.title}.</p>
            <Button className="bg-blue-600 hover:bg-blue-500 rounded-full px-6" onClick={goToForum}>Start a Discussion</Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}