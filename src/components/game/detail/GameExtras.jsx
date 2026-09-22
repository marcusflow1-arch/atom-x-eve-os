import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { label } from '@/components/store/redesign/discovery';

const PlayerPreview = lazy(() => import('@/components/3d/StoreIdleViewer'));

export default function GameExtras({ game }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    base44.entities.CardTemplate.filter({ source_game_id: game.id }, 'name', 500)
      .then((rows) => {
        if (!cancelled) setCards(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [game.id, retry]);

  const sortedCards = useMemo(
    () => [...cards].sort((a, b) =>
      String(a.type || '').localeCompare(String(b.type || ''))
      || String(a.name || '').localeCompare(String(b.name || ''))
    ),
    [cards]
  );

  return (
    <div className="gd-expansions-cards">
      <section className="gd-expansions-card-library">
        <div className="gd-section-heading">
          <div>
            <span className="gd-eyebrow">Game card collection</span>
            <h2>Expansions &amp; Cards</h2>
            <p>Every published card available for {game.title}.</p>
          </div>
        </div>

        {loading ? (
          <p className="gd-empty" role="status">Loading cards…</p>
        ) : failed ? (
          <div className="gd-inline-error" role="alert">
            Cards could not be loaded. <button className="gd-text-button" onClick={() => setRetry(value => value + 1)}>Try again</button>
          </div>
        ) : !sortedCards.length ? (
          <p className="gd-muted">No cards have been published for this game yet.</p>
        ) : (
          <div className="gd-expansion-card-grid">
            {sortedCards.map((card) => (
              <article key={card.id} className="gd-expansion-card">
                <div className="gd-expansion-card-art">
                  {card.image_url
                    ? <img src={card.image_url} alt="" loading="lazy" />
                    : <CreditCard size={22} />}
                </div>
                <div className="gd-expansion-card-copy">
                  <span>{label(card.type)} · {card.base_rarity || 'Common'}</span>
                  <strong>{card.name}</strong>
                  <p>{card.description || 'No card description has been published yet.'}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="gd-expansions-divider" aria-hidden="true" />

      <section className="gd-expansions-viewer" aria-label="Luna 3D viewer">
        <Suspense fallback={<div className="gd-empty" role="status"><Loader2 className="gd-spin" />Loading 3D viewer…</div>}>
          <PlayerPreview idleOnly={true} interactive={false} />
        </Suspense>
      </section>
    </div>
  );
}
