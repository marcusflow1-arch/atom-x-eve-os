import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Wrench } from 'lucide-react';

const STATUS_STYLES = {
  Beta: { text: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-400/30', label: 'Beta — Playable Now' },
  Alpha: { text: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-400/30', label: 'Alpha — In Testing' },
  'Pre-Alpha': { text: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-400/30', label: 'Pre-Alpha — Early Build' },
  Concept: { text: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-400/30', label: 'Concept Phase' },
};

export default function DevProjectShowcase({ projects, accent }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const project = projects[activeIdx];
  const status = STATUS_STYLES[project.status] || STATUS_STYLES.Concept;

  const goPrev = () => setActiveIdx((p) => (p - 1 + projects.length) % projects.length);
  const goNext = () => setActiveIdx((p) => (p + 1) % projects.length);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <Wrench className={`w-4 h-4 ${accent.text}`} />
        <h3 className="text-sm font-black uppercase tracking-widest text-white/50">Currently Working On</h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${accent.bg} ${accent.text}`}>{projects.length} active</span>
      </div>

      {/* Project selector tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {projects.map((proj, idx) => {
          const isActive = idx === activeIdx;
          const pStatus = STATUS_STYLES[proj.status] || STATUS_STYLES.Concept;
          return (
            <button
              key={proj.title}
              onClick={() => setActiveIdx(idx)}
              className={`flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-300 ${
                isActive
                  ? `${pStatus.bg} ${pStatus.border} ${pStatus.text}`
                  : 'border-white/8 bg-white/[0.02] text-white/50 hover:bg-white/[0.05]'
              }`}
            >
              <div className="w-8 h-10 rounded overflow-hidden flex-shrink-0 border border-white/10">
                <img src={proj.cover} alt={proj.title} className="w-full h-full object-cover" />
              </div>
              <div className="text-left min-w-0 max-w-[120px]">
                <p className={`text-[11px] font-bold truncate ${isActive ? 'text-white' : ''}`}>{proj.title}</p>
                <p className="text-[8px] uppercase tracking-wide opacity-70">{proj.genre}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail panel — themed by project */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10" style={{ minHeight: '340px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={project.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            {/* Background — project cover, blurred */}
            <div className="absolute inset-0">
              <img src={project.cover} alt="" className="w-full h-full object-cover" style={{ filter: 'blur(20px) brightness(0.35)', transform: 'scale(1.15)' }} />
              <div className="absolute inset-0 bg-slate-950/60" />
            </div>

            {/* Content */}
            <div className="relative grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 p-5">
              {/* Cover art */}
              <div className="flex-shrink-0">
                <div className="relative w-40 h-52 rounded-xl overflow-hidden border border-white/15 shadow-2xl mx-auto sm:mx-0">
                  <img src={project.cover} alt={project.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                  <span className={`absolute top-2 right-2 text-[8px] font-bold px-2 py-0.5 rounded-md ${status.bg} ${status.text} border ${status.border}`}>
                    {project.status}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[9px] uppercase tracking-wider font-bold ${accent.text}`}>{project.genre}</span>
                    <span className="text-white/20">·</span>
                    <span className="text-[9px] text-white/40 font-mono">{status.label}</span>
                  </div>
                  <h4 className="text-2xl font-black text-white mb-2 leading-tight">{project.title}</h4>
                  <p className="text-sm text-white/60 leading-relaxed mb-4 max-w-xl">{project.description}</p>

                  {/* Features */}
                  <div className="mb-4">
                    <p className="text-[9px] uppercase tracking-widest font-bold text-white/30 mb-2">Key Features</p>
                    <div className="flex flex-wrap gap-2">
                      {project.features.map((feat) => (
                        <div key={feat} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/8">
                          <CheckCircle2 className={`w-3 h-3 ${accent.text}`} />
                          <span className="text-[10px] text-white/70 font-medium">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Progress + release */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Development Progress</span>
                    <span className={`text-sm font-black ${accent.text}`}>{project.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/8 overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full ${accent.bar} rounded-full`}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-white/50">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Target release: {project.releaseWindow}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Nav arrows */}
            {projects.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/60 transition-all z-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/60 transition-all z-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dots indicator */}
        {projects.length > 1 && (
          <div className="relative flex items-center justify-center gap-1.5 pb-3">
            {projects.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeIdx ? `w-6 ${accent.bar}` : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}