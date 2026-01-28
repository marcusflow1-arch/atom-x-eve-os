import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Radio, Info, ShoppingBag, LifeBuoy, MessageSquare, Trophy, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DLCList, { DLC_DATA } from '@/components/game/DLCList';
import { useCart } from '@/components/CartContext';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ShinyCard from '@/components/shared/ShinyCard';
import CreatePostForm from '@/components/community/CreatePostForm';
import MysteryCardDetail from '@/components/streaming/MysteryCardDetail';

export default function QuickInfoOverlay({ open, item, onClose, onPlay, onStream, onMoreInfo }) {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [selectedDLC, setSelectedDLC] = React.useState(null);
  const [posts, setPosts] = React.useState([]);
  const [replyToId, setReplyToId] = React.useState(null);
  const [replyText, setReplyText] = React.useState('');
  const [achievements, setAchievements] = React.useState([]);
  const [showCreatePost, setShowCreatePost] = React.useState(false);
  const [selectedMysteryCard, setSelectedMysteryCard] = React.useState(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const getDlcPrice = (dlc) => {
    if (!dlc) return 0;
    if (dlc.id === 'dlc_1') return 14.99;
    if (dlc.id === 'dlc_2') return 9.99;
    if (dlc.id === 'dlc_3') return 29.99;
    return 0;
  };

  React.useEffect(() => {
    if (!open || !item?.title) return;
    (async () => {
      const res = await base44.entities.Post.filter({ type: 'game_discussion', game_title: item.title }, '-created_date', 5);
      setPosts(res?.data || res || []);
    })();
  }, [open, item?.title]);

        React.useEffect(() => {
          if (!open || !item?.title) return;
          (async () => {
            const res = await base44.entities.Achievement.filter({ game: item.title }, '-rarity', 8);
            setAchievements(res?.data || res || []);
          })();
        }, [open, item?.title]);

  const handleAddToCart = () => {
    if (!selectedDLC) return;
    const price = getDlcPrice(selectedDLC);
    addToCart({ id: `${item?.id || item?.title}-${selectedDLC.id}`.replace(/\s+/g, '_'), type: 'dlc', title: `${item?.title || 'Game'} - ${selectedDLC.name}`, price });
  };

  const handleReplySubmit = async (postId) => {
    if (!replyText.trim()) return;
    await base44.entities.Comment.create({ target_id: postId, target_type: 'post', content: replyText.trim() });
    setReplyText('');
    setReplyToId(null);
    const res = await base44.entities.Post.filter({ type: 'game_discussion', game_title: item.title }, '-created_date', 5);
    setPosts(res?.data || res || []);
  };

  const handleCreatePost = async (data) => {
    await base44.entities.Post.create(data);
    setShowCreatePost(false);
    const res = await base44.entities.Post.filter({ type: 'game_discussion', game_title: item.title }, '-created_date', 5);
    setPosts(res?.data || res || []);
  };

  React.useEffect(() => {
    if (open) {
      setActiveTab('overview');
      setSelectedMysteryCard(null); // Reset mystery card selection on open
    }
  }, [open]);
  
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>


          {/* Dim background to the right of LibrarySidebar */}
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 bottom-0 right-0 left-[320px] sm:left-[384px] z-[80]"
          onClick={onClose}
          style={{ background: 'rgba(0,0,0,0.5)' }}
          />

          {/* Slide-in panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="fixed top-0 right-0 bottom-0 left-[320px] sm:left-[384px] z-[90] border-l border-white/10 flex flex-col"
            style={{
              background: 'rgba(20,24,34,0.85)',
              backdropFilter: 'blur(18px) saturate(160%)',
              WebkitBackdropFilter: 'blur(18px) saturate(160%)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.45)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10 flex-none">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                {item?.image ? (
                  <img src={item.image} alt={item?.title || 'Item'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded bg-white/20" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-semibold truncate">{item?.title || 'Selected Item'}</h3>
                {item?.subtitle && <p className="text-white/60 text-xs truncate">{item.subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="ml-auto w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hero media */}
            <div className="relative h-44 sm:h-52 border-b border-white/10 overflow-hidden flex-none">
              {item?.image ? (
                <img src={item.image} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-4 flex gap-2">
                <Button onClick={onPlay} className="bg-emerald-600 hover:bg-emerald-700">
                  <Play className="w-4 h-4" /> Play
                </Button>
                <Button variant="secondary" onClick={onStream}>
                  <Radio className="w-4 h-4" /> Stream
                </Button>
                <Button variant="outline" onClick={onMoreInfo}>
                  <Info className="w-4 h-4" /> Info
                </Button>
              </div>
            </div>

            {/* Quick actions & info tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4 flex-1 flex flex-col min-h-0">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="overview">Dashboard</TabsTrigger>
                <TabsTrigger value="dlc">DLC</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="discussions">Discussions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Dashboard Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <Trophy className="w-3.5 h-3.5" />
                      <h4 className="font-bold text-[10px] uppercase tracking-wider">Progress</h4>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-white/60 mb-1">
                        <span>Achievements</span>
                        <span>12 / 50</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-[24%] bg-emerald-500 rounded-full" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-900/10 border border-blue-500/20 space-y-2">
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <Play className="w-3.5 h-3.5" />
                      <h4 className="font-bold text-[10px] uppercase tracking-wider">Playtime</h4>
                    </div>
                    <p className="text-lg font-bold text-white">24h 15m</p>
                  </div>

                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-900/10 border border-purple-500/20 space-y-2">
                    <div className="flex items-center gap-1.5 text-purple-400">
                      <Radio className="w-3.5 h-3.5" />
                      <h4 className="font-bold text-[10px] uppercase tracking-wider">Status</h4>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-xs font-medium text-white">Online</span>
                    </div>
                  </div>
                </div>

                {/* Latest Updates Section */}
                <div>
                   <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-bold text-sm flex items-center gap-2">
                        <Newspaper className="w-4 h-4 text-pink-400" /> Latest Updates
                      </h4>
                   </div>
                   
                   <div className="grid gap-3">
                    {(() => {
                      const keywords = ['update','patch','hotfix','notes'];
                      const updatePosts = posts.filter(p => {
                        const t = (p.title || '').toLowerCase();
                        const c = (p.content || '').toLowerCase();
                        return keywords.some(k => t.includes(k) || c.includes(k));
                      });
                      
                      if (updatePosts.length === 0) {
                        return (
                            <div className="p-4 rounded-xl border border-white/5 bg-white/5 text-center">
                                <p className="text-white/40 text-sm">No recent updates found.</p>
                            </div>
                        );
                      }
                      
                      return updatePosts.slice(0, 2).map(up => (
                        <div key={up.id} className="p-4 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => navigate(createPageUrl('Community') + `?post=${up.id}`)}>
                          <div className="flex justify-between items-start">
                             <p className="text-white text-sm font-bold line-clamp-1">{up.title}</p>
                             <span className="text-[10px] text-white/40">{new Date(up.created_date || Date.now()).toLocaleDateString()}</span>
                          </div>
                          {up.content && <p className="text-white/60 text-xs line-clamp-2 mt-1">{up.content}</p>}
                          <div className="mt-2 flex gap-2">
                            <Badge variant="outline" className="text-[10px] border-pink-500/30 text-pink-300">Patch Notes</Badge>
                          </div>
                        </div>
                      ));
                    })()}
                   </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" className="h-auto py-3 flex-col gap-1 bg-white/5 border-white/10 hover:bg-white/10" onClick={() => navigate(createPageUrl('Store') + `?game=${encodeURIComponent(item?.title || '')}`)}>
                    <ShoppingBag className="w-5 h-5 mb-1 opacity-70" /> 
                    <span className="text-xs">Store</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col gap-1 bg-white/5 border-white/10 hover:bg-white/10" onClick={() => navigate(createPageUrl('Community') + `?subview=game&game_title=${encodeURIComponent(item?.title || '')}`)}>
                    <MessageSquare className="w-5 h-5 mb-1 opacity-70" /> 
                    <span className="text-xs">Community</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col gap-1 bg-white/5 border-white/10 hover:bg-white/10" onClick={() => navigate(createPageUrl('Community') + `?subview=game&game_title=${encodeURIComponent(item?.title || '')}&topic=support`)}>
                    <LifeBuoy className="w-5 h-5 mb-1 opacity-70" /> 
                    <span className="text-xs">Support</span>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="dlc" className="space-y-4">
                <DLCList onSelectDLC={setSelectedDLC} />
                {selectedDLC && (
                  <div className="flex items-center justify-between p-3 border border-white/10 rounded-xl bg-white/5">
                    <div>
                      <p className="text-white text-sm font-semibold">{selectedDLC.name}</p>
                      <p className="text-white/60 text-xs">{item?.title || 'Game'} add-on</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold">$ {getDlcPrice(selectedDLC).toFixed(2)}</span>
                      <Button onClick={handleAddToCart}>Add to Cart</Button>
                    </div>
                  </div>
                )}
              </TabsContent>



              <TabsContent value="achievements" className="flex-1 flex flex-col min-h-0">
                <AnimatePresence mode="wait">
                  {!selectedMysteryCard ? (
                    <motion.div
                      key="grid"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1"
                    >
                      {/* Blank Mystery Cards - Smaller Grid */}
                      {Array.from({ length: 8 }).map((_, i) => (
                        <ShinyCard 
                          key={i} 
                          onClick={() => setSelectedMysteryCard(i)}
                          className="aspect-[2/3] bg-white/5 border border-white/10 flex items-center justify-center hover:border-white/30 transition-all shadow-lg hover:scale-95"
                        >
                          <div className="text-white/20 text-2xl font-light">?</div>
                        </ShinyCard>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="detail"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex-1 h-full"
                    >
                      <MysteryCardDetail 
                        card={{ id: selectedMysteryCard }} 
                        onBack={() => setSelectedMysteryCard(null)} 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="discussions" className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-white text-sm font-bold">Community Forum</h4>
                    <p className="text-white/50 text-xs">Recent discussions for {item?.title}</p>
                  </div>
                  <Button size="sm" onClick={() => setShowCreatePost(true)} className="gap-2">
                    <MessageSquare className="w-4 h-4" /> Create Post
                  </Button>
                </div>
                
                {/* Embedded Forum Topics */}
                <div className="space-y-3 pr-2 overflow-y-auto max-h-[350px] custom-scrollbar">
                  {posts.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                      <p className="text-white/50 text-sm">No discussions yet.</p>
                      <Button variant="link" onClick={() => setShowCreatePost(true)} className="text-cyan-400">Start a topic</Button>
                    </div>
                  )}
                  {posts.map((p) => (
                    <div key={p.id} className="p-4 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="text-white text-sm font-bold line-clamp-1">{p.title}</h5>
                        <Badge variant="outline" className="text-[10px] h-5 border-white/10 bg-black/20 text-white/60">{p.community || 'General'}</Badge>
                      </div>
                      {p.content && <p className="text-white/70 text-xs line-clamp-2 mb-3">{p.content}</p>}
                      
                      <div className="flex items-center gap-3 border-t border-white/5 pt-3">
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-white/50 hover:text-white" onClick={() => setReplyToId(replyToId === p.id ? null : p.id)}>
                          Reply
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-white/50 hover:text-white" onClick={() => navigate(createPageUrl('Community') + `?post=${p.id}`)}>
                          View Thread
                        </Button>
                      </div>

                      {replyToId === p.id && (
                        <div className="mt-3 pl-3 border-l-2 border-white/10">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full p-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs mb-2"
                            rows={2}
                          />
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setReplyToId(null); setReplyText(''); }}>Cancel</Button>
                            <Button size="sm" className="h-7 text-xs bg-cyan-600 hover:bg-cyan-700" onClick={() => handleReplySubmit(p.id)}>Post</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Create Post Modal (if needed) */}
          {showCreatePost && (
            <CreatePostForm 
              initialGameTitle={item?.title}
              onCancel={() => setShowCreatePost(false)}
              onSubmit={handleCreatePost}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}