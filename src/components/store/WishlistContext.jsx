import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';

const WishlistContext = createContext({ wishlistIds: new Set(), toggle: () => {}, isWishlisted: () => false });

export function WishlistProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [wishlistMap, setWishlistMap] = useState({}); // game_id -> wishlist record id
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) { setWishlistMap({}); setLoaded(true); return; }
    base44.entities.Wishlist.filter({ user_id: user.id })
      .then(results => {
        const map = {};
        results.forEach(r => { map[r.game_id] = r.id; });
        setWishlistMap(map);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [user?.id, isAuthenticated]);

  const isWishlisted = useCallback((gameId) => !!wishlistMap[gameId], [wishlistMap]);

  const toggle = useCallback(async (game) => {
    if (!isAuthenticated || !user?.id || !game?.id) return;
    const existing = wishlistMap[game.id];
    if (existing) {
      await base44.entities.Wishlist.delete(existing);
      setWishlistMap(prev => { const next = { ...prev }; delete next[game.id]; return next; });
    } else {
      const record = await base44.entities.Wishlist.create({
        user_id: user.id,
        game_id: game.id,
        game_title: game.title,
        game_cover: game.cover_image || game.image || '',
        game_price: game.price || 0,
        game_genre: game.genre || '',
      });
      setWishlistMap(prev => ({ ...prev, [game.id]: record.id }));
    }
  }, [isAuthenticated, user?.id, wishlistMap]);

  return (
    <WishlistContext.Provider value={{ isWishlisted, toggle, loaded }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}