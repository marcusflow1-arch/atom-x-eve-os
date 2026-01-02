import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * Loading fallback for lazy-loaded routes
 */
export function RouteLoader() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="relative">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
        </div>
        <p className="text-slate-400 font-medium">Loading experience...</p>
      </motion.div>
    </div>
  );
}

/**
 * Wrapper for lazy-loaded routes with error boundary
 */
export function LazyRoute({ children }) {
  return (
    <Suspense fallback={<RouteLoader />}>
      {children}
    </Suspense>
  );
}