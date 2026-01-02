import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Standardized loading states for async operations
 */

export default function LoadingState({ 
  message = 'Loading...', 
  fullScreen = false,
  variant = 'default' // 'default', 'minimal', 'skeleton'
}) {
  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center gap-2 text-white/60">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">{message}</span>
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-white/5 rounded-xl" />
        <div className="h-24 bg-white/5 rounded-xl" />
        <div className="h-40 bg-white/5 rounded-xl" />
      </div>
    );
  }

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-4"
    >
      <div className="relative">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <Sparkles className="w-12 h-12 text-cyan-400 opacity-50" />
        </motion.div>
      </div>
      <p className="text-white/80 text-lg font-medium">{message}</p>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-blue-400 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      {content}
    </div>
  );
}

/**
 * Inline spinner for buttons and small spaces
 */
export function Spinner({ className = "w-4 h-4" }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}