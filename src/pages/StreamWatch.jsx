import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  X, Send, Trophy, Users, Gift, Crown, Play, UserPlus, Heart, 
  Gamepad2, Calendar, Zap, Star, Shield, Target, Sparkles
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../components/auth/AuthContext';
import ViewerSeasonalPass from '../components/streaming/ViewerSeasonalPass';
import StreamerInfoSection from '../components/streaming/StreamerInfoSection';

const ChatMessage = ({ message }) => (
  <div className="text-sm mb-2">
    <span className="font-bold text-cyan-400 mr-2">{message.username}:</span>
    <span className="text-white/80">{message.content}</span>
  </div>
);

export default function StreamWatch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const streamerId = searchParams.get('id');
  const [viewState, setViewState] = useState('profile');
  const [chatMessage, setChatMessage] = useState('');
  const [streamer, setStreamer] = useState(null);
  const [stream, setStream] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerTier, setViewerTier] = useState(0);

  useEffect(() => {
    const loadStreamer = async () => {
      if (!streamerId) return;
      
      try {
        const users = await base44.entities.User.filter({ id: streamerId });
        if (users.length > 0) {
          setStreamer(users[0]);
        }
        
        const streams = await base44.entities.Stream.filter({ 
          streamer_id: streamerId,
          is_live: true 
        });
        if (streams.length > 0) {
          setStream(streams[0]);
        }

        const messages = await base44.entities.StreamChatMessage.filter(
          { stream_id: streams[0]?.id },
          '-created_date',
          30
        );
        setChatMessages(messages.reverse());
      } catch (error) {
        console.error('Failed to load streamer:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStreamer();
  }, [streamerId]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !isAuthenticated || !stream) return;

    await base44.entities.StreamChatMessage.create({
      stream_id: stream.id,
      user_id: user.id,
      username: user.username || user.full_name,
      content: chatMessage,
      message_type: 'text'
    });

    setChatMessages(prev => [...prev, {
      id: Date.now(),
      username: user.username || user.full_name,
      content: chatMessage,
      message_type: 'text'
    }]);
    setChatMessage('');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-white/40">Loading stream...</div>
      </div>
    );
  }

  if (!streamer || !stream) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <p className="text-white/60 mb-4">No active stream found</p>
          <button 
            onClick={() => navigate(-1)}
            className="text-cyan-400 hover:text-cyan-300"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (viewState === 'profile') {
    return (
      <div className="min-h-screen bg-[#050505] text-white pt-20">
        <div className="fixed top-6 left-6 z-50">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute inset-0 opacity-20 -z-10">
          <img src={streamer.avatar_url} className="w-full h-full object-cover blur-3xl scale-150" />
        </div>

        <div className="max-w-6xl mx-auto px-8 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
          >
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
              <img src={streamer.avatar_url} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
              
              {stream && (
                <div className="absolute top-6 left-6 px-4 py-2 bg-red-500 rounded-full flex items-center gap-2 font-bold shadow-lg">
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2 h-2 bg-white rounded-full" />
                  LIVE NOW
                </div>
              )}

              <div className="absolute bottom-8 left-8 right-8">
                <h1 className="text-5xl font-black text-white mb-3">{streamer.username || streamer.full_name}</h1>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
                    <Trophy className="w-4 h-4 inline mr-2 text-amber-400" />
                    <span className="text-sm font-bold text-amber-400">{streamer.stream_focus || 'Streamer'}</span>
                  </div>
                  {stream && (
                    <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
                      <Users className="w-4 h-4 inline mr-2" />
                      <span className="font-bold text-sm">{stream.viewer_count || 0}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 space-y-6">
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3">About</h3>
                  <p className="text-white/90 leading-relaxed text-lg">{streamer.bio || 'No bio available'}</p>
                </div>

                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3">Stream Schedule</h3>
                  <div className="flex items-center gap-2 text-white/80">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm">{streamer.schedule || 'No schedule set'}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button className="flex-1 py-2 px-4 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-medium transition-all flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add Friend
                  </button>
                  <button className="flex-1 py-2 px-4 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-300 text-sm font-medium transition-all flex items-center justify-center gap-2">
                    <Heart className="w-4 h-4" />
                    Follow
                  </button>
                </div>
              </div>

              {stream && (
                <motion.button
                  onClick={() => setViewState('stream')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-6 rounded-2xl font-black text-xl uppercase tracking-wider relative overflow-hidden group"
                  style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 1) 100%)',
                    boxShadow: '0 20px 60px rgba(239, 68, 68, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="relative z-10 flex items-center justify-center gap-3 text-white">
                    <Play className="w-6 h-6 fill-white" />
                    Enter Live Stream
                  </span>
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20">
      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl aspect-video relative">
              <img src={stream.preview_image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&h=900&fit=crop'} className="w-full h-full object-cover opacity-70" />
              <div className="absolute top-6 left-6 flex gap-3">
                <div className="bg-red-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2 h-2 bg-white rounded-full" />
                  LIVE
                </div>
                <div className="bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 border border-white/20">
                  <Users className="w-4 h-4" />
                  {stream.viewer_count || 0}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-4">
                <img src={streamer.avatar_url} className="w-14 h-14 rounded-2xl border-2 border-white/20" />
                <div>
                  <h2 className="text-2xl font-bold text-white">{stream.title}</h2>
                  <p className="text-white/60 text-sm">{streamer.username || streamer.full_name}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button className="px-5 py-2.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-300 font-medium transition-all flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Follow
                </button>
                <button className="px-5 py-2.5 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-300 font-medium transition-all flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Donate
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col h-[600px]">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-bold text-white">Live Chat</h3>
              <p className="text-white/40 text-xs mt-1">{stream.viewer_count || 0} watching</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {chatMessages.length > 0 ? (
                chatMessages.map(msg => <ChatMessage key={msg.id} message={msg} />)
              ) : (
                <p className="text-white/40 text-sm text-center mt-4">No messages yet</p>
              )}
            </div>
            
            {isAuthenticated ? (
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    placeholder="Say something..."
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
                  />
                  <button onClick={handleSendMessage} className="w-10 h-10 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-lg flex items-center justify-center text-cyan-400">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 border-t border-white/10 text-center">
                <p className="text-white/40 text-sm">Sign in to chat</p>
              </div>
            )}
          </div>
        </div>

        <StreamerInfoSection streamer={streamer} />
        <ViewerSeasonalPass currentTier={viewerTier} maxTier={30} streamerId={streamer.id} />

      </div>
    </div>
  );
}