import React, { useState } from 'react';
import { ArrowUpRight, Check, Heart, Loader2, ShoppingBag, Library, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { useCart } from '@/components/CartContext';
import { useWishlist } from '@/components/store/WishlistContext';
import { label, priceOf, priceLabel, comingSoon } from '@/components/store/redesign/discovery';
import { releaseLabel } from './gameDetailData';

export default function GamePurchasePanel({ game }) {
  const { isAuthenticated, login } = useAuth();
  const { addToCart, isPurchased, cart, openCart } = useCart();
  const { isWishlisted, toggle, loaded } = useWishlist();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const owned = isPurchased(game.id);
  const inCart = cart.some(item => item.id === game.id && item.type === 'game');
  const wishlisted = isWishlisted(game.id);
  const amount = priceOf(game);
  const upcoming = comingSoon(game);
  const unavailable = !owned && (upcoming || amount === null);
  const tags = [...new Set([game.genre, ...(Array.isArray(game.tags) ? game.tags : [])].filter(Boolean))].slice(0, 5);

  const purchase = () => {
    if (owned) { navigate('/Library'); return; }
    if (!isAuthenticated) { login(); return; }
    if (unavailable) return;
    if (inCart) { openCart(); return; }
    addToCart({ id: game.id, type: 'game', title: game.title, price: amount, image: game.cover_image, genre: game.genre });
  };
  const wishlist = async () => {
    if (!isAuthenticated) { login(); return; }
    setBusy(true); setFeedback('');
    try { await toggle(game); }
    catch { setFeedback('Your wishlist could not be updated. Please try again.'); }
    finally { setBusy(false); }
  };
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + '/GameDetail?id=' + encodeURIComponent(game.id) + '&from=store');
      setFeedback('Game link copied.');
    } catch { setFeedback('Copy the page address from your browser to share this game.'); }
  };

  return <aside className="gd-purchase" aria-label="Game information and purchase">
    <div className="gd-purchase-heading">
      <span className="gd-eyebrow">{owned ? 'In your library' : upcoming ? 'Coming soon' : 'Discover your next game'}</span>
      <button className="gd-icon-button" onClick={share} aria-label="Copy game link"><Share2 size={16} /></button>
    </div>
    <p className="gd-summary">{game.short_description || game.description || 'More information about this game will be available soon.'}</p>
    <div className="gd-tags">{tags.map(tag => <span key={tag}>{label(tag)}</span>)}</div>
    <dl className="gd-facts">
      <div><dt>Release</dt><dd>{releaseLabel(game)}</dd></div>
      {game.developer && <div><dt>Developer</dt><dd>{game.developerKey ? <a href={'/dev-studio/' + encodeURIComponent(game.developerKey)}>{game.developer}<ArrowUpRight size={13} /></a> : game.developer}</dd></div>}
      {game.publisher && <div><dt>Publisher</dt><dd>{game.publisher}</dd></div>}
      {game.system_requirements?.os && <div><dt>Platform</dt><dd>{game.system_requirements.os}</dd></div>}
    </dl>
    <div className="gd-purchase-actions">
      <div className="gd-price-row">
        <div><span className="gd-eyebrow">{owned ? 'Ready when you are' : 'Game price'}</span><div className="gd-price">{owned ? <><Check size={22} />Owned</> : priceLabel(game)}</div></div>
        {!owned && amount !== null && Number(game.price) > amount && <span className="gd-original-price">{priceLabel({ price: game.price })}</span>}
      </div>
      <button className="gd-primary-button" onClick={purchase} disabled={unavailable}>
        {owned ? <Library size={18} /> : inCart ? <Check size={18} /> : <ShoppingBag size={18} />}
        {owned ? 'Open in library' : upcoming ? 'Coming soon' : amount === null ? 'Not available yet' : inCart ? 'View cart' : !isAuthenticated ? 'Sign in to add to cart' : 'Add to cart'}
      </button>
      <button className="gd-secondary-button" onClick={wishlist} aria-pressed={wishlisted} disabled={busy || (isAuthenticated && !loaded)}>
        {busy ? <Loader2 size={17} className="gd-spin" /> : <Heart size={17} fill={wishlisted ? 'currentColor' : 'none'} />}
        {wishlisted ? 'On your wishlist' : 'Add to wishlist'}
      </button>
      {feedback && <p className="gd-feedback" role="status">{feedback}</p>}
    </div>
  </aside>;
}
