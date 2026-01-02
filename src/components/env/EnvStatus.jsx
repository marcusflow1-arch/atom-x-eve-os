import React, { useEffect, useState } from 'react';
import { validateEnv } from './envValidator';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Development-only component that validates environment configuration
 * Shows a warning banner if env validation fails
 */
export default function EnvStatus() {
  const [validation, setValidation] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only run in development/preview
    if (import.meta.env.PROD) return;
    
    const result = validateEnv();
    setValidation(result);
  }, []);

  // Don't render in production
  if (import.meta.env.PROD) return null;
  
  // Don't render if validation passed or user dismissed
  if (!validation || validation.success || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[9999] bg-red-900/95 backdrop-blur-lg border-b border-red-500/50 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-300 flex-shrink-0" />
            <div>
              <h3 className="text-white font-bold text-sm">Environment Configuration Warning</h3>
              <p className="text-red-200 text-xs mt-1">
                Some environment variables are missing or invalid. Check console for details.
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setDismissed(true)}
            className="p-2 rounded-lg hover:bg-red-800/50 transition-colors"
          >
            <X className="w-5 h-5 text-red-200" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}