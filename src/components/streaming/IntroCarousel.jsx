import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Play, User, Info, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function IntroCarousel({ streamers }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const navigate = useNavigate();

  const activeStreamer = streamers[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % streamers.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + streamers.length) % streamers.length);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      // Auto cycle if user hasn't interacted? Maybe too annoying. 
      // Let's stick to manual navigation for "low pressure" as requested.
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[60vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStreamer.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {/* Video Background */}
          <video
            src={activeStreamer.intro_video_url}
            className="w-full h-full object-cover opacity-80"
            autoPlay
            loop
            muted={isMuted}
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content Overlay */}
      <div className="absolute inset-0 p-10 flex flex-col justify-end">
        
        {/* Top Controls */}
        <div className="absolute top-6 right-6 flex items-center gap-3">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-3 rounded-full bg-black/40 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white transition-all"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        {/* Info Section */}
        <div className="max-w-2xl relative z-10">
          <div className="flex gap-2 mb-4">
             {activeStreamer.tags.map(tag => (
               <Badge key={tag} className="bg-white/10 text-white backdrop-blur-md border-white/20 hover:bg-white/20">{tag}</Badge>
             ))}
          </div>

          <motion.h1 
            key={activeStreamer.username}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl font-black text-white mb-2 tracking-tight"
          >
            {activeStreamer.username}
          </motion.h1>

          <motion.p 
             key={activeStreamer.tagline}
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.1 }}
             className="text-xl text-white/90 font-light mb-6 italic"
          >
            "{activeStreamer.tagline}"
          </motion.p>

          <motion.div
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="flex items-center gap-4"
          >
            <Button 
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-6 rounded-full text-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-105"
              onClick={() => navigate(createPageUrl('StreamerProfile') + `?id=${activeStreamer.id}`)}
            >
              <User className="mr-2" size={20} />
              Meet {activeStreamer.username}
            </Button>
            {activeStreamer.is_live && (
               <Button 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-6 rounded-full text-lg font-medium backdrop-blur-md"
               >
                 <Play className="mr-2 fill-current" size={18} />
                 Watch Live
               </Button>
            )}
          </motion.div>
        </div>

        {/* Navigation Arrows */}
        <div className="absolute bottom-10 right-10 flex gap-4">
          <button 
            onClick={handlePrev}
            className="p-4 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white transition-all hover:scale-110"
          >
            <ArrowLeft size={24} />
          </button>
          <button 
            onClick={handleNext}
            className="p-4 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white transition-all hover:scale-110"
          >
            <ArrowRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}