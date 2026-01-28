import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Radio, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DLCList, { DLC_DATA } from '@/components/game/DLCList';
import { useCart } from '@/components/CartContext';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function QuickInfoOverlay({ open, item, onClose, onPlay, onStream, onMoreInfo }) {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [selectedDLC, setSelectedDLC] = React.useState(null);
  const [posts, setPosts] = React.useState([]);
  const [replyToId, setReplyToId] = React.useState(null);
  const [replyText, setReplyText] = React.useState('');
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
  React.useEffect(() => {
    if (open) setActiveTab('overview');
  }, [open]);
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Right-side region overlay (from right edge to sidebar width) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 bottom-0 right-0 left-[320px] sm:left-[384px] z-[80]"
            onClick={onClose}
            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35))' }}
          />

          {/* Slide-in panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="fixed top-0 right-0 bottom-0 z-[90] w-full sm:w-[520px] md:w-[560px] border-l border-white/10"
            style={{
              background: 'rgba(20,24,34,0.85)',
              backdropFilter: 'blur(18px) saturate(160%)',
              WebkitBackdropFilter: 'blur(18px) saturate(160%)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.45)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
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
            <div className="relative h-44 sm:h-52 border-b border-white/10 overflow-hidden">
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="dlc">DLC</TabsTrigger>
                <TabsTrigger value="discussions">Discussions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl p-3 border border-white/10 bg-white/5">
                    <p className="text-white/50 text-xs">Type</p>
                    <p className="text-white font-medium capitalize">{item?.type || 'item'}</p>
                  </div>
                  <div className="rounded-xl p-3 border border-white/10 bg-white/5">
                    <p className="text-white/50 text-xs">Status</p>
                    <p className="text-white font-medium">Ready</p>
                  </div>
                </div>
                <div className="rounded-xl p-3 border border-white/10 bg-white/5 text-sm text-white/80">
                  {item?.type === 'game' && (
                    <p>Launch the game instantly or view more details before you jump in.</p>
                  )}
                  {item?.type === 'stream' && (
                    <p>Start watching the live channel or open the stream page for chat.</p>
                  )}
                  {item?.type === 'app' && (
                    <p>Open the entertainment app or read more about features.</p>
                  )}
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

              <TabsContent value="discussions" className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-white/70 text-xs">Top threads for {item?.title}</p>
                  <Button variant="outline" onClick={() => navigate(createPageUrl('Community') + `?subview=game&game_title=${encodeURIComponent(item?.title || '')}`)}>Open Forum</Button>
                </div>
                <div className="space-y-2">
                  {posts.length === 0 && (
                    <p className="text-white/50 text-sm">No recent threads found.</p>
                  )}
                  {posts.map((p) => (
                    <div key={p.id} className="p-3 border border-white/10 rounded-xl bg-white/5">
                      <p className="text-white text-sm font-semibold line-clamp-1">{p.title}</p>
                      {p.content && <p className="text-white/60 text-xs line-clamp-2 mt-1">{p.content}</p>}
                      <div className="mt-2 flex items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setReplyToId(replyToId === p.id ? null : p.id)}>Reply</Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate(createPageUrl('Community') + `?post=${p.id}`)}>Open</Button>
                      </div>
                      {replyToId === p.id && (
                        <div className="mt-2">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a quick reply..."
                            className="w-full p-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                            rows={3}
                          />
                          <div className="mt-2 flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setReplyToId(null); setReplyText(''); }}>Cancel</Button>
                            <Button size="sm" onClick={() => handleReplySubmit(p.id)}>Post Reply</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}