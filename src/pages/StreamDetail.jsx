
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Radio, Users, Eye, Heart, Share2, Gift, Flag, Settings,
  Mic, Send, Play, Volume2, VolumeX, Maximize, Crown, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../components/auth/AuthContext';
import { Stream } from '@/entities/Stream';
import { StreamChatMessage } from '@/entities/StreamChatMessage';
import { StreamFollow } from '@/entities/StreamFollow';
import { StreamDonation } from '@/entities/StreamDonation';
import { createPageUrl } from '@/utils';

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
  const { user, isAuthenticated } = useAuth();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const chatEndRef = useRef(null);
  const mediaRecorder = useRef(null);

  const query = new URLSearchParams(location.search);
  const streamId = query.get('id');

  const loadStreamData = useCallback(async () => {
    try {
      // In production: const streamData = await Stream.get(streamId);
      // For now, mock data
      const mockStream = {
        id: streamId,
        title: 'Epic Boss Battle - Come Watch!',
        streamer_id: 'user1',
        streamer_username: 'ProGamer2024',
        streamer_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop',
        game_id: 'sample_1',
        game_title: 'Cyberpunk 2088',
        viewer_count: 1247,
        tags: ['Action', 'RPG', 'Live'],
        mode: 'streaming',
        preview_image_url: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=1280&h=720&fit=crop',
        started_at: new Date().toISOString(),
        is_live: true,
        max_viewers: 1500,
        description: 'Taking on the final boss! This fight is going to be epic. Come hang out and chat!'
      };
      setStream(mockStream);
    } catch (error) {
      console.error('Error loading stream:', error);
    } finally {
      setLoading(false);
    }
  }, [streamId]);

  const loadChatMessages = useCallback(async () => {
    // Mock chat messages
    const mockMessages = [
      { id: '1', username: 'ChatFan', content: 'Good luck with the boss!', message_type: 'text' },
      { id: '2', username: 'GamerGirl', content: 'You got this!', message_type: 'text' },
      { id: '3', username: 'VoiceFan', content: '', message_type: 'voice', media_duration: 3000 },
      { id: '4', username: 'Supporter', content: 'Amazing stream!', message_type: 'donation', donation_amount: 5 }
    ];
    setChatMessages(mockMessages);
  }, []);

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
    if (!newMessage.trim() || !isAuthenticated) return;

    const message = {
      id: Date.now().toString(),
      username: user.username || user.full_name,
      content: newMessage,
      message_type: 'text'
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [newMessage, isAuthenticated, user]);

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

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Button variant="ghost" asChild>
            <Link to={createPageUrl('StreamingHub')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Streams
            </Link>
          </Button>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Flag className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <StreamPlayer 
              stream={stream} 
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            />
            
            {/* Stream Info */}
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">{stream.title}</h1>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img 
                    src={stream.streamer_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop'} 
                    alt={stream.streamer_username}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-lg">{stream.streamer_username}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {stream.viewer_count} viewers
                      </span>
                      <span>Started {new Date(stream.started_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
                
                {isAuthenticated && (
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleFollow}
                      variant={isFollowing ? "secondary" : "default"}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Heart className={`w-4 h-4 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    
                    <Button 
                      onClick={() => setShowDonateModal(true)}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Donate
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Tags and Game Info */}
              <div className="flex flex-wrap gap-2">
                {stream.game_title && (
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    Playing: {stream.game_title}
                  </Badge>
                )}
                {stream.tags?.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              
              {stream.description && (
                <p className="text-slate-300">{stream.description}</p>
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col h-full">
            <div className="p-4 border-b border-slate-700/50">
              <h3 className="font-bold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Live Chat ({stream.viewer_count})
              </h3>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-2">
              {chatMessages.map(message => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={chatEndRef} />
            </div>
            
            {isAuthenticated ? (
              <div className="p-4 border-t border-slate-700/50">
                <div className="flex gap-2">
                  <Input
                    placeholder="Send a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="bg-slate-900 border-slate-700"
                  />
                  <Button size="icon" onClick={handleSendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={isRecordingVoice ? "destructive" : "outline"}
                    onClick={handleVoiceMessage}
                  >
                    <Mic className={`w-4 h-4 ${isRecordingVoice ? 'animate-pulse' : ''}`} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 border-t border-slate-700/50 text-center">
                <p className="text-slate-400">Sign in to chat</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
