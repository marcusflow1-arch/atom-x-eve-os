import { ArrowRight, ArrowLeftRight, Layers, Store, Gamepad2 } from 'lucide-react';
import CollectibleCard, { CardArtwork } from './CollectibleCard';

export default function CardsHome({ genre, games, cards, onGameSelect, onViewSelect, isLoading, isError, onRetry }) {
  const showcase = [...cards].sort((a, b) => Number(b.isOwned) - Number(a.isOwned)).slice(0, 3);
  return <div className="cc-home cc-scroll">
    <section className="cc-home-hero">
      <div className="cc-home-copy"><p className="cc-eyebrow">Collect · Master · Trade</p><h1>Your play.<br /><em>Your legacy.</em></h1><p>Build a collection that tells your story. Explore achievement cards, grow your skills, and find your next trade.</p><button className="cc-button cc-button-primary" onClick={() => onViewSelect('achievements')}>Explore collection <ArrowRight size={15} /></button><div className="cc-home-stats"><span><strong>{cards.length}</strong> Cards to discover</span><span><strong>{cards.filter((card) => card.isOwned).length}</strong> Collected</span><span><strong>{games.length}</strong> {genre.name} games</span></div></div>
      <div className="cc-showcase" aria-label="Collection preview">{showcase.length ? showcase.map((card, index) => <div key={card.id} className="cc-showcase-slot" data-position={index}><CollectibleCard card={card} decorative /></div>) : <div className="cc-series-preview">{games.slice(0, 3).map((game) => <div key={game.id}><CardArtwork src={game.cover_image || game.cover} /><span>{game.title}</span></div>)}{!games.length && <Layers size={76} strokeWidth={0.7} />}</div>}<span className="cc-showcase-label">Achievement cards · {genre.name}</span></div>
    </section>
    <div className="cc-home-destinations">{[{ id: 'achievements', number: '01', title: 'The collection', text: 'Achievements, abilities & equipment', icon: Layers }, { id: 'blackmarket', number: '02', title: 'Black Market', text: 'Find cards. Explore sales & auctions.', icon: Store }, { id: 'tradingpost', number: '03', title: 'Trading Post', text: 'Connect with collectors. Make a trade.', icon: ArrowLeftRight }].map(({ id, number, title, text, icon: Icon }) => <button key={id} onClick={() => onViewSelect(id)}><span className="cc-destination-icon"><Icon size={22} strokeWidth={1.2} /></span><span><small>{number} / {id === 'achievements' ? 'Collect' : id === 'blackmarket' ? 'Exchange' : 'Connect'}</small><strong>{title}</strong><p>{text}</p></span><ArrowRight size={16} /></button>)}</div>
    <section className="cc-game-shelves"><div className="cc-section-heading"><div><p className="cc-eyebrow">Your next chapter</p><h2>{genre.name} games</h2></div><span>{games.length} games</span></div>
      {isError && <div className="cc-notice" role="alert">The game library could not be loaded. <button onClick={onRetry}>Try again</button></div>}
      {isLoading ? <p className="cc-empty" role="status">Loading games…</p> : <div className="cc-game-grid">{games.map((game) => <button key={game.id} onClick={() => onGameSelect(game)}><CardArtwork src={game.cover_image || game.cover} /><div><span>{game.genre || genre.name}</span><h3>{game.title}</h3><small>{cards.filter((card) => card.gameId === game.id).length} achievement cards</small></div><ArrowRight size={15} /></button>)}</div>}
      {!isLoading && !games.length && <div className="cc-empty"><Gamepad2 /><p>No games match this genre yet. Choose another genre above.</p></div>}
    </section>
  </div>;
}
