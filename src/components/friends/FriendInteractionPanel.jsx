import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Users, UserPlus, UserMinus, Heart, Gamepad2, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function FriendInteractionPanel({ friend, onClose, currentUserId }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [party, setParty] = useState(null);

  const conversationId = [currentUserId, friend.friend_id].sort().join('-');

  useEffect(() => {
    if (activeTab === 'messages') {
      loadMessages();
    }
  }, [activeTab]);

  const loadMessages = async () => {
    try {
      const msgs = await base44.entities.DirectMessage.filter({
        conversation_id: conversationId
      });
      setMessages(msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await base44.entities.DirectMessage.create({
        sender_id: currentUserId,
        receiver_id: friend.friend_id,
        content: newMessage,
        conversation_id: conversationId
      });
      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const inviteToParty = async () => {
    try {
      // Check if user has active party
      const userParties = await base44.entities.PartyMember.filter({
        user_id: currentUserId
      });

      let targetParty = null;
      if (userParties.length > 0) {
        const partyData = await base44.entities.Party.filter({
          id: userParties[0].party_id,
          status: 'active'
        });
        targetParty = partyData[0];
      }

      // Create new party if none exists
      if (!targetParty) {
        const newParty = await base44.entities.Party.create({
          leader_id: currentUserId,
          party_name: 'Party',
          is_public: false
        });
        
        await base44.entities.PartyMember.create({
          party_id: newParty.id,
          user_id: currentUserId,
          user_name: 'You'
        });
        
        targetParty = newParty;
      }

      // Add friend to party
      await base44.entities.PartyMember.create({
        party_id: targetParty.id,
        user_id: friend.friend_id,
        user_name: friend.friend_name,
        user_avatar: friend.friend_avatar
      });

      alert(`Invited ${friend.friend_name} to party!`);
    } catch (error) {
      console.error('Failed to invite to party:', error);
    }
  };

  const removeFriend = async () => {
    if (!confirm(`Remove ${friend.friend_name} from friends?`)) return;

    try {
      await base44.entities.Friend.delete(friend.id);
      onClose();
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={friend.friend_avatar} alt={friend.friend_name} className="w-16 h-16 rounded-full" />
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${
                friend.status === 'online' ? 'bg-green-500' : friend.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
              }`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{friend.friend_name}</h2>
              {friend.current_game && (
                <p className="text-blue-400 text-sm flex items-center gap-1">
                  <Gamepad2 className="w-4 h-4" />
                  {friend.current_game}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6">
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'messages', label: 'Messages' },
            { id: 'actions', label: 'Actions' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-semibold transition-colors relative ${
                activeTab === tab.id ? 'text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold">Status</label>
                  <p className="text-white capitalize">{friend.status}</p>
                </div>
                {friend.current_game && (
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold">Playing</label>
                    <p className="text-white">{friend.current_game}</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'messages' && (
              <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-4">
                <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender_id === currentUserId
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-white'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-60 mt-1">
                          {new Date(msg.created_date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'actions' && (
              <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-3">
                <button
                  onClick={inviteToParty}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
                >
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>Invite to Party</span>
                </button>
                <button
                  onClick={removeFriend}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                >
                  <UserMinus className="w-5 h-5" />
                  <span>Remove Friend</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}