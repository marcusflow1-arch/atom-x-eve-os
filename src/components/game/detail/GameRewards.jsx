import { useState } from 'react';
import { Trophy, Zap, Shield, Users, Check, ArrowRight, ChevronDown } from 'lucide-react';
import useCardCollection from '@/components/cards/useCardCollection';
import { label } from '@/components/store/redesign/discovery';

const icons = { ability: Zap, equipment: Shield, companion: Users, pet: Users, mount: Users };
export default function GameRewards({ game }) {
  const [expanded, setExpanded] = useState(false), [category, setCategory] = useState('all');
  const collection = useCardCollection({ game_id: game.id });
  const rewards = collection.cards;
  const categories = ['all', ...new Set(rewards.map(reward => reward.card_type).filter(Boolean))];
  const filtered = rewards.filter(reward => category === 'all' || reward.card_type === category);
  return <section id="game-avatar-rewards" className="gd-rewards" aria-label="Expansions and cards">
    <div className="gd-section-heading"><div><span className="gd-eyebrow">Game card collection</span><h2>Expansions &amp; Cards</h2></div><Trophy size={27}/></div>
    {collection.isLoading ? <p className="gd-muted" role="status">Loading game cards…</p> : collection.isError ? <div role="alert"><p>Game cards couldn't load.</p><button className="gd-text-button" onClick={() => collection.refetch()}>Try again</button></div> : !rewards.length ? <p className="gd-muted">Cards for this game haven't been published yet.</p> : <>
      <div className="gd-reward-filters" aria-label="Reward categories">{categories.map(value => <button key={value} aria-pressed={category === value} onClick={() => { setCategory(value); setExpanded(false); }}>{value === 'all' ? 'All cards' : label(value)}<span>{value === 'all' ? rewards.length : rewards.filter(r => r.card_type === value).length}</span></button>)}</div>
      <div className="gd-reward-grid">{filtered.slice(0, expanded ? filtered.length : 4).map(card => { const Icon = icons[card.card_type] || Trophy; const image = card.image_url || card.image || ''; return <details key={card.id} className="gd-reward-card"><summary><span className="gd-reward-icon">{image ? <img src={image} alt="" loading="lazy" /> : <Icon size={20}/>}</span><span><small>{label(card.card_type)}{card.rarity ? ' · ' + card.rarity : ''}</small><strong>{card.name}</strong><em>{card.owned ? <><Check size={12}/>Owned</> : card.achievement_id ? 'Earn through its achievement' : 'Available through game progression'}</em></span><ChevronDown className="gd-reward-chevron" size={14}/></summary><div><p>{card.description || 'No description has been published yet.'}</p>{card.stats && Object.keys(card.stats).length > 0 && <p><strong>Stats:</strong> {Object.entries(card.stats).map(([key,value]) => `${key}: ${value}`).join(' · ')}</p>}{card.animation_effect && <p className="gd-reward-effect">Animated ability available with this card.</p>}</div></details>; })}</div>
      {filtered.length > 4 && <button className="gd-text-button gd-reward-more" onClick={() => setExpanded(value => !value)}>{expanded ? 'Show fewer cards' : 'Explore all ' + filtered.length + ' cards'}<ArrowRight size={14}/></button>}
    </>}
  </section>;
}
