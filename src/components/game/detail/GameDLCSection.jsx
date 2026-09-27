import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, CreditCard, Download, Package, ShoppingBag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { useCart } from '@/components/CartContext';
import useCardCollection from '@/components/cards/useCardCollection';
import { priceOf, priceLabel } from '@/components/store/redesign/discovery';
import GameImage from './GameImage';

const normalize = (value) => String(value || '').trim().toLowerCase();

const contentLabel = (item) => {
  if (typeof item === 'string') return item;
  return item?.name || item?.title || item?.card_name || item?.description || 'Additional content';
};

const cardLikeContent = (item) => {
  if (!item || typeof item !== 'object') return false;
  if (item.card_id || item.trading_card_id || item.user_card_id) return true;
  const type = normalize(item.card_type || item.type || item.kind || item.category || item.reward_type);
  return ['card', 'ability', 'equipment', 'companion', 'environment', 'pet', 'mount'].some((value) => type.includes(value));
};

export default function GameDLCSection({ game }) {
  const { isAuthenticated, login } = useAuth();
  const { addToCart, isPurchased } = useCart();
  const cardCollection = useCardCollection({ game_id: game.id });
  const [rows, setRows] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    base44.entities.DLC.filter({ game_id: game.id, status: 'active' }, '-release_date', 100)
      .then((items) => {
        if (!cancelled) setRows(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!cancelled) setError('DLC could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [game.id, retry]);

  const cardLookup = useMemo(() => {
    const byId = new Map();
    const byName = new Map();
    for (const card of cardCollection.cards || []) {
      [card.id, card.trading_card_id, card.user_card_id].filter(Boolean).forEach((id) => byId.set(String(id), card));
      if (card.name) byName.set(normalize(card.name), card);
    }
    return { byId, byName };
  }, [cardCollection.cards]);

  const cardsForDlc = (dlc) => {
    const found = [];
    const seen = new Set();
    const details = Array.isArray(dlc?.content) ? dlc.content : [];
    for (const item of details) {
      const directId = typeof item === 'object' && item
        ? item.card_id || item.trading_card_id || item.user_card_id || (cardLikeContent(item) ? item.id : '')
        : '';
      const name = contentLabel(item);
      const match = (directId && cardLookup.byId.get(String(directId))) || cardLookup.byName.get(normalize(name));
      const fallback = !match && cardLikeContent(item) ? {
        id: `${dlc.id}:${directId || normalize(name)}`,
        name,
        card_type: item.card_type || item.type || item.kind || 'card',
        rarity: item.rarity || item.card_rarity || '',
        image_url: item.image_url || item.card_image || item.image || '',
        description: item.description || '',
      } : null;
      const card = match || fallback;
      if (!card) continue;
      const key = String(card.id || normalize(card.name));
      if (seen.has(key)) continue;
      seen.add(key);
      found.push(card);
    }
    return found;
  };

  const selected = rows.find((dlc) => String(dlc.id) === String(expandedId)) || null;
  const selectedCards = selected ? cardsForDlc(selected) : [];

  const addDlc = (dlc) => {
    if (!isAuthenticated) {
      login();
      return;
    }
    const amount = priceOf(dlc);
    if (amount === null) return;
    addToCart({
      id: dlc.id,
      type: 'dlc',
      title: dlc.name,
      price: amount,
      image: dlc.cover_image || game.cover_image,
      gameTitle: game.title,
      gameId: game.id,
    });
  };

  return (
    <section id="game-dlc" className="gd-dlc-restored" aria-label="DLC">
      <div className="gd-section-heading">
        <div>
          <span className="gd-eyebrow">Downloadable content</span>
          <h2>DLC</h2>
          <p>Expansions and add-ons for {game.title}.</p>
        </div>
        <Download size={24} />
      </div>

      {loading ? (
        <p className="gd-muted" role="status">Loading DLC…</p>
      ) : error ? (
        <div className="gd-inline-error" role="alert">
          {error} <button className="gd-text-button" onClick={() => setRetry(value => value + 1)}>Try again</button>
        </div>
      ) : !rows.length ? (
        <p className="gd-muted">No DLC has been published for this game yet.</p>
      ) : (
        <div className={`gd-dlc-layout ${selected ? 'has-selection' : ''}`}>
          <div className="gd-dlc-list" aria-label="Available DLC">
            {rows.map((dlc) => {
              const open = expandedId === dlc.id;
              const owned = isPurchased(dlc.id);
              const details = Array.isArray(dlc.content) ? dlc.content : [];
              const dlcCards = cardsForDlc(dlc);
              return (
                <article key={dlc.id} className={open ? 'is-open' : ''}>
                  <button
                    type="button"
                    className="gd-dlc-row"
                    onClick={() => setExpandedId(open ? null : dlc.id)}
                    aria-expanded={open}
                    aria-controls={`gd-dlc-detail-${dlc.id}`}
                  >
                    <div className="gd-dlc-art">
                      <GameImage src={dlc.cover_image || game.cover_image} alt="" loading="lazy" />
                    </div>
                    <div className="gd-dlc-copy">
                      <strong>{dlc.name}</strong>
                      <p>{dlc.description}</p>
                      <div className="gd-dlc-meta">
                        <span>{owned ? 'In your library' : priceLabel(dlc)}</span>
                        {dlcCards.length > 0 && <span>{dlcCards.length} card{dlcCards.length === 1 ? '' : 's'}</span>}
                        {dlc.version && <span>Version {dlc.version}</span>}
                        {dlc.install_size_mb != null && <span>{dlc.install_size_mb} MB</span>}
                      </div>
                    </div>
                    <ChevronDown className="gd-dlc-chevron" size={17} />
                  </button>

                  {open && (
                    <div id={`gd-dlc-detail-${dlc.id}`} className="gd-dlc-expanded">
                      <div className="gd-dlc-expanded-main">
                        {details.length > 0 && (
                          <div className="gd-dlc-includes">
                            <span className="gd-eyebrow">Includes</span>
                            <div>
                              {details.slice(0, 12).map((item, index) => (
                                <span key={index}><Check size={12} />{contentLabel(item)}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {dlcCards.length > 0 && (
                          <div className="gd-dlc-card-block">
                            <span className="gd-eyebrow">Cards &amp; rewards</span>
                            <div className="gd-dlc-card-grid">
                              {dlcCards.slice(0, 8).map((card) => (
                                <div key={card.id || card.name} className="gd-dlc-card">
                                  <div className="gd-dlc-card-art">
                                    {card.image_url || card.image
                                      ? <img src={card.image_url || card.image} alt="" loading="lazy" />
                                      : <CreditCard size={15} />}
                                  </div>
                                  <div>
                                    <small>{card.card_type || 'Card'}{card.rarity ? ` · ${card.rarity}` : ''}</small>
                                    <strong>{card.name}</strong>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {!owned && (
                        <button
                          type="button"
                          className="gd-secondary-button gd-button-fit"
                          disabled={priceOf(dlc) === null}
                          onClick={() => addDlc(dlc)}
                        >
                          <ShoppingBag size={15} />
                          Add DLC to cart
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {selected && <div className="gd-dlc-rail" aria-hidden="true" />}

          {selected && (
            <aside className="gd-dlc-view" aria-label={`${selected.name} DLC details`}>
              <div className="gd-dlc-view-art">
                <GameImage src={selected.cover_image || game.cover_image} alt="" loading="lazy" />
              </div>
              <span className="gd-eyebrow">DLC view</span>
              <h3>{selected.name}</h3>
              <p>{selected.description}</p>

              <dl className="gd-dlc-facts">
                <div><dt>Price</dt><dd>{isPurchased(selected.id) ? 'Owned' : priceLabel(selected)}</dd></div>
                {selected.version && <div><dt>Version</dt><dd>{selected.version}</dd></div>}
                {selected.install_size_mb != null && <div><dt>Install</dt><dd>{selected.install_size_mb} MB</dd></div>}
                {selected.release_date && <div><dt>Released</dt><dd>{new Date(selected.release_date).toLocaleDateString()}</dd></div>}
                <div><dt>Content</dt><dd>{Array.isArray(selected.content) ? selected.content.length : 0} items</dd></div>
              </dl>

              {selectedCards.length > 0 && (
                <div className="gd-dlc-view-cards">
                  <div className="gd-dlc-view-label"><Package size={14} /><span>Cards included</span></div>
                  <div>
                    {selectedCards.slice(0, 5).map((card) => (
                      <span key={card.id || card.name}>{card.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>
      )}
    </section>
  );
}
