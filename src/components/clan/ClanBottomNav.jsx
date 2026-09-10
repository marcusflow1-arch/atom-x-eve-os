import React from 'react';
import { Home, Users, MessageSquare, TrendingUp, Zap, ClipboardList, Shield } from 'lucide-react';

export default function ClanBottomNav({ activeTab, onTabSelect, isRosterOpen, onToggleRoster, isStrongholdEnabled, isPrivileged }) {
  const tabs = [
    { id: 'games_chat', label: 'Game Chats', icon: MessageSquare },
    { id: 'home', label: isStrongholdEnabled ? 'Stronghold' : 'Homepage', icon: Home },
    ...(isPrivileged ? [{ id: 'admin_overview', label: 'Admin Overview', icon: Shield }] : []),
  ];
  return <nav className="clan-nav" aria-label="Clan sections">
    {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={activeTab === id ? 'page' : undefined} onClick={() => onTabSelect(id)}><Icon size={15} /><span>{label}</span></button>)}
  </nav>;
}