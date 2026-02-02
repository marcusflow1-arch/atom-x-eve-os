import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { createPageUrl } from '@/utils';
import { Users, UserPlus, Gamepad2, Circle } from 'lucide-react';

export default function FriendsDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('online'); // 'online' | 'all' | 'requests'
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      try {
        const [friendsList, requestsList] = await Promise.all([
          base44.entities.Friend.filter({ user_id: user.id }),
          base44.entities.FriendRequest.filter({ receiver_id: user.id, status: 'pending' })
        ]);
        setFriends(friendsList);
        setRequests(requestsList);
      } catch (error) {
        console.error("Failed to load friends data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const onlineFriends = friends.filter(f => f.status === 'online');
  const displayFriends = activeTab === 'online' ? onlineFriends : friends;

  const handleProfileClick = (friendId) => {
    navigate(createPageUrl('PlayerProfile') + `?userId=${encodeURIComponent(friendId)}`);
  };

  const TabButton = ({ id, label, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-2 ${
        activeTab === id
          ? 'bg-white/15 text-white border-white/20'
          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === id ? 'bg-white/20' : 'bg-white/10'}`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="w-full">
      {/* Tabs header */}
      <div className="flex items-center gap-2 p-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <TabButton id="online" label="Online" count={onlineFriends.length} />
        <TabButton id="all" label="All" count={friends.length} />
        <TabButton id="requests" label="Requests" count={requests.length} />
      </div>

      {/* Content */}
      <div className="mt-2 px-2 max-h-64 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="py-4 text-center text-white/40 text-xs">Loading...</div>
        ) : (
          <div className="space-y-2 pb-2">
            {activeTab === 'requests' ? (
              requests.length === 0 ? (
                <div className="py-4 text-center text-white/40 text-xs">No pending requests</div>
              ) : (
                requests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                        {req.sender_avatar ? (
                          <img src={req.sender_avatar} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">{req.sender_name?.[0]}</div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-white">{req.sender_name}</span>
                    </div>
                    <button className="text-xs text-blue-300 hover:text-blue-200">Accept</button>
                  </div>
                ))
              )
            ) : (
              displayFriends.length === 0 ? (
                <div className="py-4 text-center text-white/40 text-xs">
                  {activeTab === 'online' ? 'No friends online' : 'No friends found'}
                </div>
              ) : (
                displayFriends.map(friend => (
                  <div 
                    key={friend.id} 
                    onClick={() => handleProfileClick(friend.friend_id)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors border border-transparent hover:border-white/10"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden ring-1 ring-white/10">
                        {friend.friend_avatar ? (
                          <img src={friend.friend_avatar} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                            {friend.friend_name?.[0]}
                          </div>
                        )}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                        friend.status === 'online' ? 'bg-green-500' : 
                        friend.status === 'away' ? 'bg-yellow-500' : 'bg-slate-500'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{friend.friend_name}</div>
                      {friend.current_game ? (
                        <div className="flex items-center gap-1 text-[10px] text-green-400 truncate">
                          <Gamepad2 className="w-3 h-3" />
                          {friend.current_game}
                        </div>
                      ) : (
                        <div className="text-[10px] text-white/40 truncate">
                          {friend.status === 'online' ? 'Online' : 'Offline'}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}