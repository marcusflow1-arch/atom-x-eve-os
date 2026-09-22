import { lazy, Suspense, useEffect, useState } from 'react';
import { ChevronDown, Loader2, ShoppingBag, UserRound } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { useCart } from '@/components/CartContext';
import { priceOf, priceLabel, label } from '@/components/store/redesign/discovery';
import GameImage from './GameImage';

const PlayerPreview = lazy(() => import('@/components/3d/StoreIdleViewer'));

export default function GameExtras({ game }) {
  const { isAuthenticated, login } = useAuth();
  const { addToCart, isPurchased } = useCart();
  const [content, setContent] = useState({ dlc: [], cards: [] });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setFailed(false);
    Promise.allSettled([
      base44.entities.DLC.filter({ game_id: game.id, status: 'active' }),
      base44.entities.CardTemplate.filter({ source_game_id: game.id })
    ]).then(([dlc, cards]) => {
      if (cancelled) return;
      setContent({ dlc: dlc.status === 'fulfilled' ? dlc.value : [], cards: cards.status === 'fulfilled' ? cards.value : [] });
      setFailed(dlc.status === 'rejected' || cards.status === 'rejected');
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [game.id, retry]);
  const purchaseDLC = dlc => {
    if (!isAuthenticated) { login(); return; }
    if (priceOf(dlc) === null) return;
    addToCart({ id: dlc.id, type: 'dlc', title: dlc.name, price: priceOf(dlc), image: dlc.cover_image || game.cover_image, gameTitle: game.title, gameId: game.id });
  };
  return <div className="gd-extras-grid">
    <div>
      <div className="gd-section-heading"><div><span className="gd-eyebrow">Additional content</span><h2>DLC & add-ons</h2><p>Expansions, content packs and developer-published extras for this title.</p></div></div>
      {loading ? <p className="gd-empty" role="status">Loading game extras…</p> : <>
        {failed && <div className="gd-inline-error" role="alert">Some extras could not be loaded. <button className="gd-text-button" onClick={() => setRetry(value => value + 1)}>Try again</button></div>}
        {!failed && !content.dlc.length && <p className="gd-muted">No DLC or add-ons have been published for this game yet.</p>}
        {content.dlc.map(dlc => <details key={dlc.id} className="gd-extra-item">
          <summary><GameImage src={dlc.cover_image || game.cover_image} alt="" loading="lazy" /><span><strong>{dlc.name}</strong><small>{isPurchased(dlc.id) ? 'In your library' : priceLabel(dlc)}</small></span><ChevronDown size={16} /></summary>
          <div><p>{dlc.description}</p>{!isPurchased(dlc.id) && <button className="gd-secondary-button gd-button-fit" disabled={priceOf(dlc) === null} onClick={() => purchaseDLC(dlc)}><ShoppingBag size={15} />Add expansion to cart</button>}</div>
        </details>)}
        <div className="gd-developer-card-section">
          <div className="gd-section-heading gd-section-heading-compact"><div><span className="gd-eyebrow">Developer cards</span><h3>Published card content</h3></div></div>
          {content.cards.length ? <div className="gd-card-list">{content.cards.map(card => <details key={card.id} className="gd-card-item"><summary><span><strong>{card.name}</strong><small>{label(card.type)} · {card.base_rarity}</small></span><ChevronDown size={16} /></summary><p>{card.description || 'More details will be shared by the developer.'}</p></details>)}</div> : <p className="gd-muted">No developer cards have been published for this game yet.</p>}
        </div>
      </>}
    </div>
    <section className="gd-companion">
      <span className="gd-eyebrow">Made for your Luna dashboard</span><h3>Your companion</h3><p>Your character, with your current appearance.</p>
      {preview ? <div className="gd-companion-view"><Suspense fallback={<div className="gd-empty" role="status"><Loader2 className="gd-spin" />Loading your character…</div>}><PlayerPreview idleOnly={true} interactive={false} /></Suspense></div> : <div className="gd-companion-placeholder"><UserRound size={44} /><button className="gd-secondary-button gd-button-fit" onClick={() => setPreview(true)}>Preview your character</button></div>}
    </section>
  </div>;
}
