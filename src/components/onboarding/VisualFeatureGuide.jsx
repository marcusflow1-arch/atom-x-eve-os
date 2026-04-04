import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function VisualFeatureGuide({ features, onNavigate }) {
  const [activeFeature, setActiveFeature] = useState(0);
  const currentFeature = features[activeFeature];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12 md:px-8">
      <div className="mb-14 text-center">
        <h2 className="mb-5 bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
          Guided Platform Walkthrough
        </h2>
        <p className="mx-auto max-w-3xl text-lg text-white/60">
          This welcome experience is a quick demonstration of the main pages, what each one is for, and what a new user should do when they arrive there.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <div className="space-y-3">
          {features.map((feature, index) => (
            <button
              key={feature.title}
              onClick={() => setActiveFeature(index)}
              className={`relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ${
                activeFeature === index
                  ? 'border-cyan-500/40 bg-white/10 shadow-[0_0_24px_rgba(34,211,238,0.14)]'
                  : 'border-white/8 bg-white/5 hover:border-white/15 hover:bg-white/10'
              }`}
            >
              <div className="relative z-10 flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color}`}>
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium uppercase tracking-[0.24em] text-white/35">Step {index + 1}</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/45">
                      {feature.page}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-white">{feature.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-white/50">{feature.summary}</p>
                </div>
              </div>
              {activeFeature === index && (
                <motion.div
                  layoutId="activeWalkthroughGlow"
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent"
                />
              )}
            </button>
          ))}
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.03 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="relative h-[320px] overflow-hidden bg-slate-950 md:h-[360px]">
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <img
                  src={currentFeature.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80'}
                  alt={currentFeature.title}
                  className="h-full w-full object-cover object-center opacity-80"
                />
                <div className="absolute bottom-6 left-6 right-6 z-20">
                  <div className="mb-4 flex flex-wrap gap-2.5">
                    {currentFeature.bullets.map((bullet, i) => (
                      <span key={i} className="flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-white/80 backdrop-blur-md">
                        <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                        {bullet}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between gap-6 border-t border-white/10 bg-black/60 p-6 backdrop-blur-xl md:p-8">
                <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-white/35">What this page is for</p>
                    <h4 className="mt-3 text-2xl font-bold text-white">{currentFeature.title}</h4>
                    <p className="mt-3 text-sm leading-6 text-white/58">{currentFeature.summary}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/35">What to do here</p>
                    <p className="mt-3 text-sm leading-6 text-white/75">{currentFeature.walkthrough}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-white/45">Use this as a guided demo, then jump directly into the live page.</p>
                  <Button
                    onClick={() => onNavigate(currentFeature.page)}
                    className="rounded-full bg-white px-8 py-6 text-lg font-bold text-black shadow-[0_0_20px_rgba(255,255,255,0.28)] transition-all hover:scale-[1.02] hover:bg-cyan-50 hover:text-cyan-900"
                  >
                    Open {currentFeature.title}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}