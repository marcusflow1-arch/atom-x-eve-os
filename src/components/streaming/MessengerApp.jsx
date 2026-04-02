import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Paperclip, Smile, Phone, Video, Mic, MoreVertical,
  Search, Clock, MessageCircle
} from 'lucide-react';

// Mock friends data
const MOCK_FRIENDS = [
  { id: 1, name: 'IsabelX', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&q=80', status: 'online' },
  { id: 2, name: 'Alex Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&q=80', status: 'online' },
  { id: 3, name: 'Jordan Lee', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&q=80', status: 'away' },
  { id: 4, name: 'Maya Patel', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&q=80', status: 'online' },
  { id: 5, name: 'Sam Rivera', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=40&q=80', status: 'offline' },
];

// Mock conversations storage
const MOCK_CONVERSATIONS = {
  1: [
    { id: 1, sender: 'friend', content: 'yo did you beat that raid yet?', timestamp: new Date(Date.now() - 600000) },
    { id: 2, sender: 'you', content: 'yeah got it first try!', timestamp: new Date(Date.now() - 540000) },
  ],
  2: [
    { id: 1, sender: 'friend', content: 'Hey! How are you?', timestamp: new Date(Date.now() - 3600000) },
    { id: 2, sender: 'you', content: 'Doing great! You?', timestamp: new Date(Date.now() - 3540000) },
  ],
  3: [],
  4: [
    { id: 1, sender: 'friend', content: 'Check out this new game', timestamp: new Date(Date.now() - 86400000) },
  ],
  5: [],
};

function ChatArea({ friend, messages, onSendMessage, inputValue, setInputValue }) {
  const messagesEndRef = useRef(null);
  const [callActive, setCallActive] = useState(null); // 'voice', 'video', or null

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  if (callActive) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6" style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center">
          <img src={friend.avatar} alt={friend.name} className="w-full h-full rounded-full object-cover" />
        </div>
        <p className="text-xl font-bold text-white">{callActive === 'voice' ? '🎤 Voice Call' : '📹 Video Call'}</p>
        <p className="text-white/60">with {friend.name}</p>
        <button
          onClick={() => setCallActive(null)}
          className="mt-6 px-6 py-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all border border-red-500/30 font-semibold"
        >
          End Call
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/50">
            <MessageCircle className="w-12 h-12 mb-2" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2 ${msg.sender === 'you' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                  msg.sender === 'you'
                    ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-100'
                    : 'bg-white/10 border border-white/15 text-white'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-white/10">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setCallActive('voice')}
            className="p-2 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-all border border-white/10"
            title="Voice Call"
          >
            <Mic className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCallActive('video')}
            className="p-2 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-all border border-white/10"
            title="Video Call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-all border border-white/10"
            title="Attach File"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-all border border-white/10"
            title="Emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 outline-none bg-white/8 border border-white/10 focus:border-cyan-500/30"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="px-4 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 font-semibold text-cyan-400 hover:text-cyan-300 border border-cyan-500/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FriendsList({ friends, selectedFriendId, onSelectFriend, searchQuery, setSearchQuery }) {
  const filtered = friends.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="w-72 flex flex-col bg-white/5 border-r border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends..."
            className="w-full rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-white/30 outline-none bg-white/8 border border-white/10 focus:border-cyan-500/30"
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-white/50 text-sm">No friends found</div>
        ) : (
          filtered.map((friend) => (
            <button
              key={friend.id}
              onClick={() => onSelectFriend(friend)}
              className={`w-full px-4 py-3 flex items-center gap-3 transition-all border-l-2 ${
                selectedFriendId === friend.id
                  ? 'bg-cyan-500/10 border-cyan-500 text-white'
                  : 'border-transparent hover:bg-white/5 text-white/70 hover:text-white'
              }`}
            >
              <div className="relative flex-shrink-0">
                <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full object-cover" />
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white/20 ${
                    friend.status === 'online' ? 'bg-emerald-400' : friend.status === 'away' ? 'bg-yellow-400' : 'bg-white/30'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">{friend.name}</p>
                <p className="text-[10px] text-white/50">{friend.status}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function ChatHeader({ friend, onClose }) {
  return (
    <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10" />
        <div>
          <p className="text-base font-bold text-white">{friend.name}</p>
          <p className={`text-[10px] font-medium ${friend.status === 'online' ? 'text-emerald-400' : 'text-white/50'}`}>
            {friend.status === 'online' ? '🟢 Online' : '🔴 ' + friend.status}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all border border-white/10"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function MessengerApp({ onClose }) {
  const [selectedFriend, setSelectedFriend] = useState(MOCK_FRIENDS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);

  const handleSendMessage = (content) => {
    const newMessage = {
      id: (conversations[selectedFriend.id]?.length || 0) + 1,
      sender: 'you',
      content,
      timestamp: new Date(),
    };
    setConversations({
      ...conversations,
      [selectedFriend.id]: [...(conversations[selectedFriend.id] || []), newMessage],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="fixed z-[71] inset-0 flex overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(6, 8, 16, 0.95) 0%, rgba(10, 12, 22, 0.92) 100%)',
        backdropFilter: 'blur(60px) saturate(200%)',
        WebkitBackdropFilter: 'blur(60px) saturate(200%)',
      }}
    >
      <FriendsList
        friends={MOCK_FRIENDS}
        selectedFriendId={selectedFriend.id}
        onSelectFriend={setSelectedFriend}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="flex-1 flex flex-col">
        <ChatHeader friend={selectedFriend} onClose={onClose} />
        <ChatArea
          friend={selectedFriend}
          messages={conversations[selectedFriend.id] || []}
          onSendMessage={handleSendMessage}
          inputValue={inputValue}
          setInputValue={setInputValue}
        />
      </div>
    </motion.div>
  );
}