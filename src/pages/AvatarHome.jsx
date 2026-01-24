import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import MiniAchievementCard from '@/components/dashboard/MiniAchievementCard';
import AvatarHomeContainer from '@/components/avatarHome/AvatarHomeContainer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Gamepad2, House, Quote, ChevronLeft } from 'lucide-react';

export default function AvatarHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [display, setDisplay] = React.useState({
    name: 'Guest',
    avatar_url: '',
    catchphrase: 'Welcome in. Make yourself at home.',
    mood: 'calm',
  });
  const [achievements, setAchievements] = React.useState([]);
  const [games, setGames] = React.useState([]);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetUserId = urlParams.get('userId');

    const load = async () => {
      setLoading(true);
      try {
        let header = { name: 'Guest', avatar_url: '', catchphrase: 'Welcome in. Make yourself at home.', mood: 'calm' };

        if (targetUserId && user?.id) {
          // Try to resolve via Friend entry (temp or real)
          const rows = await base44.entities.Friend.filter({ user_id: user.id });
          const row = rows.find(r => String(r.friend_id) === String(targetUserId));
          if (row) {
            header = {
              name: row.friend_name || 'Friend',
              avatar_url: row.friend_avatar || `https://i.pravatar.cc/150?u=${row.friend_id}`,
              catchphrase: row.catchphrase || 'Good to see you.',
              mood: row.status === 'online' ? 'bright' : 'calm'
            };
          } else {
            // Fallback: treat as self if not found
            header = {
              name: user?.full_name || user?.email?.split('@')[0] || 'Player',
              avatar_url: user?.avatar_url || '',
              catchphrase: user?.catchphrase || 'Welcome back.',
              mood: 'calm'
            };
          }
        } else {
          // Self home
          header = {
            name: user?.full_name || user?.email?.split('@')[0] || 'Player',
            avatar_url: user?.avatar_url || '',
            catchphrase: user?.catchphrase || 'Welcome back.',
            mood: 'calm'
          };
        }

        setDisplay(header);

        // Content blocks
        const ach = await base44.entities.Achievement.list('-created_date', 8);
        const gms = await base44.entities.Game.list('-original_year', 8);
        setAchievements(ach || []);
        setGames(gms || []);
      } catch (e) {
        console.error('Failed to load AvatarHome:', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  const urlParams = new URLSearchParams(window.location.search);
  const targetUserId = urlParams.get('userId');
  const isSelf = !targetUserId || targetUserId === user?.id;

  return (
    <div className="min-h-screen w-full text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
      {/* Ambient blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-20 -left-10 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-[1200px] mx-auto px-6 pt-28 pb-16">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(createPageUrl('Friends'))} className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" /> Back to Friends
          </button>
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <House className="w-4 h-4" /> Avatar Home Preview
          </div>
        </div>

        <AvatarHomeContainer mode={isSelf ? 'self' : 'friend'} avatarUserId={targetUserId || user?.id} entryContext="friends" />

        {/* Header / Avatar Presence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mb-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 md:col-span-2">
            <div className="flex items-center">
              <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/10 overflow-hidden flex items-center justify-center">
                {display.avatar_url ? (
                  <img src={display.avatar_url} alt={display.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-bold">
                    {display.name?.charAt(0) || 'A'}
                  </div>
                )}
              </div>
              <div className="-ml-3 w-14 h-14 rounded-xl bg-white/10 border border-white/10 overflow-hidden flex items-center justify-center">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name || 'You'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-bold">
                    {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight">{display.name}</h1>
              <span className="text-white/70 italic">“{display.catchphrase}”</span>
            </div>
          </motion.div>


        </div>

        {/* 2D Home Scene (sections as objects) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trophy Wall */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <h3 className="font-bold">Trophy Wall</h3>
            </div>
            {loading ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
              </div>
            ) : achievements.length === 0 ? (
              <p className="text-white/40 text-sm">No achievements yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {achievements.slice(0, 6).map((a, i) => (
                  <MiniAchievementCard key={a.id || i} achievement={a} size={64} />
                ))}
              </div>
            )}
          </motion.div>

          {/* Console / Games */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2 className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold">Games Corner</h3>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-video bg-white/5 rounded-xl animate-pulse" />)}
              </div>
            ) : games.length === 0 ? (
              <p className="text-white/40 text-sm">No games to show.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {games.slice(0, 4).map((g) => (
                  <div key={g.id} className="group relative aspect-video rounded-xl overflow-hidden border border-white/10">
                    <img src={g.cover_image || g.banner_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop'} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-sm font-semibold truncate">{g.title}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Memory Board / Activity */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="font-bold mb-3">Memory Board</h3>
            <ul className="text-white/70 text-sm space-y-2">
              <li>• Unlocked a rare badge yesterday</li>
              <li>• Played Neon Racer with friends</li>
              <li>• Exploring Galactic Empire campaign</li>
            </ul>
          </motion.div>
        </div>

        {/* Footer CTA */}
        <div className="mt-10 flex items-center justify-end">
          <Button variant="outline" onClick={() => navigate(createPageUrl('LunaTemplate'))} className="border-white/20 text-white/80">Go to Luna Dashboard</Button>
        </div>
      </div>
    </div>
  );
}