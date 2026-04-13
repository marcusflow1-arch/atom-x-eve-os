import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useWishlist } from './WishlistContext';

export default function WishlistButton({ game, className = '' }) {
  const { isAuthenticated } = useAuth();
  const { isWishlisted, toggle } = useWishlist();
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) return null;

  const wishlisted = isWishlisted(game?.id);

  const handleClick = async (e) => {
    e.stopPropagation();
    setLoading(true);
    await toggle(game);
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
        wishlisted
          ? 'bg-pink-500/30 border border-pink-400/60 text-pink-400'
          : 'bg-black/40 border border-white/20 text-white/60 hover:text-pink-400 hover:border-pink-400/50'
      } ${className}`}
    >
      <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
    </button>
  );
}