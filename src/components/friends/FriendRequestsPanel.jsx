import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { showError, showSuccess } from '@/components/error/ErrorToast';

export default function FriendRequestsPanel({ currentUserId }) {
  const [requests, setRequests] = useState([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [sending, setSending] = useState(false);

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
    const query = friendName.trim();
    if (!query || sending) return;

    setSending(true);
    try {
      const users = await base44.entities.User.list();
      const normalized = query.toLowerCase();
      const target = (users || []).find((candidate) => {
        if (String(candidate.id || '') === query) return true;
        return [candidate.email, candidate.username, candidate.full_name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase() === normalized);
      });

      if (!target?.id) throw new Error('No user was found with that username or email.');
      if (String(target.id) === String(currentUserId)) throw new Error('You cannot add yourself as a friend.');

      const response = await base44.functions.invoke('socialActions', {
        action: 'send_friend_request',
        data: { target_user_id: target.id },
      });
      const body = response?.data ?? response ?? {};
      if (body?.error) throw new Error(body.error);

      setFriendName('');
      setShowAddFriend(false);
      if (body.accepted || body.already_friends) {
        window.dispatchEvent(new CustomEvent('lunaSocialChanged', { detail: { type: 'friendship', friendId: String(target.id) } }));
        showSuccess(`${target.username || target.full_name || 'Player'} is now in your Friends list.`);
      } else {
        showSuccess(`Friend request sent to ${target.username || target.full_name || 'player'}.`);
      }
    } catch (error) {
      showError(error, 'Friend Request');
    } finally {
      setSending(false);
    }
  };

  const acceptRequest = async (request) => {
    try {
      const response = await base44.functions.invoke('socialActions', {
        action: 'respond_friend_request',
        data: { request_id: request.id, decision: 'accept' },
      });
      const body = response?.data ?? response ?? {};
      if (body?.error) throw new Error(body.error);
      await loadRequests();
      window.dispatchEvent(new CustomEvent('lunaSocialChanged', { detail: { type: 'friend-request', accepted: true, requestId: request.id } }));
      showSuccess(`${request.sender_name || 'Player'} was added to your Friends list.`);
    } catch (error) {
      showError(error, 'Accept Friend Request');
    }
  };

  const declineRequest = async (request) => {
    try {
      const response = await base44.functions.invoke('socialActions', {
        action: 'respond_friend_request',
        data: { request_id: request.id, decision: 'decline' },
      });
      const body = response?.data ?? response ?? {};
      if (body?.error) throw new Error(body.error);
      await loadRequests();
      window.dispatchEvent(new CustomEvent('lunaSocialChanged', { detail: { type: 'friend-request', accepted: false, requestId: request.id } }));
    } catch (error) {
      showError(error, 'Decline Friend Request');
    }
  };

  const pointerAction = (action) => ({
    onPointerDown: (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      action();
    },
    onClick: (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.detail === 0) action();
    },
  });

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
              {...pointerAction(sendFriendRequest)}
              disabled={sending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send'}
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
                  {...pointerAction(() => acceptRequest(req))}
                  className="w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors"
                >
                  <Check className="w-4 h-4 text-white" />
                </button>
                <button
                  {...pointerAction(() => declineRequest(req))}
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