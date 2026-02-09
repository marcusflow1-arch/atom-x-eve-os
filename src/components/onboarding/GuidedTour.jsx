import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Home, ShoppingBag, Menu, Library, Trophy, Swords, Layers, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TOUR_STEPS = [
  {
    id: 'home-button',
    title: 'Home & Store',
    description: 'This button is both your Home and your Store. Tap once to go Home, tap again to open the Store. It\'s your main hub for everything.',
    anchor: 'top-left',
    arrowDirection: 'down',
    icon: Home,
    offsetX: 180,
    offsetY: 70,
  },
  {
    id: 'nav-menu',
    title: 'Navigation Menu',
    description: 'This is your main navigation drawer. It lets you move through all the pages in the app — Library, Clan, Community, Achievements, Settings, and more.',
    anchor: 'top-left',
    arrowDirection: 'down',
    icon: Menu,
    offsetX: 50,
    offsetY: 70,
  },
  {
    id: 'quick-access',
    title: 'Quick Access Menu',
    description: 'This floating button on the left edge opens your Quick Access panel — Library, Streaming (Aura), Entertainment, Friends List, AI Story, and AI Battle. Everything you need, one click away.',
    anchor: 'middle-left',
    arrowDirection: 'right',
    icon: Library,
    offsetX: 60,
    offsetY: 0,
  },
  {
    id: 'achievements',
    title: 'Achievements & Cards',
    description: 'This is where you work on achievements. Every achievement you unlock gives you a card — an ability, equipment, or even a companion. You can upgrade them to increase power, and trade or sell them on the marketplace.',
    anchor: 'top-center',
    arrowDirection: 'down',
    icon: Trophy,
    offsetX: 0,
    offsetY: 70,
  },
  {
    id: 'ai-battle',
    title: 'AI Battle (PvP & PvE)',
    description: 'This is where you battle. Enter PvP arenas to fight other players, or take on PvE challenges. Use your cards and loadouts to build strategies and earn exclusive rewards.',
    anchor: 'top-center',
    arrowDirection: 'down',
    icon: Swords,
    offsetX: 0,
    offsetY: 70,
  },
  {
    id: 'skill-tree',
    title: 'Skill Tree & Genre Mastery',
    description: 'Your progression path for each game genre. Unlock new tiers, earn season rewards, and specialize your playstyle across MMO, Shooter, Fantasy, and more.',
    anchor: 'top-center',
    arrowDirection: 'down',
    icon: Layers,
    offsetX: 0,
    offsetY: 70,
  },
];

export default function GuidedTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isFirst = currentStep === 0;
  const Icon = step.icon;

  const getPosition = () => {
    switch (step.anchor) {
      case 'top-left':
        return { top: step.offsetY, left: step.offsetX };
      case 'top-center':
        return { top: step.offsetY, left: '50%', transform: `translateX(calc(-50% + ${step.offsetX}px))` };
      case 'middle-left':
        return { top: '50%', left: step.offsetX, transform: `translateY(calc(-50% + ${step.offsetY}px))` };
      default:
        return { top: 100, left: 100 };
    }
  };

  const getArrow = () => {
    switch (step.arrowDirection) {
      case 'down':
        return (
          <div className="absolute -top-3 left-8">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[12px] border-l-transparent border-r-transparent border-b-cyan-500/80" />
          </div>
        );
      case 'right':
        return (
          <div className="absolute top-8 -left-3">
            <div className="w-0 h-0 border-t-[10px] border-b-[10px] border-r-[12px] border-t-transparent border-b-transparent border-r-cyan-500/80" />
          </div>
        );
      case 'left':
        return (
          <div className="absolute top-8 -right-3">
            <div className="w-0 h-0 border-t-[10px] border-b-[10px] border-l-[12px] border-t-transparent border-b-transparent border-l-cyan-500/80" />
          </div>
        );
      default:
        return null;
    }
  };

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep(s => s + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) setCurrentStep(s => s - 1);
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/70 pointer-events-auto" onClick={handleSkip} />

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.3 }}
          className="absolute pointer-events-auto"
          style={{
            ...getPosition(),
            maxWidth: 380,
            zIndex: 10000,
          }}
        >
          <div className="relative">
            {getArrow()}

            <div
              className="rounded-2xl p-6 shadow-2xl border border-cyan-500/30"
              style={{
                background: 'rgba(10, 20, 35, 0.95)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                boxShadow: '0 0 40px rgba(34, 211, 238, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-base">{step.title}</h3>
                  <p className="text-cyan-400/80 text-[10px] font-semibold uppercase tracking-wider">Step {currentStep + 1} of {TOUR_STEPS.length}</p>
                </div>
                <button
                  onClick={handleSkip}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Description */}
              <p className="text-white/70 text-sm leading-relaxed mb-5">
                {step.description}
              </p>

              {/* Progress Dots */}
              <div className="flex items-center justify-center gap-1.5 mb-4">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep ? 'w-6 bg-cyan-400' : i < currentStep ? 'w-1.5 bg-cyan-400/50' : 'w-1.5 bg-white/20'
                    }`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSkip}
                  className="text-white/40 hover:text-white/70 text-xs font-medium transition-colors"
                >
                  Skip Tour
                </button>
                <div className="flex items-center gap-2">
                  {!isFirst && (
                    <button
                      onClick={handlePrev}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition-all flex items-center gap-1.5"
                  >
                    {isLast ? 'Get Started' : 'Next'}
                    {!isLast && <ChevronRight className="w-4 h-4" />}
                    {isLast && <Star className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}