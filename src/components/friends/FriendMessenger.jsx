import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Mic, Phone, Video, Image as ImageIcon, Paperclip,
  Smile, Heart, ThumbsUp, MoreVertical, Search, Bell, PhoneOff, Eye, Gamepad2 } from
'lucide-react';
import { useAuth } from '../auth/AuthContext';

// Mock chat history data
const MOCK_CHAT_HISTORY = {
  'temp_logan': [
  { id: 1, text: "Hey! Want to squad up later?", sender: 'friend', timestamp: '10:30 AM', type: 'text' },
  { id: 2, text: "Yeah sure! What time?", sender: 'me', timestamp: '10:32 AM', type: 'text' },
  { id: 3, text: "Around 8pm?", sender: 'friend', timestamp: '10:33 AM', type: 'text' },
  { id: 4, text: "Perfect, see you then!", sender: 'me', timestamp: '10:35 AM', type: 'text' },
  { id: 5, text: "Check out this clip I got!", sender: 'friend', timestamp: '2:15 PM', type: 'video', mediaUrl: 'https://example.com/clip.mp4', thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' }],

  'temp_ariana': [
  { id: 1, text: "Did you finish that achievement?", sender: 'friend', timestamp: 'Yesterday', type: 'text' },
  { id: 2, text: "Not yet, so close though!", sender: 'me', timestamp: 'Yesterday', type: 'text' }]

};

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function FriendMessenger({ friend, onClose, compact = false, inline = false, showCallOverlay = false }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [onVoiceCall, setOnVoiceCall] = useState(false);
  const [onVideoCall, setOnVideoCall] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const screenShareStreamRef = useRef(null);
  const SpeechRecognition = useMemo(() => window.SpeechRecognition || window.webkitSpeechRecognition, []);

  // Load chat history on mount
  useEffect(() => {
    if (friend?.friend_id) {
      const history = MOCK_CHAT_HISTORY[friend.friend_id] || [];
      setMessages(history);
    }
  }, [friend]);

  useEffect(() => {
    const startVoice = () => handleVoiceCall();
    const startVideo = () => handleVideoCall();
    window.addEventListener('friendMessengerStartVoiceCall', startVoice);
    window.addEventListener('friendMessengerStartVideoCall', startVideo);
    return () => {
      window.removeEventListener('friendMessengerStartVoiceCall', startVoice);
      window.removeEventListener('friendMessengerStartVideoCall', startVideo);
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      stopScreenShare();
    };
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };

    setMessages((prev) => [...prev, message]);
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
      "Give me 5 mins"];

      const reply = {
        id: Date.now() + 1,
        text: replies[Math.floor(Math.random() * replies.length)],
        sender: 'friend',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      };
      setMessages((prev) => [...prev, reply]);
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
      setMessages((prev) => [...prev, message]);
    }
    fileInputRef.current.value = '';
  };

  const handleVoiceCall = () => {
    setOnVideoCall(false);
    setOnVoiceCall(true);
  };

  const handleVideoCall = () => {
    setOnVoiceCall(false);
    setOnVideoCall(true);
  };

  const stopScreenShare = () => {
    if (screenShareStreamRef.current) {
      screenShareStreamRef.current.getTracks().forEach((track) => track.stop());
      screenShareStreamRef.current = null;
    }
    setIsScreenSharing(false);
  };

  const handleToggleVoiceTyping = () => {
    if (!SpeechRecognition) return;

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0]?.transcript || '')
          .join(' ');
        setNewMessage(transcript.trim());
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current = recognition;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    recognitionRef.current.start();
    setIsListening(true);
  };

  const handleStartScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    screenShareStreamRef.current = stream;
    setIsScreenSharing(true);

    const [videoTrack] = stream.getVideoTracks();
    if (videoTrack) {
      videoTrack.onended = () => stopScreenShare();
    }
  };

  const handleEndCall = () => {
    setOnVoiceCall(false);
    setOnVideoCall(false);
    stopScreenShare();
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
        className={`flex gap-2 mb-4 ${isMe ? 'flex-row-reverse' : ''}`}>
        
        {/* Avatar */}
        <img
          src={isMe ? user?.avatar_url || `https://i.pravatar.cc/150?u=${user?.id}` : friend?.friend_avatar}
          alt=""
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-white/10" />
        
        
        <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
          {/* Message Bubble */}
          <div
            className={`relative px-4 py-2.5 rounded-2xl text-sm backdrop-blur-md ${
            isMe ?
            'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30 rounded-br-md' :
            'bg-white/10 text-white border border-white/10 rounded-bl-md'}`
            }>
            
            {msg.type === 'text' && <p className="leading-relaxed">{msg.text}</p>}
            
            {msg.type === 'image' &&
            <div className="space-y-2">
                <img src={msg.mediaUrl} alt="" className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity" />
                {msg.fileName && <p className="text-xs text-white/50">{msg.fileName}</p>}
              </div>
            }
            
            {msg.type === 'video' &&
            <div className="space-y-2">
                <div className="relative rounded-lg overflow-hidden bg-black/50">
                  {msg.thumbnail &&
                <img src={msg.thumbnail} alt="" className="w-full h-auto" />
                }
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                {msg.fileName && <p className="text-xs text-white/50">{msg.fileName}</p>}
              </div>
            }

            {/* Timestamp */}
            <span className="text-[10px] text-white/40 mt-1 block text-right">{msg.timestamp}</span>
          </div>
        </div>
      </motion.div>);

  };

  const CallOverlay = ({ type }) =>
  <AnimatePresence>
      {(showCallOverlay || onVoiceCall || onVideoCall) &&
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl px-6">
          <div className="text-center space-y-6 w-full max-w-md">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-cyan-500/50 mx-auto">
              <img src={friend?.friend_avatar} alt="" className="w-full h-full object-cover" />
            </motion.div>

            <div>
              <h3 className="text-2xl font-bold text-white">{friend?.friend_name}</h3>
              <p className="text-white/50 mt-1">
                {type === 'video' ? 'Video Call' : 'Voice Call'}
                {isScreenSharing ? ' • Screen sharing' : ''}
              </p>
            </div>

            {type === 'video' && (
              <div className="w-full h-44 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 rounded-xl border border-white/10 flex items-center justify-center">
                <Video className="w-12 h-12 text-violet-300" />
              </div>
            )}

            <div className="flex items-center gap-4 justify-center">
              <button
                onClick={handleToggleVoiceTyping}
                className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Mic className={`w-6 h-6 ${isListening ? 'text-emerald-300' : 'text-white'}`} />
              </button>
              <button
                onClick={handleStartScreenShare}
                className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Eye className={`w-6 h-6 ${isScreenSharing ? 'text-cyan-300' : 'text-white'}`} />
              </button>
              <button
                onClick={() => {
                  handleEndCall();
                  if (showCallOverlay) onClose();
                }}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">
                <PhoneOff className="w-8 h-8 text-white" />
              </button>
              {type === 'voice' && (
                <button
                  onClick={() => {
                    setOnVoiceCall(false);
                    setOnVideoCall(true);
                  }}
                  className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Video className="w-6 h-6 text-white" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
    }
    </AnimatePresence>;


  return (
    <div className={`flex flex-col relative overflow-hidden ${inline ? 'h-full w-full bg-transparent' : compact ? 'h-full bg-[#0f1419]/95 backdrop-blur-xl border border-white/10 rounded-2xl' : 'h-[600px] w-[400px] bg-[#0f1419]/95 backdrop-blur-xl border border-white/10 rounded-2xl'}`}>
      <CallOverlay type={showCallOverlay ? 'voice' : onVoiceCall ? 'voice' : onVideoCall ? 'video' : null} />

      {/* Header */}
      





















































      

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ?
        <div className="flex flex-col items-center justify-center h-full text-white/30">
            <Heart className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">Start a conversation with {friend?.friend_name}</p>
          </div> :

        messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        }
        
        {isTyping &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-2 items-center">
          
            <img src={friend?.friend_avatar} alt="" className="w-8 h-8 rounded-full" />
            <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                className="w-2 h-2 bg-white/50 rounded-full" />
              
                <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 bg-white/50 rounded-full" />
              
                <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                className="w-2 h-2 bg-white/50 rounded-full" />
              
              </div>
            </div>
          </motion.div>
        }
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reactions */}
      <AnimatePresence>
        {showReactionPicker &&
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-20 left-4 flex gap-1 bg-black/80 backdrop-blur-xl px-3 py-2 rounded-full border border-white/10">
          
            {QUICK_REACTIONS.map((emoji) =>
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            className="text-xl hover:scale-125 transition-transform">
            
                {emoji}
              </button>
          )}
          </motion.div>
        }
      </AnimatePresence>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-white/10 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.45)', boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            
            <Paperclip className="w-5 h-5 text-white/60" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden" />
          
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/50 transition-colors" />
            
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors">
              
              <Smile className="w-5 h-5" />
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-lg shadow-cyan-500/20">
            
            <Send className="w-5 h-5 text-white" />
          </motion.button>
        </div>
        
        <div className="flex items-center gap-2 mt-2 text-xs text-white/40">
          <button className="hover:text-white/60 transition-colors flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" /> Image
          </button>
          <button className="hover:text-white/60 transition-colors flex items-center gap-1">
            <Video className="w-3.5 h-3.5" /> Video
          </button>
          <button onClick={handleToggleVoiceTyping} className="hover:text-white/60 transition-colors flex items-center gap-1">
            <Mic className="w-3.5 h-3.5" /> {isListening ? 'Listening' : 'Voice'}
          </button>
          <span className="flex-1" />
          <span>Press Enter to send</span>
        </div>
      </div>
    </div>);

}