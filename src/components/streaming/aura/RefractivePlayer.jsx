import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import WaterTubeVolumeSlider from '@/components/streaming/WaterTubeVolumeSlider'; // Reusing existing
import NeonSubscribeButton from '@/components/streaming/NeonSubscribeButton'; // Reusing existing

export default function RefractivePlayer({ isLive }) {
  if (!isLive) {
      return (
          <div className="relative w-full h-full rounded-[2rem] overflow-hidden group">
               {/* Intro Video Loop (#5) */}
               <video 
                  src="https://cdn.coverr.co/videos/coverr-person-typing-on-a-computer-keyboard-4643/1080p.mp4" 
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
                  autoPlay muted loop playsInline
               />
               
               {/* Cinematic Overlay */}
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

               {/* Center Floating Play Button (#3D Glass Icon) */}
               <div className="absolute inset-0 flex items-center justify-center">
                   <motion.button 
                      whileHover={{ scale: 1.1 }}
                      className="w-24 h-24 rounded-full relative flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)] group"
                      style={{
                          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), rgba(255,255,255,0.05) 60%, transparent 80%)'
                      }}
                   >
                       <div className="absolute inset-0 rounded-full border border-white/30 blur-[1px]" />
                       <Play className="w-8 h-8 text-white fill-white ml-1 drop-shadow-lg" />
                   </motion.button>
               </div>
               
               <div className="absolute bottom-10 left-10 max-w-lg">
                    <h2 className="text-5xl font-black text-white mb-2 tracking-tight drop-shadow-2xl">
                        MEET <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">NEON RIDER</span>
                    </h2>
                    <p className="text-lg text-white/80 font-light leading-relaxed drop-shadow-md">
                        "I explore the darkest corners of cyberpunk lore so you don't have to."
                    </p>
               </div>
          </div>
      );
  }

  return (
    <div className="relative w-full h-full rounded-[2rem] p-[2px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
       {/* Refractive Bezel (#26) - Animated Gradient Border */}
       <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-white/10 opacity-50 pointer-events-none" />
       
       <div className="relative w-full h-full rounded-[1.9rem] overflow-hidden bg-black">
           {/* Live Stream */}
           <video 
              src="https://cdn.coverr.co/videos/coverr-person-playing-a-video-game-with-a-controller-5396/1080p.mp4" 
              className="w-full h-full object-cover"
              autoPlay muted loop playsInline
           />
           
           {/* Ambient Light Bleed Overlay */}
           <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] pointer-events-none" />

           {/* Controls Overlay */}
           <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent flex items-end justify-between">
               <div className="flex items-center gap-4">
                    {/* Reusing the Water Tube Slider from previous context */}
                   <WaterTubeVolumeSlider />
               </div>
               <NeonSubscribeButton onClick={() => {}} />
           </div>
       </div>
    </div>
  );
}