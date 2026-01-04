import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MercuryRippleTransition({ children, transitionKey }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={transitionKey}
          className="w-full h-full relative z-10"
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>

        {/* Liquid Mercury Ripple Overlay */}
        <motion.div
            key={`${transitionKey}-ripple`}
            className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
        >
             {/* The Ripple Wave */}
             <motion.div
                className="absolute w-[200vw] h-[200vw] rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(226,232,240,0.4) 0%, rgba(148,163,184,0.1) 40%, transparent 70%)',
                    mixBlendMode: 'overlay'
                }}
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
             />
             
             {/* Metallic Sheen Wave */}
             <motion.div
                className="absolute w-full h-full"
                style={{
                    background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.2) 180deg, transparent 360deg)',
                    mixBlendMode: 'color-dodge'
                }}
                initial={{ rotate: 0, opacity: 0 }}
                animate={{ rotate: 180, opacity: [0, 0.5, 0] }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
             />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}