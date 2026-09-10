import React from 'react';
import { Shield, ArrowUpRight } from 'lucide-react';

export default function ClanHomeHeader({ clan, memberCount, strongholdEnabled, onToggleStronghold }) {
  const stats = [['Treasury', '1.45M'], ['Power', Math.floor((memberCount || 1) * 1250).toLocaleString()], ['Rank', 'Gold III'], ['Resources', '3,240']];
  return <header className="clan-home-header">
    <div className="clan-eyebrow">Your clan / Home</div>
    <div className="clan-home-identity">
      <div className="clan-emblem">{clan.icon ? <img src={clan.icon} alt="Clan emblem" /> : <Shield size={30} />}</div>
      <div className="min-w-0 flex-1"><h1>{clan.name}</h1><p className="clan-meta">Level {clan.level || 1}<span>·</span>{memberCount || 0}/50 members<span>·</span>12 online</p></div>
      <button type="button" className="clan-text-action" aria-pressed={strongholdEnabled} onClick={onToggleStronghold}>{strongholdEnabled ? 'Hide stronghold' : 'Stronghold'}<ArrowUpRight size={16} /></button>
    </div>
    {clan.description && <p className="clan-home-description">{clan.description}</p>}
    <dl className="clan-stats-line">{stats.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  </header>;
}