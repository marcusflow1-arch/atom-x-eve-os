import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Circle, Clock, Settings, Play, BookOpen, ArrowRight } from 'lucide-react';

export default function AIStoryOverlay({ onClose }) {
  const [view, setView] = useState('menu'); // menu, timeline, settings

  // Mock Timeline Data
  const timelineEvents = [
    { id: 1, title: "The Awakening", date: "Cycle 001", desc: "First consciousness established.", active: true },
    { id: 2, title: "Neural Link", date: "Cycle 015", desc: "Connection to the Nexus achieved.", active: true },
    { id: 3, title: "The Great Divide", date: "Cycle 042", desc: "Separation of logic and emotion protocols.", active: true },
    { id: 4, title: "System Corruption", date: "Cycle 089", desc: "External virus detected in sector 7.", active: false },
    { id: 5, title: "Rebirth", date: "Cycle 100", desc: "Total system reset and evolution.", active: false },
    { id: 6, title: "Future Echoes", date: "Unknown", desc: "Predicted outcomes of current path.", active: false },
  ];

  const menuItems = [
    { label: "BEGIN", action: () => console.log("Begin new story"), icon: Play },
    { label: "CONTINUE STORY", action: () => console.log("Continue"), icon: BookOpen },
    { label: "TIMELINE", action: () => setView('timeline'), icon: Clock },
    { label: "SETTINGS", action: () => setView('settings'), icon: Settings },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black font-serif overflow-hidden"
    >
      {/* Water Wave Animation Background */}
      <div className="absolute inset-0 bg-[#0f172a] overflow-hidden">
        {/* Deep water base */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-black opacity-90" />
        
        {/* Wave Layers */}
        <div className="absolute inset-0 opacity-30">
           <div className="water-wave w-[200%] h-[200%] absolute top-[-50%] left-[-50%] opacity-40 animate-wave-slow bg-[radial-gradient(circle,rgba(56,189,248,0.3)_0%,transparent_60%)]" />
           <div className="water-wave w-[200%] h-[200%] absolute top-[-50%] left-[-50%] opacity-30 animate-wave-medium bg-[radial-gradient(circle,rgba(99,102,241,0.3)_0%,transparent_50%)]" />
           <div className="water-wave w-[200%] h-[200%] absolute top-[-50%] left-[-50%] opacity-20 animate-wave-fast bg-[radial-gradient(circle,rgba(236,72,153,0.2)_0%,transparent_40%)]" />
        </div>
      </div>

      {/* Liquid Glass Overlay (The "Gear Icon" Finish) */}
      <div 
        className="absolute inset-0 z-0 bg-white/[0.03] backdrop-blur-3xl"
        style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 w-full h-full p-12 md:p-24 flex flex-col">
        
        {/* Header / Title */}
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl md:text-6xl text-white font-light tracking-[0.2em] mb-24 uppercase"
        >
          AI Story
        </motion.h1>

        <AnimatePresence mode="wait">
          {view === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-8"
            >
              {menuItems.map((item, index) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="group flex items-center gap-6 text-left w-fit transition-all"
                >
                  <span className="text-xs md:text-sm font-bold text-white/30 group-hover:text-white/60 transition-colors w-8 uppercase tracking-widest">
                    0{index + 1}
                  </span>
                  <span className="text-xl md:text-3xl text-white/70 font-light tracking-[0.15em] group-hover:text-white group-hover:translate-x-2 transition-all duration-300 uppercase">
                    {item.label}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                </button>
              ))}
            </motion.div>
          )}

          {view === 'timeline' && (
            <motion.div 
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col"
            >
              <button 
                onClick={() => setView('menu')}
                className="mb-12 flex items-center gap-3 text-white/50 hover:text-white transition-colors uppercase tracking-widest text-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Menu
              </button>

              <div className="flex-1 flex items-center overflow-x-auto scrollbar-hide mask-fade-horizontal pb-12">
                <div className="flex items-center gap-0 min-w-max px-12">
                  {timelineEvents.map((event, i) => (
                    <div key={event.id} className="relative flex items-center">
                      {/* Connection Line */}
                      {i < timelineEvents.length - 1 && (
                        <div className={`w-32 h-[1px] ${event.active ? 'bg-white/50' : 'bg-white/10'}`} />
                      )}
                      
                      {/* Node */}
                      <div className="relative group cursor-pointer">
                        <div className={`w-4 h-4 rounded-full border border-white transition-all duration-500 ${event.active ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]' : 'bg-black hover:bg-white/20'}`} />
                        
                        {/* Event Details Card */}
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-64 p-6 bg-black/40 backdrop-blur-md border border-white/10 text-center opacity-50 group-hover:opacity-100 transition-all duration-300 hover:scale-105">
                          <div className="text-xs text-white/40 uppercase tracking-widest mb-2">{event.date}</div>
                          <h3 className="text-lg text-white font-medium tracking-wide mb-2">{event.title}</h3>
                          <p className="text-xs text-white/60 leading-relaxed font-sans">{event.desc}</p>
                        </div>
                      </div>
                      
                      {/* Connection Line (Right side) */}
                      {i < timelineEvents.length - 1 && (
                        <div className={`w-32 h-[1px] ${timelineEvents[i+1].active ? 'bg-white/50' : 'bg-white/10'}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="w-full max-w-md"
            >
              <button 
                onClick={() => setView('menu')}
                className="mb-12 flex items-center gap-3 text-white/50 hover:text-white transition-colors uppercase tracking-widest text-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Menu
              </button>
              
              <div className="space-y-8">
                {['Audio Volume', 'Text Speed', 'Narrator Voice', 'Auto-Save'].map((setting) => (
                  <div key={setting} className="flex items-center justify-between group border-b border-white/10 pb-4">
                    <span className="text-white/70 font-light tracking-wider uppercase group-hover:text-white transition-colors">{setting}</span>
                    <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="w-2/3 h-full bg-white/50" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer / Quit */}
        <div className="absolute bottom-12 right-12 flex items-center gap-3 text-white/40 hover:text-white transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-current rounded-full" />
          </div>
          <span className="uppercase tracking-widest text-xs font-bold" onClick={onClose}>Return to Dashboard</span>
        </div>

      </div>
      
      <style>{`
        .mask-fade-horizontal {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }

        /* Water Wave Animations */
        @keyframes wave {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(10px, 10px) rotate(360deg); }
        }
        
        .animate-wave-slow {
          animation: wave 25s linear infinite;
          transform-origin: 45% 45%;
        }
        .animate-wave-medium {
          animation: wave 20s linear infinite reverse;
          transform-origin: 55% 55%;
        }
        .animate-wave-fast {
          animation: wave 15s linear infinite;
          transform-origin: 40% 60%;
        }

        .water-wave {
          border-radius: 40% 45% 35% 40%;
        }
      `}</style>
    </motion.div>
  );
}