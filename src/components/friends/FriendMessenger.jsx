import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, Phone, Video, PhoneOff, Eye, Gamepad2
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

// Mock chat history data
const MOCK_CHAT_HISTORY = {
  'temp_logan': [
    { id: 1, text: "Hey! Want to squad up later?", sender: 'friend', timestamp: '10:30 AM', type: 'text' },
    { id: 2, text: "Yeah sure! What time?", sender: 'me', timestamp: '10:32 AM', type: 'text' },
    { id: 3, text: "Around 8pm?", sender: 'friend', timestamp: '10:33 AM', type: 'text' },
    { id: 4, text: "Perfect, see you then!", sender: 'me', timestamp: '10:35 AM', type: 'text' },
    { id: 5, text: "Check out this clip I got!", sender: 'friend', timestamp: '2:15 PM', type: 'video', mediaUrl: 'https://example.com/clip.mp4', thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' },
  ],
  'temp_ariana': [
    { id: 1, text: "Did you finish that achievement?", sender: 'friend', timestamp: 'Yesterday', type: 'text' },
    { id: 2, text: "Not yet, so close though!", sender: 'me', timestamp: 'Yesterday', type: 'text' },
  ],
};

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function FriendMessenger({ friend, onClose, compact = false, showCallOverlay = false }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [onVoiceCall, setOnVoiceCall] = useState(false);
  const [onVideoCall, setOnVideoCall] = useState(false);
  const [onWatchTogether, setOnWatchTogether] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load chat history on mount
  useEffect(() => {
    if (friend?.friend_id) {
      const history = MOCK_CHAT_HISTORY[friend.friend_id] || [];
      setMessages(history);
    }
  }, [friend]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setIsTyping(true);

    // Simulate friend typing and reply
    setTimeout(() => {
      setIsTyping(false);
      const replies = [
        "Sounds good!",
        "I'm down for that!",
        "Let me finish this match first",
        "Haha nice!",
        "Wait, really? 😄",
        "Give me 5 mins"
      ];
      const reply = {
        id: Date.now() + 1,
        text: replies[Math.floor(Math.random() * replies.length)],
        sender: 'friend',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      };
      setMessages(prev => [...prev, reply]);
    }, 1500 + Math.random() * 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (isImage || isVideo) {
      const message = {
        id: Date.now(),
        sender: 'me',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: isImage ? 'image' : 'video',
        mediaUrl: URL.createObjectURL(file),
        fileName: file.name
      };
      setMessages(prev => [...prev, message]);
    }
    fileInputRef.current.value = '';
  };

  const handleVoiceCall = () => {
    setOnVoiceCall(true);
  };

  const handleVideoCall = () => {
    setOnVideoCall(true);
  };

  const handleWatchTogether = () => {
    setOnWatchTogether(true);
  };

  const handleEndCall = () => {
    setOnVoiceCall(false);
    setOnVideoCall(false);
    setOnWatchTogether(false);
  };

  const handleReaction = (emoji) => {
    // Add reaction to last message
    setShowReactionPicker(false);
  };

  const MessageBubble = ({ msg }) => {
    const isMe = msg.sender === 'me';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`flex gap-2 mb-4 ${isMe ? 'flex-row-reverse' : ''}`}
      >
        {/* Avatar */}
        <img
          src={isMe ? user?.avatar_url || `https://i.pravatar.cc/150?u=${user?.id}` : friend?.friend_avatar}
          alt=""
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-white/10"
        />
        
        <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
          {/* Message Bubble */}
          <div
            className={`relative px-4 py-2.5 rounded-2xl text-sm backdrop-blur-md ${
              isMe
                ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30 rounded-br-md'
                : 'bg-white/10 text-white border border-white/10 rounded-bl-md'
            }`}
          >
            {msg.type === 'text' && <p className="leading-relaxed">{msg.text}</p>}
            
            {msg.type === 'image' && (
              <div className="space-y-2">
                <img src={msg.mediaUrl} alt="" className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity" />
                {msg.fileName && <p className="text-xs text-white/50">{msg.fileName}</p>}
              </div>
            )}
            
            {msg.type === 'video' && (
              <div className="space-y-2">
                <div className="relative rounded-lg overflow-hidden bg-black/50">
                  {msg.thumbnail && (
                    <img src={msg.thumbnail} alt="" className="w-full h-auto" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                {msg.fileName && <p className="text-xs text-white/50">{msg.fileName}</p>}
              </div>
            )}

            {/* Timestamp */}
            <span className="text-[10px] text-white/40 mt-1 block text-right">{msg.timestamp}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  const CallOverlay = ({ type }) => (
    <AnimatePresence>
      {(showCallOverlay || onVoiceCall || onVideoCall || onWatchTogether) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl"
        >
          <div className="text-center space-y-6">
            {type !== 'watch' && !showCallOverlay && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-cyan-500/50 mx-auto"
              >
                <img src={friend?.friend_avatar} alt="" className="w-full h-full object-cover" />
              </motion.div>
            )}

            {showCallOverlay && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-cyan-500/50 mx-auto"
              >
                <img src={friend?.friend_avatar} alt="" className="w-full h-full object-cover" />
              </motion.div>
            )}

            <div>
              <h3 className="text-2xl font-bold text-white">{friend?.friend_name}</h3>
              <p className="text-white/50 mt-1">
                {showCallOverlay && 'Voice Call'}
                {type === 'voice' && !showCallOverlay && 'Voice Call'}
                {type === 'video' && 'Video Call'}
                {type === 'watch' && 'Watching Game'}
                • 00:{(Date.now() % 60).toString().padStart(2, '0')}
              </p>
            </div>

            {(type === 'watch' || showCallOverlay) && (
              <div className="w-64 h-36 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl border border-white/10 flex items-center justify-center">
                <div className="text-center">
                  <Gamepad2 className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-white/60">{friend?.current_game || 'Game Stream'}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 justify-center">
              <button className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Mic className="w-6 h-6 text-white" />
              </button>
              <button 
                onClick={() => {
                  handleEndCall();
                  if (showCallOverlay) onClose();
                }}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
              >
                <PhoneOff className="w-8 h-8 text-white" />
              </button>
              {type === 'voice' && (
                <button 
                  onClick={() => setOnVideoCall(true)}
                  className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Video className="w-6 h-6 text-white" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`flex flex-col ${compact ? 'h-full' : 'h-[600px] w-[400px]'} bg-[#0f1419]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden relative`}>
      <CallOverlay type={showCallOverlay ? 'voice' : onVoiceCall ? 'voice' : onVideoCall ? 'video' : onWatchTogether ? 'watch' : null} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={friend?.friend_avatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
            />
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0f1419] ${
              friend?.status === 'online' ? 'bg-green-500' : 
              friend?.status === 'away' ? 'bg-yellow-500' : 'bg-slate-500'
            }`} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{friend?.friend_name}</h3>
            <p className="text-xs text-white/50">
              {friend?.status === 'online' ? 'Online' : friend?.current_game ? `Playing ${friend.current_game}` : 'Offline'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleVoiceCall}
            className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center hover:bg-green-500/30 transition-colors group"
            title="Voice Call"
          >
            <Phone className="w-4 h-4 text-green-400 group-hover:text-green-300" />
          </button>
          <button 
            onClick={handleVideoCall}
            className="w-9 h-9 rounded-full bg-cyan-500/20 flex items-center justify-center hover:bg-cyan-500/30 transition-colors group"
            title="Video Call"
          >
            <Video className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
          </button>
          {friend?.current_game && (
            <button 
              onClick={handleWatchTogether}
              className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center hover:bg-purple-500/30 transition-colors group"
              title="Watch Game"
            >
              <Eye className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 bg-black/10" />
    </div>
  );
}