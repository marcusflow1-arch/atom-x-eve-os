import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Volume2, VolumeX, Info, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function IntroVideoHero({ streamer, isActive }) {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(e => console.log("Autoplay prevented", e));
      setIsPlaying(true);
    } else if (!isActive && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleProfileClick = () => {
    navigate(createPageUrl('StreamerProfile') + `?id=${streamer.id}`);
  };

  if (!streamer) return null;

  return (
    <div className="relative h-full w-full rounded-3xl overflow-hidden group cursor-pointer border border-white/10 shadow-2xl" onClick={handleProfileClick}>
      {/* Video Layer */}
      <div className="absolute inset-0 bg-slate-900">
        <video
          ref={videoRef}
          src={streamer.intro_video_url || "https://cdn.coverr.co/videos/coverr-person-typing-on-a-computer-keyboard-4643/1080p.mp4"}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
          loop
          muted={isMuted}
          playsInline
        />
        {/* Cinematic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Content Layer */}
      <div className="absolute inset-0 p-8 flex flex-col justify-end z-10 pointer-events-none">
        
        {/* Top Right Controls */}
        <div className="absolute top-6 right-6 flex gap-2 pointer-events-auto">
          <button 
            onClick={toggleMute}
            className="p-3 rounded-full bg-black/40 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white transition-all"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        {/* Identity Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl"
        >
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 backdrop-blur-md px-3 py-1 text-xs uppercase tracking-wider font-bold">
              {streamer.stream_focus || "Variety"}
            </Badge>
            {streamer.tags?.map(tag => (
              <Badge key={tag} variant="outline" className="border-white/20 text-white/70 backdrop-blur-md">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Name & Title */}
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-2xl">
            {streamer.username || "Unknown Wanderer"}
          </h1>

          {/* Bio Quote */}
          <div className="relative pl-6 mb-6 border-l-4 border-cyan-500/50">
            <p className="text-xl md:text-2xl text-white/90 font-light italic leading-relaxed">
              "{streamer.bio_short || "I play to explore the unknown corners of digital worlds."}"
            </p>
          </div>

          {/* Context Disclaimer (The "Real Me" vs "Stream Me") */}
          {streamer.context_disclaimer && (
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 mb-6 w-fit">
              <Info size={16} className="text-cyan-400 shrink-0" />
              <p className="text-xs text-white/60 font-medium">
                {streamer.context_disclaimer}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pointer-events-auto">
            <Button 
              className="bg-white text-black hover:bg-cyan-50 px-8 py-6 rounded-full text-lg font-bold shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all hover:scale-105"
              onClick={handleProfileClick}
            >
              <User className="mr-2" size={20} />
              Meet {streamer.username}
            </Button>
            <Button 
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 px-8 py-6 rounded-full text-lg font-medium backdrop-blur-md"
            >
              View Games
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}