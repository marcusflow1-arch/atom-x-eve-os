import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { CreditCard, Loader2, Play } from 'lucide-react';
import useCardCollection from '@/components/cards/useCardCollection';

const PlayerPreview = lazy(() => import('@/components/3d/StoreIdleViewer'));

export default function GameExtras({ game }) {
  const collection = useCardCollection({ game_id: game.id });
  const [selectedCardId, setSelectedCardId] = useState('');
  const [castNonce, setCastNonce] = useState(0);
  const cards = collection.cards;
  const sortedCards = useMemo(() => [...cards].sort((a, b) => String(a.card_type || '').localeCompare(String(b.card_type || '')) || String(a.name || '').localeCompare(String(b.name || ''))), [cards]);
  useEffect(() => {
    if (!selectedCardId && sortedCards[0]) setSelectedCardId(sortedCards[0].id);
  }, [selectedCardId, sortedCards]);
  const selected = sortedCards.find((card) => String(card.id) === String(selectedCardId)) || sortedCards[0] || null;
  const previewEffect = selected?.animation_effect ? { ...selected.animation_effect, preview_nonce: castNonce } : null;

  return <div className="gd-expansions-cards">
    <section className="gd-expansions-card-library">
      <div className="gd-section-heading"><div><span className="gd-eyebrow">Game card collection</span><h2>Expansions &amp; Cards</h2><p>The same published card records used by your collection and Luna loadouts.</p></div></div>
      {collection.isLoading ? <p className="gd-empty" role="status">Loading cards…</p> : collection.isError ? <div className="gd-inline-error" role="alert">Cards could not be loaded. <button className="gd-text-button" onClick={() => collection.refetch()}>Try again</button></div> : !sortedCards.length ? <p className="gd-muted">No cards have been published for this game yet.</p> : <div className="gd-expansion-card-grid">{sortedCards.map(card => <button type="button" key={card.id} className="gd-expansion-card" onClick={() => { setSelectedCardId(card.id); if (card.animation_effect) setCastNonce(value => value + 1); }} aria-pressed={selected?.id === card.id}>
        <div className="gd-expansion-card-art">{card.image_url ? <img src={card.image_url} alt="" loading="lazy" /> : <CreditCard size={22} />}</div>
        <div className="gd-expansion-card-copy"><span>{card.card_type || 'collectible'} · {card.rarity || 'Common'}{card.owned ? ' · Owned' : ''}</span><strong>{card.name}</strong><p>{card.description || 'No card description has been published yet.'}</p>{card.animation_effect && <span className="inline-flex items-center gap-1 text-cyan-300"><Play size={12}/> Preview ability</span>}</div>
      </button>)}</div>}
    </section>
    <div className="gd-expansions-divider" aria-hidden="true" />
    <section className="gd-expansions-viewer" aria-label="Luna 3D viewer">
      <Suspense fallback={<div className="gd-empty" role="status"><Loader2 className="gd-spin" />Loading 3D viewer…</div>}>
        <PlayerPreview idleOnly={true} interactive={false} skillEffects={Boolean(previewEffect)} previewEffect={previewEffect} />
      </Suspense>
      {selected && <p className="gd-muted">{selected.name}{selected.animation_effect ? ' · Select the card again to replay its embedded skill on this preview only.' : ' · This card has no animation preview.'}</p>}
    </section>
  </div>;
}
