import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, CreditCard, Trash2, CheckCircle2, Shield, AlertCircle, Loader2, ArrowRight, Database } from 'lucide-react';
import { useCart } from '../CartContext';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CartDrawer() {
  const { cart, isCartOpen, closeCart, removeFromCart, getCartTotal, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('review'); // review, processing, success
  const navigate = useNavigate();

  const total = getCartTotal();

  const handleCheckout = () => {
    if (cart.length === 0) return;
    closeCart();
    navigate(createPageUrl('Checkout'));
  };

  const handleClose = () => {
    if (checkoutStep === 'success') {
      setCheckoutStep('review');
      setIsCheckingOut(false);
    }
    closeCart();
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[101] w-full max-w-md bg-zinc-950/80 backdrop-blur-3xl border-l border-white/10 shadow-2xl flex flex-col"
            style={{ boxShadow: '-20px 0 50px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white tracking-wide">Your Cart</h2>
                <span className="bg-white/10 text-white/60 text-xs px-2 py-0.5 rounded-full font-mono">
                  {cart.length}
                </span>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 relative">
              {checkoutStep === 'success' ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </motion.div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">System Initialized</h3>
                    <p className="text-white/50 text-sm max-w-xs mx-auto">
                      All assets have been successfully transferred to your inventory and library.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                    <button 
                      onClick={() => { handleClose(); navigate(createPageUrl('Library')); }}
                      className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white uppercase tracking-wider transition-all"
                    >
                      Library
                    </button>
                    <button 
                      onClick={() => { handleClose(); navigate(createPageUrl('Blacksmith')); }}
                      className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white uppercase tracking-wider transition-all"
                    >
                      Blacksmith
                    </button>
                  </div>
                </div>
              ) : checkoutStep === 'processing' ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-cyan-400 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white/40" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Processing Transaction</h3>
                    <p className="text-white/40 text-xs font-mono animate-pulse">
                      Verifying blocks • Transferring ownership • Seeding systems
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-white/30 space-y-4">
                      <ShoppingBag className="w-12 h-12 opacity-50" />
                      <p className="text-sm">Your cart is empty</p>
                    </div>
                  ) : (
                    cart.map((item, index) => (
                      <motion.div
                        key={`${item.id}-${index}`}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group relative bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 flex gap-4 transition-colors"
                      >
                        <div className="w-16 h-20 bg-black/50 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={item.image || item.cover_image} 
                            alt={item.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="text-white font-bold text-sm truncate pr-4">{item.title}</h4>
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="text-white/20 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <span className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1.5 mt-1">
                              {item.type === 'game' ? <Shield className="w-3 h-3" /> : <Database className="w-3 h-3" />}
                              {item.type}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-end">
                            <span className="text-white/40 text-xs">Standard License</span>
                            <span className="text-white font-mono font-bold">${Number(item.price).toFixed(2)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {checkoutStep === 'review' && cart.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-md">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Subtotal</span>
                    <span className="text-white font-mono">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">System Fee</span>
                    <span className="text-white font-mono">$0.00</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">Total</span>
                    <span className="text-2xl font-bold text-cyan-400 font-mono">${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full py-4 relative group overflow-hidden rounded-xl font-bold uppercase tracking-widest text-sm hover:scale-[1.02] transition-transform border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-md group-hover:bg-white/20 transition-colors" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="relative z-10 text-white flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Proceed to Checkout
                  </span>
                </button>
                
                <p className="text-center text-[10px] text-white/30 mt-4">
                  Secure transaction via AtomXE Protocol
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}