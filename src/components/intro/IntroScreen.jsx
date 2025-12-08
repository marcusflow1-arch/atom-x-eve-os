import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Trophy, Gamepad2, Users, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function IntroScreen({ onComplete }) {
  const { data: heroBackgrounds } = useQuery({
    queryKey: ['heroBackgrounds'],
    queryFn: () => base44.entities.HeroBackground.list(),
  });

  const introVideo = heroBackgrounds?.find(bg => !bg.title?.toLowerCase().includes('plasma')) || 
                     heroBackgrounds?.find(bg => !bg.title?.toLowerCase().includes('plasma') && bg.is_active);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stage progression
    const stageTimer = setTimeout(() => {
      if (stage < 4) {
        setStage(stage + 1);
      } else {
        onComplete();
      }
    }, 3000); // 3 seconds per stage

    return () => {
      clearTimeout(stageTimer);
    };
  }, [stage, onComplete]);

  return (
    <div 
      className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer"
      onClick={onComplete}
    >
      {introVideo ? (
        <div className="absolute inset-0 z-0">
          <video
            src={introVideo.video_url}
            className="w-full h-full object-cover opacity-60"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-blue-950/50 to-purple-950/80" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950" />
      )}

      {/* Animated Moon with Atom Orbitals */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        {/* Moon */}
        <motion.div
          className="relative w-64 h-64"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {/* Orbital Ring 1 - Behind Moon */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-[280px] h-[80px] -translate-x-1/2 -translate-y-1/2 border-2 border-blue-400/40 rounded-full"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{
              rotateZ: 360,
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {/* Electron 1 */}
            <motion.div
              className="absolute top-0 left-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50"
              animate={{
                scale: [1, 1.4, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>

          {/* Orbital Ring 2 - Behind Moon */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-[300px] h-[90px] -translate-x-1/2 -translate-y-1/2 border-2 border-purple-400/40 rounded-full"
            style={{ transformStyle: 'preserve-3d', transform: 'rotateY(60deg)' }}
            animate={{
              rotateZ: -360,
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {/* Electron 2 */}
            <motion.div
              className="absolute top-0 left-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50"
              animate={{
                scale: [1, 1.4, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            />
          </motion.div>

          {/* Orbital Ring 3 - Behind Moon */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-[320px] h-[70px] -translate-x-1/2 -translate-y-1/2 border-2 border-cyan-400/40 rounded-full"
            style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-60deg)' }}
            animate={{
              rotateZ: 360,
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {/* Electron 3 */}
            <motion.div
              className="absolute top-0 left-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"
              animate={{
                scale: [1, 1.4, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
            />
          </motion.div>

          {/* Moon Core - On top of orbitals */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-300 via-slate-200 to-slate-400 shadow-2xl"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Moon Craters */}
            <div className="absolute top-1/4 left-1/4 w-8 h-8 rounded-full bg-slate-400/40"></div>
            <div className="absolute top-1/3 right-1/3 w-12 h-12 rounded-full bg-slate-400/30"></div>
            <div className="absolute bottom-1/4 left-1/3 w-6 h-6 rounded-full bg-slate-400/50"></div>
            <div className="absolute top-2/3 right-1/4 w-10 h-10 rounded-full bg-slate-400/35"></div>
            
            {/* Moon Glow */}
            <div className="absolute inset-0 rounded-full bg-blue-200/20 blur-xl"></div>
          </motion.div>
        </motion.div>
      </div>

      {/* Animated Background Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
              ],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-8 max-w-4xl pointer-events-none">
        <AnimatePresence mode="wait">
          {stage === 0 && (
            <motion.div
              key="stage0"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.2, y: -20 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="space-y-8"
            >
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <h1 className="text-7xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  ATOM×EVE OS
                </h1>
                <motion.div
                  className="h-1 w-64 mx-auto mt-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-2xl text-slate-300 font-light"
              >
                Welcome to the Future of Gaming
              </motion.p>
            </motion.div>
          )}

          {stage === 1 && (
            <motion.div
              key="stage1"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="space-y-8"
            >
              <motion.div
                className="flex justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-24 h-24 text-blue-400" />
              </motion.div>
              <h2 className="text-5xl font-bold text-white">AI-Powered Companions</h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Meet Atum and Eve - your intelligent AI companions that evolve with your gameplay
              </p>
            </motion.div>
          )}

          {stage === 2 && (
            <motion.div
              key="stage2"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="space-y-8"
            >
              <div className="flex justify-center gap-8">
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Trophy className="w-24 h-24 text-yellow-400" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                >
                  <Shield className="w-24 h-24 text-blue-400" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                >
                  <Zap className="w-24 h-24 text-purple-400" />
                </motion.div>
              </div>
              <h2 className="text-5xl font-bold text-white">Cross-Game Progression</h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Unlock achievements and abilities that carry across all your favorite games
              </p>
            </motion.div>
          )}

          {stage === 3 && (
            <motion.div
              key="stage3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="space-y-8"
            >
              <motion.div
                className="flex justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Users className="w-24 h-24 text-green-400" />
              </motion.div>
              <h2 className="text-5xl font-bold text-white">Community & Clans</h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Join forces with players worldwide in epic guild battles and events
              </p>
            </motion.div>
          )}

          {stage === 4 && (
            <motion.div
              key="stage4"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="space-y-8"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{ duration: 2, ease: 'easeInOut' }}
              >
                <Gamepad2 className="w-32 h-32 mx-auto text-blue-400" />
              </motion.div>
              <h2 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Let's Begin
              </h2>
              <motion.div
                className="flex justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-blue-400 rounded-full"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Ambient Line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent pointer-events-none"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}