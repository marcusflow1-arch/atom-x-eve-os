import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function VisualFeatureGuide({ features, onNavigate }) {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-4 md:px-8">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
          Platform Walkthrough
        </h2>
        <p className="text-white/60 text-lg max-w-2xl mx-auto">
          Explore the key systems that power your experience. Click on a feature to learn more and jump directly to it.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:h-[600px]">
        {/* Navigation / List */}
        <div className="lg:w-1/3 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
          {features.map((feature, index) => (
            <button
              key={index}
              onClick={() => setActiveFeature(index)}
              className={`text-left p-6 rounded-2xl border transition-all duration-300 group relative overflow-hidden ${
                activeFeature === index 
                  ? 'bg-white/10 border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.15)]' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <div className="flex items-start gap-4 relative z-10">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} bg-opacity-20`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg mb-1 transition-colors ${activeFeature === index ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                    {feature.title}
                  </h3>
                  <p className="text-white/40 text-sm line-clamp-2">
                    {feature.summary}
                  </p>
                </div>
              </div>
              {activeFeature === index && (
                <motion.div
                  layoutId="activeGlow"
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent pointer-events-none"
                />
              )}
            </button>
          ))}
        </div>

        {/* Visual Preview Area */}
        <div className="lg:w-2/3 relative rounded-3xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Screenshot / Visual */}
              <div className="flex-1 relative overflow-hidden bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                <img 
                  src={features[activeFeature].image || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80"} 
                  alt={features[activeFeature].title}
                  className="w-full h-full object-cover object-center opacity-80"
                />
                
                {/* Floating Highlights/Tooltips on the image could go here */}
                <div className="absolute bottom-8 left-8 right-8 z-20">
                  <div className="flex flex-wrap gap-3 mb-6">
                    {features[activeFeature].bullets.map((bullet, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-black/60 border border-white/10 text-white/80 text-xs backdrop-blur-md flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        {bullet}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-8 bg-black/60 backdrop-blur-xl border-t border-white/10 flex justify-between items-center gap-4">
                <div>
                  <h4 className="text-white font-bold text-xl mb-1">{features[activeFeature].title}</h4>
                  <p className="text-white/60 text-sm">Ready to explore this section?</p>
                </div>
                <Button 
                  onClick={() => onNavigate(features[activeFeature].page)}
                  className="bg-white text-black hover:bg-cyan-50 hover:text-cyan-900 px-8 py-6 text-lg rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105"
                >
                  Enter {features[activeFeature].title}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}