import { useEffect, useState } from 'react';
import { Check, ChevronDown, Download, ShoppingBag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { useCart } from '@/components/CartContext';
import { priceOf, priceLabel } from '@/components/store/redesign/discovery';
import GameImage from './GameImage';

export default function GameDLCSection({ game }) {
  const { isAuthenticated, login } = useAuth();
  const { addToCart, isPurchased } = useCart();
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
          <p>Expansions and add-ons available for {game.title}.</p>
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
        <div className="gd-dlc-list">
          {rows.map((dlc) => {
            const open = expandedId === dlc.id;
            const owned = isPurchased(dlc.id);
            const details = Array.isArray(dlc.content) ? dlc.content : [];
            return (
              <article key={dlc.id} className={open ? 'is-open' : ''}>
                <button
                  type="button"
                  className="gd-dlc-row"
                  onClick={() => setExpandedId(open ? null : dlc.id)}
                  aria-expanded={open}
                >
                  <div className="gd-dlc-art">
                    <GameImage src={dlc.cover_image || game.cover_image} alt="" loading="lazy" />
                  </div>
                  <div className="gd-dlc-copy">
                    <strong>{dlc.name}</strong>
                    <p>{dlc.description}</p>
                    <div className="gd-dlc-meta">
                      <span>{owned ? 'In your library' : priceLabel(dlc)}</span>
                      {dlc.version && <span>Version {dlc.version}</span>}
                      {dlc.install_size_mb != null && <span>{dlc.install_size_mb} MB</span>}
                    </div>
                  </div>
                  <ChevronDown className="gd-dlc-chevron" size={17} />
                </button>

                {open && (
                  <div className="gd-dlc-expanded">
                    {details.length > 0 && (
                      <div className="gd-dlc-includes">
                        <span className="gd-eyebrow">Includes</span>
                        <div>
                          {details.slice(0, 12).map((item, index) => {
                            const text = typeof item === 'string'
                              ? item
                              : item?.name || item?.title || item?.description || 'Additional content';
                            return <span key={index}><Check size={12} />{text}</span>;
                          })}
                        </div>
                      </div>
                    )}
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
      )}
    </section>
  );
}
