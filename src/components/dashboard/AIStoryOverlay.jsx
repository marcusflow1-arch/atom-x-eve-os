import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Clock, Settings, Play, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';

// Defined Story Chapters Structure
const STORY_CHAPTERS = [
  { id: '1', label: 'Chapter 1', title: "The Awakening", desc: "First consciousness established." },
  { id: '1A', label: 'Chapter 1A', title: "Neural Link", desc: "Connection to the Nexus achieved." },
  { id: '1AB', label: 'Chapter 1AB', title: "The Great Divide", desc: "Separation of logic and emotion protocols." },
  { id: '1AC', label: 'Chapter 1AC', title: "System Corruption", desc: "External virus detected in sector 7." },
  { id: '2', label: 'Chapter 2', title: "Rebirth", desc: "Total system reset and evolution." },
  { id: '3', label: 'Chapter 3', title: "Future Echoes", desc: "Predicted outcomes of current path." },
];

export default function AIStoryOverlay({ onClose }) {
  const [view, setView] = useState('menu'); // menu, timeline, settings
  const { user } = useAuth();
  
  // Fetch Plasma Water video or fallback to active background
  const { data: heroBackgrounds } = useQuery({
    queryKey: ['heroBackgrounds'],
    queryFn: () => base44.entities.HeroBackground.list(),
  });

  // Fetch Story Progress
  const { data: storyProgress } = useQuery({
    queryKey: ['storyProgress', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      // In a real app we'd filter by user_id, but assuming single user context or using built-in
      const res = await base44.entities.StoryProgress.list(); // Or filter logic
      // Since list returns all, we find ours or mock it if empty
      // Ideally: base44.entities.StoryProgress.filter({ user_id: user.id })
      // For now, let's try to find one or default
      const found = res.find(p => p.user_id === user.id);
      return found || { current_chapter_id: '1', completed_chapter_ids: [] };
    },
    enabled: !!user?.id,
  });

  const plasmaVideo = heroBackgrounds?.find(bg => bg.title?.toLowerCase().includes('plasma')) || 
                      heroBackgrounds?.find(bg => bg.is_active);
  const [timeState, setTimeState] = useState('night');

  // Time-Based Background Engine
  useEffect(() => {
    const updateTimeTheme = () => {
      const hour = new Date().getHours();
      
      if (hour >= 5 && hour < 11) {
        setTimeState('morning'); // Sunrise: 5 AM - 11 AM
      } else if (hour >= 11 && hour < 15) {
        setTimeState('day');     // Day: 11 AM - 3 PM
      } else if (hour >= 15 && hour < 19) {
        setTimeState('evening'); // Sunset: 3 PM - 7 PM
      } else {
        setTimeState('night');   // Night: 7 PM - 5 AM
      }
    };

    updateTimeTheme();
    const interval = setInterval(updateTimeTheme, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Gradient configs for each time state
  const timeGradients = {
    morning: 'from-indigo-400 via-purple-400 to-orange-300',
    day: 'from-blue-500 via-cyan-400 to-sky-300',
    evening: 'from-indigo-900 via-purple-800 to-orange-600',
    night: 'from-slate-950 via-gray-900 to-black',
  };

  // Process Timeline Events with User Progress
  const timelineEvents = STORY_CHAPTERS.map(chapter => {
    const isCompleted = storyProgress?.completed_chapter_ids?.includes(chapter.id);
    const isCurrent = storyProgress?.current_chapter_id === chapter.id;
    // Active if completed or current
    const active = isCompleted || isCurrent;
    
    return {
      ...chapter,
      active,
      isCurrent,
      isCompleted
    };
  });

  const menuItems = [
    { label: "BEGIN", action: () => console.log("Begin new story"), icon: Play },
    { label: "CONTINUE STORY", action: () => console.log("Continue"), icon: BookOpen },
    { label: "TIMELINE", action: () => setView('timeline'), icon: Clock },
    { label: "MEMORY", action: () => setView('memory'), icon: Clock },
    { label: "SETTINGS", action: () => setView('settings'), icon: Settings },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-full z-[100] font-serif overflow-hidden bg-transparent"
    >
      {/* LAYER 0: Plasma Water Video Background */}
      {/* LAYER 0: Plasma Water Video Background */}
      {plasmaVideo && (
        <div className="absolute inset-0 z-0 transform-gpu">
           <video
             key={plasmaVideo.video_url}
             src={plasmaVideo.video_url}
             className="w-full h-full object-cover"
             autoPlay
             loop
             muted
             playsInline
             preload="auto"
             style={{ transform: 'translateZ(0)', willChange: 'transform' }}
           />
        </div>
      )}

      {/* LAYER 1: Dynamic Background Layer (Theme Overlay) */}
      <div className={`absolute inset-0 bg-gradient-to-br ${timeGradients[timeState]} transition-colors duration-[3000ms] ease-in-out opacity-60 mix-blend-multiply z-0`}>
        {/* Animated flow effect */}
        <div className="absolute inset-0 opacity-40 animate-slow-flow bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* LAYER 2: Liquid Glass Layer */}
      <div 
        className="absolute inset-0 m-0 md:m-0 bg-transparent"
      >
        {/* Subtle texture/grain for glass feel */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        
        {/* LAYER 3: UI Content Layer */}
        <div className="relative z-10 w-full h-full p-12 md:p-24 flex flex-col text-white">
          
          {/* Header / Title */}
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-6xl font-light tracking-[0.2em] mb-24 uppercase drop-shadow-lg"
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
                    <span className="text-xs md:text-sm font-bold text-white/50 group-hover:text-white transition-colors w-8 uppercase tracking-widest">
                      0{index + 1}
                    </span>
                    <span className="text-xl md:text-3xl text-white/80 font-light tracking-[0.15em] group-hover:text-white group-hover:translate-x-2 transition-all duration-300 uppercase drop-shadow-md">
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
                  className="mb-12 flex items-center gap-3 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-sm drop-shadow"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Menu
                </button>

                <div className="flex-1 flex items-center justify-start md:justify-center overflow-x-auto scrollbar-hide mask-fade-horizontal pb-12 pt-20">
                  <div className="flex items-center min-w-max px-12">
                    {timelineEvents.map((event, i) => (
                      <React.Fragment key={event.id}>
                        {/* Node */}
                        <div className="relative group flex flex-col items-center">
                          {/* Chapter Label Above */}
                          <div className={`absolute -top-16 md:-top-12 text-[10px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-300 ${event.active ? 'text-white drop-shadow-md' : 'text-white/20'}`}>
                            {event.label}
                          </div>

                          {/* Node Circle */}
                          <div className="relative cursor-pointer z-10 p-2 -m-2">
                            <div 
                              className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 transition-all duration-500 
                                ${event.isCurrent ? 'bg-white border-white shadow-[0_0_25px_rgba(255,255,255,0.9)] scale-125 animate-pulse' : 
                                  event.isCompleted ? 'bg-white/90 border-white/90 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 
                                  'bg-black/40 border-white/20 hover:border-white/50'
                                }`}
                            />
                          </div>
                          
                          {/* Event Details Card (Hover) */}
                          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 p-4 bg-black/60 backdrop-blur-xl border border-white/10 text-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 rounded-xl shadow-2xl pointer-events-none z-50">
                            <h3 className="text-sm text-white font-bold tracking-wide mb-1">{event.title}</h3>
                            <p className="text-[10px] text-white/60 leading-relaxed font-sans">{event.desc}</p>
                          </div>
                        </div>

                        {/* Connection Line to Next */}
                        {i < timelineEvents.length - 1 && (
                          <div className="w-16 md:w-32 h-[2px] relative bg-white/10">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: timelineEvents[i+1].active ? '100%' : '0%' }}
                              className="absolute inset-0 bg-gradient-to-r from-white/80 to-white/40 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                              transition={{ duration: 0.8, delay: 0.2 }}
                            />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'memory' && (
              <motion.div 
                key="memory"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="w-full max-w-md"
              >
                <button 
                  onClick={() => setView('menu')}
                  className="mb-12 flex items-center gap-3 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-sm drop-shadow"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Menu
                </button>
                
                <h2 className="text-2xl font-light text-white mb-6 uppercase tracking-widest">Memory Core</h2>
                
                <div className="space-y-4 bg-black/20 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl">
                  <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-4">Background Simulation</h3>
                  
                  <div className="space-y-2">
                    {/* Hero's Background Plasma Water Option */}
                    <button 
                      onClick={() => {
                        // Logic to set active background would go here
                        // For now, we assume selecting it updates the plasmaVideo logic or state
                        console.log("Selected Plasma Background");
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-white/10 overflow-hidden">
                           {/* Preview Thumbnail for Plasma */}
                           <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600" />
                        </div>
                        <div className="text-left">
                          <span className="block text-white font-medium text-sm group-hover:text-cyan-400 transition-colors">Hero's Background Plasma Water</span>
                          <span className="block text-white/40 text-xs">High Fidelity • Loop</span>
                        </div>
                      </div>
                      <div className="w-4 h-4 rounded-full border border-white/30 flex items-center justify-center group-hover:border-cyan-400">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full opacity-100" />
                      </div>
                    </button>

                    {/* Other mock options */}
                    <button className="w-full flex items-center justify-between p-4 rounded-xl bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group opacity-50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center border border-white/10">
                           <div className="w-full h-full bg-slate-900" />
                        </div>
                        <div className="text-left">
                          <span className="block text-white font-medium text-sm">Standard Void</span>
                          <span className="block text-white/40 text-xs">Default • Static</span>
                        </div>
                      </div>
                    </button>
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
                  className="mb-12 flex items-center gap-3 text-white/60 hover:text-white transition-colors uppercase tracking-widest text-sm drop-shadow"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Menu
                </button>
                
                <div className="space-y-8 bg-black/20 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl">
                  {['Audio Volume', 'Text Speed', 'Narrator Voice', 'Auto-Save'].map((setting) => (
                    <div key={setting} className="flex items-center justify-between group border-b border-white/10 pb-4">
                      <span className="text-white/80 font-light tracking-wider uppercase group-hover:text-white transition-colors">{setting}</span>
                      <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="w-2/3 h-full bg-white/70 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>



        </div>
      </div>
      
      <style>{`
        .mask-fade-horizontal {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }

        @keyframes slowMotion {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animate-slow-flow {
          animation: slowMotion 30s infinite alternate;
          background-size: 200% 200%;
        }
      `}</style>
    </motion.div>
  );
}