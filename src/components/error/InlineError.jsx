import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Inline error display component
 * Use for non-critical errors within a page section
 */
export default function InlineError({ 
  error, 
  onRetry, 
  onDismiss,
  title = 'Something went wrong',
  className = ''
}) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message || 'An error occurred';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`bg-red-950/30 border border-red-500/30 rounded-xl p-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1">
            <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
            <p className="text-red-200/80 text-sm">{errorMessage}</p>
            
            {(onRetry || onDismiss) && (
              <div className="flex items-center gap-2 mt-3">
                {onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRetry}
                    className="bg-red-900/50 border-red-500/30 text-red-200 hover:bg-red-900/70"
                  >
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Try Again
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onDismiss}
                    className="text-red-300 hover:text-white hover:bg-red-900/30"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Dismiss
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Compact inline error for smaller spaces
 */
export function CompactError({ message, onRetry }) {
  return (
    <div className="flex items-center gap-2 text-red-400 text-sm">
      <AlertCircle className="w-4 h-4" />
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="text-blue-400 hover:text-blue-300 underline ml-2">
          Retry
        </button>
      )}
    </div>
  );
}