import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MercuryRippleTransition({ children, transitionKey }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        className="w-full h-full"
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
        transition={{ 
            duration: 0.4, 
            ease: [0.4, 0, 0.2, 1] 
        }}
      >
        {/* Mercury Ripple Overlay Effect on enter */}
        <motion.div
            className="absolute inset-0 pointer-events-none z-50 bg-gradient-to-tr from-white/10 to-transparent mix-blend-overlay"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 1, 0], scale: [0.9, 1.1, 1.2] }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        />
        {children}
      </motion.div>
    </AnimatePresence>
  );
}