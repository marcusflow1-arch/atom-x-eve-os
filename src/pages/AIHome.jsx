import React from 'react';
import { motion } from 'framer-motion';
import { Home, X, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AIHome({ onClose }) {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full bg-black text-white font-sans overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-black to-green-900" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 blur-[150px]"
        />
      </div>

      {/* Close Button */}
      <button 
        onClick={() => onClose ? onClose() : navigate(-1)}
        className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 hover:border-white/20"
      >
        <X className="w-5 h-5 text-white/60" />
      </button>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Icon */}
          <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-[0_0_80px_rgba(34,197,94,0.5)]">
            <Home className="w-16 h-16 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-7xl font-black text-white uppercase tracking-tighter leading-none mb-6 drop-shadow-2xl">
            AI Home
            <span className="block text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white/60 to-white/10 tracking-[0.5em] mt-4">
              Personal Space
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Your personalized AI-powered home base. Customize your experience, manage your preferences, and access your personal dashboard.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { title: 'Dashboard', desc: 'View your stats' },
              { title: 'Customization', desc: 'Personalize your space' },
              { title: 'Quick Access', desc: 'Your favorites' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
              >
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}