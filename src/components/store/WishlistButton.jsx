import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';

export default function WishlistButton({ game, className = '' }) {
  const { user, isAuthenticated } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !game?.id) return;
    base44.entities.Wishlist.filter({ user_id: user.id, game_id: game.id })
      .then(results => setWishlisted(results.length > 0))
      .catch(() => {});
  }, [user?.id, game?.id, isAuthenticated]);

  const toggle = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated || !user?.id) return;
    setLoading(true);
    if (wishlisted) {
      const existing = await base44.entities.Wishlist.filter({ user_id: user.id, game_id: game.id });
      if (existing.length > 0) await base44.entities.Wishlist.delete(existing[0].id);
      setWishlisted(false);
    } else {
      await base44.entities.Wishlist.create({
        user_id: user.id,
        game_id: game.id,
        game_title: game.title,
        game_cover: game.cover_image || game.image || '',
        game_price: game.price || 0,
        game_genre: game.genre || '',
      });
      setWishlisted(true);
    }
    setLoading(false);
  };

  if (!isAuthenticated) return null;

  return (
    <button
      onClick={toggle}
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