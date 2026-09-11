import { Home, Trophy, Layers } from 'lucide-react';

export default function GenreBottomNav({ activeTab, onTabSelect, marketView }) {
  return <nav className="cc-bottom-nav" aria-label="Cards pages">{[{ id: 'achievements', label: 'Achievements', icon: Trophy }, { id: 'games', label: 'Home', icon: Home }, { id: 'skilltree', label: 'Skill Tree', icon: Layers }].map(({ id, label, icon: Icon }) => <button key={id} aria-pressed={marketView === 'cards' && activeTab === id} onClick={() => onTabSelect(id)}><Icon size={16} strokeWidth={1.5} /><span>{label}</span></button>)}</nav>;
}
