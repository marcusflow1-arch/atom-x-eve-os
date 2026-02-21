import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Gamepad2, Brain, Trophy, Users, Sparkles, Play, 
  ChevronRight, Zap, Layers, Radio, ArrowRight,
  BookOpen, Swords, Crown, Heart, Home, ShoppingBag, Library as LibraryIcon, MessageSquare, Target, Hammer
} from 'lucide-react';
import PageGuideCard from '@/components/onboarding/PageGuideCard';
import { Button } from '@/components/ui/button';
import SideAccessMenu from '@/components/dashboard/SideAccessMenu';

// Core Loop Pillar Card
const PillarCard = ({ icon: Icon, title, description, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.6 }}
    className="relative group"
  >
    <div 
      className="p-8 rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-500 h-full"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-white/60 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

// Feature Strip
const FeatureStrip = ({ text, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-4 py-4 border-b border-white/5"
  >
    <div className="w-2 h-2 rounded-full bg-cyan-400" />
    <p className="text-white/80 text-lg">{text}</p>
  </motion.div>
);

// Path Selection Card
const PathCard = ({ icon: Icon, title, description, color, selected, onClick }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.02, y: -4 }}
    whileTap={{ scale: 0.98 }}
    className={`relative p-6 rounded-2xl border text-left transition-all duration-300 ${
      selected 
        ? 'border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.2)]' 
        : 'border-white/10 hover:border-white/20'
    }`}
    style={{
      background: selected ? 'rgba(34, 211, 238, 0.1)' : 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(20px)',
    }}
  >
    {selected && (
      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center">
        <ChevronRight className="w-4 h-4 text-black" />
      </div>
    )}
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-white/50 text-sm">{description}</p>
  </motion.button>
);

export default function OnboardingHome() {
  const navigate = useNavigate();
  const [selectedPath, setSelectedPath] = useState(null);

  const handleBegin = () => {
    // Store selected path preference
    if (selectedPath) {
      localStorage.setItem('atom_eve_preferred_path', selectedPath);
    }
    // Mark onboarding as seen
    localStorage.setItem('atom_eve_onboarding_complete', 'true');
    // Navigate to avatar setup or dashboard
    navigate(createPageUrl('LunaTemplate'));
  };

  const paths = [
    { id: 'story', icon: BookOpen, title: 'AI Story Mode', description: 'Narrative-driven progression with your AI companion', color: 'from-blue-500 to-indigo-600' },
    { id: 'battle', icon: Swords, title: 'AI Battle', description: 'Competitive PvP and challenging PvE encounters', color: 'from-red-500 to-rose-600' },
    { id: 'collector', icon: Trophy, title: 'Collector', description: 'Cards, gear, achievements, and legacy systems', color: 'from-amber-500 to-orange-600' },
    { id: 'social', icon: Users, title: 'Social', description: 'Clans, friends, events, and community', color: 'from-purple-500 to-pink-600' },
  ];

  return (
    <div className="min-h-screen w-full text-white overflow-y-auto overflow-x-hidden" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}>
      <SideAccessMenu />
      
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-cyan-500/10 via-transparent to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-purple-500/10 via-transparent to-transparent blur-3xl" />
      </div>

      {/* SECTION 1: HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20">
        {/* AI Avatar Silhouette */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-b from-cyan-500/5 to-transparent blur-3xl"
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center relative z-10"
        >
          {/* Logo */}
          <motion.h1 
            className="text-6xl md:text-8xl font-black tracking-tighter mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-white via-cyan-200 to-purple-300 bg-clip-text text-transparent">
              Atom × Eve
            </span>
          </motion.h1>

          {/* Tagline */}
          <motion.p 
            className="text-xl md:text-2xl text-white/60 mb-4 font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            An AI-powered gaming OS.
          </motion.p>

          {/* Value Props */}
          <motion.div 
            className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 text-white/40 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span className="flex items-center gap-2">
              <Play className="w-4 h-4 text-cyan-400" />
              Play games.
            </span>
            <span className="hidden md:block">•</span>
            <span className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              Evolve your AI.
            </span>
            <span className="hidden md:block">•</span>
            <span className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Collect power across worlds.
            </span>
          </motion.div>

          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col items-center gap-4"
          >
            <Button
              onClick={() => document.getElementById('path-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-10 py-6 text-lg font-bold bg-white text-black hover:bg-white/90 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all"
            >
              Begin Initialization
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <div className="flex items-center gap-6 mt-4 text-sm text-white/40">
              <button className="hover:text-white transition-colors">Watch Overview</button>
              <span>•</span>
              <button className="hover:text-white transition-colors">Learn More</button>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
          >
            <div className="w-1 h-2 bg-white/40 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* SECTION 2: CORE LOOP */}
      <section className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">The Core Loop</h2>
            <p className="text-white/50 text-lg">Three pillars that power your journey</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <PillarCard
              icon={Gamepad2}
              title="Play"
              description="Games, stories, battles. Every session feeds your progression and shapes your AI companion."
              color="from-cyan-500 to-blue-600"
              delay={0.1}
            />
            <PillarCard
              icon={Brain}
              title="Evolve"
              description="Your AI learns from every action. It adapts, remembers, and grows alongside you."
              color="from-purple-500 to-pink-600"
              delay={0.2}
            />
            <PillarCard
              icon={Layers}
              title="Collect"
              description="Cards, gear, achievements, legacy items. Build a collection that transcends individual games."
              color="from-amber-500 to-orange-600"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: WHY DIFFERENT */}
      <section className="relative py-32 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Not Another Launcher</h2>
            <p className="text-white/50 text-lg">This is different from Steam, Xbox, Twitch, and Discord.</p>
          </motion.div>

          <div className="space-y-2">
            <FeatureStrip text="AI Avatar persists across every game you play" delay={0.1} />
            <FeatureStrip text="Achievements become usable assets in your collection" delay={0.2} />
            <FeatureStrip text="Streaming and progression are connected" delay={0.3} />
            <FeatureStrip text="Old games get new life through AI enhancement" delay={0.4} />
            <FeatureStrip text="Your gaming legacy follows you everywhere" delay={0.5} />
          </div>
        </div>
      </section>

      {/* SECTION 4: PATH SELECTION */}
      <section id="path-section" className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How Do You Want to Begin?</h2>
            <p className="text-white/50 text-lg">Choose your preferred path (you can explore everything later)</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {paths.map((path) => (
              <PathCard
                key={path.id}
                {...path}
                selected={selectedPath === path.id}
                onClick={() => setSelectedPath(path.id)}
              />
            ))}
          </div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Button
              onClick={handleBegin}
              disabled={!selectedPath}
              className={`px-12 py-6 text-lg font-bold rounded-full transition-all ${
                selectedPath 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.4)]' 
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              Enter Atom × Eve
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
            
            {!selectedPath && (
              <p className="text-white/30 text-sm mt-4">Select a path above to continue</p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      {/* SECTION 5: System Map & Page Guide */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-3">How the App is Organized</h2>
            <p className="text-white/60">A quick guide to every major area and what you can do there</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Home, title: 'Dashboard (Home)', summary: 'Your command center with quick access to everything.', bullets: ['Open overlays: Achievements, Skill Tree, Friends', 'Switch between User and AI modes', 'Jump to Store, Library, Clan, Forum'], page: 'LunaTemplate', color: 'from-cyan-500 to-blue-600' },
              { icon: ShoppingBag, title: 'Store', summary: 'Browse, buy, and trade games and items.', bullets: ['Explore categories and featured games', 'Open marketplace and trading posts', 'View limited editions and deals'], page: 'Store', color: 'from-amber-500 to-orange-500' },
              { icon: LibraryIcon, title: 'Library', summary: 'Manage owned games and launch sessions.', bullets: ['Open game details and launchers', 'See recent achievements per game', 'Access game-specific overlays'], page: 'Library', color: 'from-purple-500 to-pink-500' },
              { icon: Trophy, title: 'Achievements', summary: 'Track, unlock, and showcase achievements.', bullets: ['View unlock requirements', 'Open card details and rewards', 'Share, challenge, and discuss'], page: 'AIAchievements', color: 'from-yellow-500 to-orange-500' },
              { icon: Layers, title: 'Genre Mastery', summary: 'Progression path and rewards per genre.', bullets: ['Inspect level track rewards', 'Preview legendary unlocks', 'Jump into featured games'], page: 'GenreMastery', color: 'from-teal-500 to-emerald-600' },
              { icon: Swords, title: 'AI Battle', summary: 'PvE/PvP encounters tuned by your AI.', bullets: ['Enter battles from curated queues', 'Earn XP and unique rewards', 'Practice builds and loadouts'], page: 'AIBattle', color: 'from-rose-500 to-red-600' },
              { icon: MessageSquare, title: 'Community', summary: 'Forums, guides, and social posts.', bullets: ['Read/write posts and guides', 'Challenge friends to unlocks', 'Follow hot topics'], page: 'Community', color: 'from-indigo-500 to-blue-700' },
              { icon: Users, title: 'Clan', summary: 'Group play, events, and shared progress.', bullets: ['View clan dashboard and roster', 'Join events and raids', 'Post announcements and chat'], page: 'Clan', color: 'from-sky-500 to-cyan-600' },
              { icon: Crown, title: 'Season Pass', summary: 'Seasonal rewards and progression.', bullets: ['Track seasonal XP', 'Preview next unlocks', 'Claim earned items'], page: 'SeasonalPass', color: 'from-lime-500 to-green-600' },
              { icon: Hammer, title: 'Blacksmith', summary: 'Upgrade and evolve your cards and gear.', bullets: ['Level up and enhance items', 'Combine and ascend cards', 'Trade or list valuables'], page: 'Blacksmith', color: 'from-slate-500 to-zinc-600' },
              { icon: Radio, title: 'Streaming Hub', summary: 'Stream, record, and manage VODs.', bullets: ['Go live or upload recordings', 'Manage titles, tags, and visibility', 'Track views and interactions'], page: 'StreamingHub', color: 'from-fuchsia-500 to-purple-600' },
            ].map((cfg) => (
              <PageGuideCard
                key={cfg.title}
                icon={cfg.icon}
                title={cfg.title}
                summary={cfg.summary}
                bullets={cfg.bullets}
                color={cfg.color}
                onClick={() => navigate(createPageUrl(cfg.page))}
              />
            ))}
          </div>
        </div>
      </section>

      <footer className="relative py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-white/30 text-sm">© 2025 Atom × Eve. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}