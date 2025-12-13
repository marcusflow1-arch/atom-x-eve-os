import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function FriendRequestsPanel({ currentUserId }) {
  const [requests, setRequests] = useState([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendName, setFriendName] = useState('');

  useEffect(() => {
    loadRequests();
  }, [currentUserId]);

  const loadRequests = async () => {
    try {
      const reqs = await base44.entities.FriendRequest.filter({
        receiver_id: currentUserId,
        status: 'pending'
      });
      setRequests(reqs);
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
  };

  const sendFriendRequest = async () => {
    if (!friendName.trim()) return;

    try {
      const user = await base44.auth.me();
      await base44.entities.FriendRequest.create({
        sender_id: currentUserId,
        sender_name: user.full_name || user.email,
        sender_avatar: user.avatar_url || 'https://i.pravatar.cc/150',
        receiver_id: friendName, // In real app, would search by username
        message: 'Would like to add you as a friend'
      });
      setFriendName('');
      setShowAddFriend(false);
      alert('Friend request sent!');
    } catch (error) {
      console.error('Failed to send request:', error);
    }
  };

  const acceptRequest = async (request) => {
    try {
      await base44.entities.FriendRequest.update(request.id, { status: 'accepted' });
      
      const user = await base44.auth.me();
      
      await base44.entities.Friend.create({
        user_id: currentUserId,
        friend_id: request.sender_id,
        friend_name: request.sender_name,
        friend_avatar: request.sender_avatar,
        status: 'online'
      });

      await base44.entities.Friend.create({
        user_id: request.sender_id,
        friend_id: currentUserId,
        friend_name: user.full_name || user.email,
        friend_avatar: user.avatar_url || 'https://i.pravatar.cc/150',
        status: 'online'
      });

      loadRequests();
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const declineRequest = async (request) => {
    try {
      await base44.entities.FriendRequest.update(request.id, { status: 'declined' });
      loadRequests();
    } catch (error) {
      console.error('Failed to decline request:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Friend Requests</h3>
        <button
          onClick={() => setShowAddFriend(!showAddFriend)}
          className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
        >
          <UserPlus className="w-4 h-4 text-white" />
        </button>
      </div>

      {showAddFriend && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="overflow-hidden"
        >
          <div className="flex gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
            <input
              type="text"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              placeholder="Enter username or email"
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={sendFriendRequest}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm transition-colors"
            >
              Send
            </button>
          </div>
        </motion.div>
      )}

      {requests.length === 0 ? (
        <p className="text-white/40 text-sm text-center py-4">No pending requests</p>
      ) : (
        <div className="space-y-2">
          {requests.map(req => (
            <div key={req.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <img src={req.sender_avatar} alt={req.sender_name} className="w-10 h-10 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{req.sender_name}</p>
                {req.message && <p className="text-white/60 text-xs truncate">{req.message}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => acceptRequest(req)}
                  className="w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors"
                >
                  <Check className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => declineRequest(req)}
                  className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}