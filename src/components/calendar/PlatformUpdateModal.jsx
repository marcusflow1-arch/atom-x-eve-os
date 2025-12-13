import React from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function PlatformUpdateModal({ update, onClose }) {
  const getIcon = () => {
    switch (update.update_type) {
      case 'required':
        return <AlertCircle className="w-6 h-6 text-red-400" />;
      case 'feature':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      default:
        return <Info className="w-6 h-6 text-blue-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <h2 className="text-2xl font-bold text-white">{update.title}</h2>
              {update.version && (
                <p className="text-white/60 text-sm">Version {update.version}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {update.image_url && (
            <img src={update.image_url} alt={update.title} className="w-full h-48 object-cover rounded-lg mb-4" />
          )}
          
          <p className="text-white/80 text-lg mb-4">{update.description}</p>
          
          {update.full_content && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-white/70 whitespace-pre-wrap">{update.full_content}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}