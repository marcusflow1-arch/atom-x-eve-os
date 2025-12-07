import React from 'react';
import { motion } from 'framer-motion';
import { Home, LayoutDashboard, Paintbrush, Star, X } from 'lucide-react';

export default function AIHomeOverlay({ onClose }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Background Gradient */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(circle at center, #10b981 0%, #064e3b 40%, #022c22 80%, #000000 100%)'
        }}
      />

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl w-full px-6">
        
        {/* Icon */}
        <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
          <Home className="w-10 h-10 text-white" />
        </div>

        {/* Titles */}
        <h1 className="text-6xl font-black text-white mb-4 tracking-tight">AI HOME</h1>
        <h2 className="text-xl font-bold text-emerald-500/50 tracking-[0.5em] uppercase mb-8">PERSONAL SPACE</h2>

        {/* Description */}
        <p className="text-slate-300 text-lg max-w-2xl mb-16 leading-relaxed">
          Your personalized AI-powered home base. Customize your experience,
          manage your preferences, and access your personal dashboard.
        </p>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {[
            { title: 'Dashboard', sub: 'View your stats', icon: LayoutDashboard },
            { title: 'Customization', sub: 'Personalize your space', icon: Paintbrush },
            { title: 'Quick Access', sub: 'Your favorites', icon: Star }
          ].map((item, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4 transition-all group"
            >
              <h3 className="text-xl font-bold text-white">{item.title}</h3>
              <p className="text-emerald-400/60 text-sm font-medium uppercase tracking-wider">{item.sub}</p>
            </motion.button>
          ))}
        </div>

      </div>
    </motion.div>
  );
}