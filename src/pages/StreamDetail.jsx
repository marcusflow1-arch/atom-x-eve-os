import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Radio, Users, Eye, Heart, Share2, Gift, Flag, Settings,
  Mic, Send, Play, Volume2, VolumeX, Maximize, Crown, Star, X, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../components/auth/AuthContext';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import StreamerProfilePreview from '../components/streaming/StreamerProfilePreview';
import ViewerSeasonalPass from '../components/streaming/ViewerSeasonalPass';
import StreamerInfoSection from '../components/streaming/StreamerInfoSection';

const ChatMessage = ({ message }) => {
  const isVoice = message.message_type === 'voice';
  const isDonation = message.message_type === 'donation';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-2 rounded-lg mb-2 ${
        isDonation ? 'bg-yellow-500/20 border border-yellow-500/50' : 
        isVoice ? 'bg-blue-900/30' : 'bg-slate-800/50'
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-xs font-bold">
          {message.username?.charAt(0) || '?'}
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-blue-300 text-sm">{message.username}</span>
            {isDonation && (
              <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                <Gift className="w-3 h-3 mr-1" />
                ${message.donation_amount} AGP
              </Badge>
            )}
          </div>
          
          {isVoice ? (
            <div className="flex items-center gap-2 cursor-pointer group">
              <Play className="w-4 h-4 text-slate-300 group-hover:text-white" />
              <div className="w-16 h-2 bg-slate-600 rounded-full">
                <div className="w-8 h-2 bg-blue-400 rounded-full"></div>
              </div>
              <span className="text-xs text-slate-400">{(message.media_duration / 1000).toFixed(1)}s</span>
            </div>
          ) : (
            <p className="text-slate-200 text-sm break-words">{message.content}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const StreamPlayer = ({ stream, isFullscreen, onToggleFullscreen }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video'}`}>
      {/* Mock Stream Video */}
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
        <img 
          src={stream.preview_image_url || 'https://images.unsplash.com/photo-1542751371-331572b78519?w=1280&h=720&fit=crop'} 
          alt="Stream" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Live Indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full font-bold">
          <Radio className="w-4 h-4 animate-pulse" />
          LIVE
        </div>
        
        {/* Viewer Count */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/70 text-white px-3 py-1 rounded-full">
          <Eye className="w-4 h-4" />
          {stream.viewer_count?.toLocaleString()}
        </div>
      </div>
      
      {/* Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsMuted(!isMuted)}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            
            <div className="w-20 h-2 bg-white/30 rounded-full cursor-pointer">
              <div 
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${volume}%` }}
              ></div>
            </div>
          </div>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleFullscreen}
            className="text-white hover:bg-white/20"
          >
            <Maximize className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function StreamDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [viewState, setViewState] = useState('profile'); // 'profile' or 'stream'
  const [viewerTier, setViewerTier] = useState(12);
  const chatEndRef = useRef(null);
  const mediaRecorder = useRef(null);

  const query = new URLSearchParams(location.search);
  const streamId = query.get('id');

  const loadStreamData = useCallback(async () => {
    try {
      // Try to fetch real stream
      const streams = await base44.entities.Stream.filter({ id: streamId });
      if (streams.length > 0) {
        setStream(streams[0]);
      } else {
        // Mock data fallback
        const mockStream = {
          id: streamId,
          title: 'Epic Boss Battle - Come Watch!',
          streamer_id: 'user1',
          name: 'ProGamer Elite',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
          game_title: 'Cyberpunk 2088',
          viewer_count: 1247,
          tags: ['Action', 'RPG', 'Live'],
          focus: 'Card Collector',
          bio: 'Tactical genius with a love for high-stakes plays. I hunt rare weapon skins and coach new players.',
          recent_games: ['Valorant', 'Apex Legends', 'The Finals'],
          schedule: 'Mon-Fri 7PM EST',
          preview_image_url: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=1280&h=720&fit=crop',
          started_at: new Date().toISOString(),
          is_live: true,
          max_viewers: 1500,
          description: 'Taking on the final boss! This fight is going to be epic. Come hang out and chat!',
          why_stream: "I love connecting with people who share my passion for gaming."
        };
        setStream(mockStream);
      }
    } catch (error) {
      console.error('Error loading stream:', error);
    } finally {
      setLoading(false);
    }
  }, [streamId]);

  const loadChatMessages = useCallback(async () => {
    try {
      const messages = await base44.entities.StreamChatMessage.filter(
        { stream_id: streamId },
        '-created_date',
        50
      );
      setChatMessages(messages.reverse());
    } catch (error) {
      // Fallback to mock
      const mockMessages = [
        { id: '1', username: 'ChatFan', content: 'Good luck with the boss!', message_type: 'text', user_id: 'u1' },
        { id: '2', username: 'GamerGirl', content: 'You got this!', message_type: 'text', user_id: 'u2' },
        { id: '3', username: 'VoiceFan', content: '', message_type: 'voice', media_duration: 3000, user_id: 'u3' },
        { id: '4', username: 'Supporter', content: 'Amazing stream!', message_type: 'donation', donation_amount: 5, user_id: 'u4' }
      ];
      setChatMessages(mockMessages);
    }
  }, [streamId]);

  const simulateRealTimeUpdates = useCallback(() => {
    // Simulate periodic viewer count updates
    const interval = setInterval(() => {
      setStream(prev => {
        if (prev) {
          const change = Math.floor(Math.random() * 20) - 10;
          return {
            ...prev,
            viewer_count: Math.max(0, prev.viewer_count + change)
          };
        }
        return prev;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []); // setStream is a stable reference, so no need to add to deps

  useEffect(() => {
    if (streamId) {
      loadStreamData();
      loadChatMessages();
      const cleanup = simulateRealTimeUpdates();
      return cleanup;
    }
  }, [streamId, loadStreamData, loadChatMessages, simulateRealTimeUpdates]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !isAuthenticated || !stream) return;

    try {
      await base44.entities.StreamChatMessage.create({
        stream_id: stream.id,
        user_id: user.id,
        username: user.username || user.full_name,
        content: newMessage,
        message_type: 'text'
      });

      const message = {
        id: Date.now().toString(),
        username: user.username || user.full_name,
        content: newMessage,
        message_type: 'text',
        user_id: user.id
      };

      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [newMessage, isAuthenticated, user, stream]);

  const handleVoiceMessage = useCallback(async () => {
    if (!isAuthenticated) return;

    if (!isRecordingVoice) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream);
        
        const audioChunks = [];
        mediaRecorder.current.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.current.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          // In production, upload audioBlob to server and get URL
          const message = {
            id: Date.now().toString(),
            username: user.username || user.full_name,
            content: '',
            message_type: 'voice',
            media_duration: 2500
          };
          setChatMessages(prev => [...prev, message]);
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        };

        mediaRecorder.current.start();
        setIsRecordingVoice(true);

        // Auto-stop after 10 seconds
        setTimeout(() => {
          if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop();
            setIsRecordingVoice(false);
          }
        }, 10000);
        
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    } else {
      // Stop recording
      if (mediaRecorder.current) {
        mediaRecorder.current.stop();
        setIsRecordingVoice(false);
      }
    }
  }, [isAuthenticated, isRecordingVoice, user]);

  const handleFollow = useCallback(async () => {
    if (!isAuthenticated || !stream) return;
    
    try {
      if (isFollowing) {
        // Unfollow logic
        // await StreamFollow.delete({ user_id: user.id, streamer_id: stream.streamer_id });
      } else {
        // Follow logic
        // await StreamFollow.create({ user_id: user.id, streamer_id: stream.streamer_id });
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  }, [isAuthenticated, stream, isFollowing]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
        <h1 className="text-4xl font-bold mb-4">Stream Not Found</h1>
        <p className="text-slate-400 mb-8">This stream may have ended or doesn't exist.</p>
        <Button asChild>
          <Link to={createPageUrl('StreamingHub')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Streams
          </Link>
        </Button>
      </div>
    );
  }

  if (viewState === 'profile') {
    return (
      <StreamerProfilePreview 
        streamer={stream}
        onEnterStream={() => setViewState('stream')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Back Button */}
      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Stream + Chat Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Stream Player - 3 columns */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <StreamPlayer 
                stream={stream} 
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              />
            </div>

            {/* Streamer Header Info */}
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-4">
                <img 
                  src={stream.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop'} 
                  alt={stream.name}
                  className="w-14 h-14 rounded-full border-2 border-white/20"
                />
                <div>
                  <h1 className="text-2xl font-bold text-white">{stream.title}</h1>
                  <p className="text-white/60 text-sm">{stream.name}</p>
                </div>
              </div>
              
              {isAuthenticated && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleFollow}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      isFollowing 
                        ? 'bg-white/10 border border-white/20 text-white' 
                        : 'bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  
                  <button 
                    onClick={() => setShowDonateModal(true)}
                    className="px-4 py-2 rounded-lg font-medium bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30 transition-all flex items-center gap-2"
                  >
                    <Gift className="w-4 h-4" />
                    Donate
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chat Panel - 1 column */}
          <div className="lg:col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col h-[800px]">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-bold flex items-center gap-2 text-white">
                <Users className="w-5 h-5" />
                Stream Chat
              </h3>
              <p className="text-white/40 text-xs mt-1">{stream.viewer_count} watching</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {chatMessages.map(message => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={chatEndRef} />
            </div>
            
            {isAuthenticated ? (
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    placeholder="Say something..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="w-10 h-10 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-lg flex items-center justify-center text-cyan-400 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleVoiceMessage}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                      isRecordingVoice 
                        ? 'bg-red-500/30 border-red-500/50 text-red-400 animate-pulse' 
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/60'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 border-t border-white/10 text-center">
                <p className="text-white/40 text-sm">Sign in to participate in chat</p>
              </div>
            )}
          </div>
        </div>

        {/* Streamer Info Section */}
        <StreamerInfoSection streamer={stream} />

        {/* Viewer Seasonal Pass */}
        <ViewerSeasonalPass 
          currentTier={viewerTier} 
          maxTier={30}
          streamerId={stream.streamer_id}
        />
      </div>
    </div>
  );
}