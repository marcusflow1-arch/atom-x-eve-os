import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Star, DollarSign } from 'lucide-react';
import ShinyCard from '@/components/shared/ShinyCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/components/CartContext';

export default function GameCartOverlay({ game, onClose }) {
  const { addToCart, openCart } = useCart();
  if (!game) return null;

  const handleAdd = () => {
    addToCart({ id: game.id, title: game.title, price: game.price, image: game.cover_image, quantity: 1 });
    openCart();
    onClose?.();
  };

  return (
    <AnimatePresence>
      {game && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70]"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 24, stiffness: 200 }}
            className="absolute inset-4 md:inset-16 rounded-3xl overflow-hidden z-[71] flex flex-col md:flex-row aura-glass aura-refraction aura-ease"
            style={{
              background: 'rgba(100,120,140,0.12)',
              backdropFilter: 'blur(30px) saturate(150%)',
              WebkitBackdropFilter: 'blur(30px) saturate(150%)',
              border: '1px solid rgba(255,255,255,0.12)'
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Left: Cover in Liquid Glass */}
            <div className="flex-1 min-h-[280px] md:min-h-0 md:w-1/2 p-6 md:p-10 flex items-center justify-center">
              <ShinyCard className="w-full max-w-md rounded-2xl overflow-hidden">
                <div className="relative w-full aspect-[3/4]">
                  <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-black/50 border-white/15 text-white/90 text-[10px]">{game.genre}</Badge>
                    <Badge className="bg-black/50 border-white/15 text-yellow-300 text-[10px] flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-300" /> {game.rating || 4.5}
                    </Badge>
                  </div>
                </div>
              </ShinyCard>
            </div>

            {/* Right: Details + Actions */}
            <div className="md:w-1/2 p-6 md:p-10 flex flex-col gap-5">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-1">{game.title}</h2>
                <p className="text-white/70 max-w-prose">{game.description}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="px-5 py-3 rounded-xl border border-white/15 bg-white/5">
                  <div className="text-xs text-white/60">Price</div>
                  <div className="text-2xl font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    ${Number(game.price || 0).toFixed(2)}
                  </div>
                </div>
                <div className="px-5 py-3 rounded-xl border border-white/15 bg-white/5">
                  <div className="text-xs text-white/60">Genre</div>
                  <div className="text-lg font-semibold text-white">{game.genre}</div>
                </div>
              </div>

              <div className="mt-auto flex flex-wrap gap-3">
                <Button
                  onClick={handleAdd}
                  className="h-12 px-6 rounded-xl bg-white text-black hover:bg-slate-200 font-bold gap-2"
                >
                  <ShoppingBag className="w-5 h-5" /> Add to Cart
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { openCart(); onClose?.(); }}
                  className="h-12 px-6 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  View Cart
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}