import { ArrowRight } from 'lucide-react';
import { GameCard } from '@/components/store/redesign/StoreSections';

export default function StoreSection({ title, subtitle, games = [], onSelect, onViewAll, children }) {
  return (
    <section className="sf-section" aria-label={title}>
      <div className="sf-section-heading">
        <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        {onViewAll && <button onClick={onViewAll}>View all<ArrowRight size={14} /></button>}
      </div>
      {children || (
        <div className="sf-card-grid">
          {games.map(game => <GameCard key={game.id} game={game} onSelect={onSelect} />)}
        </div>
      )}
    </section>
  );
}