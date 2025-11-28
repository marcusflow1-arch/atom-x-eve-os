import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Home, BookOpen, Zap, Sword, Shield, Bot, Maximize2, Minimize2, X, 
  Gamepad2, Flame, Cpu, Users, Swords
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import MoveHubTab from '../MoveHubGames';
import Profile from '../../../pages/Profile';
import Storyline from '../../../pages/Storyline';
import PinGamesContent from '../PinGamesContent';
import FusionCore from '../FusionCore';
import ConsoleHub from '../ConsoleHub';
import ThreeScene from '../../shared/ThreeScene';
import { ThemeBackground } from '../../shared/ThemeSystem';

// --- Components ---

const LiveAI3DAvatar = ({ user }) => {
  // If user has a custom 3D model URL set (from Avatar Studio)
  const customModelUrl = user?.avatar?.model_url;

  return (
    <div className="relative w-full h-full group">
      {/* Holographic Ring Effect */}
      <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-spin-slow pointer-events-none" style={{ animationDuration: '20s' }} />
      <div className="absolute inset-4 rounded-full border border-purple-500/20 animate-spin-slow pointer-events-none" style={{ animationDirection: 'reverse', animationDuration: '15s' }} />
      
      <div className="w-full h-full relative z-10 mix-blend-screen opacity-90 hover:opacity-100 transition-opacity duration-500">
        {customModelUrl ? (
            <ThreeScene modelUrl={customModelUrl} scale={1.5} />
        ) : (
            <div className="w-full h-full relative z-10 bg-black/50">
                {/* Matrix "String Code" Effect */}
                <ThemeBackground themeId="digital_matrix" />
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <div className="text-green-500 font-mono text-xs mb-2 tracking-widest">SYSTEM INITIALIZED</div>
                        <Bot className="w-16 h-16 text-green-400 mx-auto opacity-80 animate-pulse" />
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Floating Status Nodes */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-10 left-4 bg-black/40 backdrop-blur-md border border-cyan-500/30 p-3 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.15)]"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <div>
            <p className="text-[10px] text-cyan-300 uppercase tracking-wider font-bold">System Status</p>
            <p className="text-xs text-white font-mono">ONLINE // STABLE</p>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="absolute bottom-10 right-4 bg-black/40 backdrop-blur-md border border-purple-500/30 p-3 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.15)]"
      >
        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="text-[10px] text-purple-300 uppercase tracking-wider font-bold">Core Level</p>
            <p className="text-xs text-white font-mono">LVL {user?.avatar?.level || 1} // {user?.avatar?.experience || 0} XP</p>
          </div>
          <Cpu className="w-4 h-4 text-purple-400" />
        </div>
      </motion.div>
    </div>
  );
};

const CommandNode = ({ icon: Icon, label, subtitle, color, onClick, isActive, delay = 0 }) => {
  const gradients = {
    blue: 'from-cyan-900/80 to-blue-900/80 border-cyan-500/30 hover:border-cyan-400',
    purple: 'from-purple-900/80 to-fuchsia-900/80 border-purple-500/30 hover:border-purple-400',
    green: 'from-emerald-900/80 to-teal-900/80 border-emerald-500/30 hover:border-emerald-400',
    orange: 'from-orange-900/80 to-red-900/80 border-orange-500/30 hover:border-orange-400',
    pink: 'from-pink-900/80 to-rose-900/80 border-pink-500/30 hover:border-pink-400',
  };

  const glowColors = {
    blue: 'group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    purple: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]',
    green: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]',
    orange: 'group-hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]',
    pink: 'group-hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]',
  };

  return (
    <motion.button
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group relative flex-1 min-w-[140px] h-24 rounded-xl bg-gradient-to-br ${gradients[color]} border backdrop-blur-md transition-all duration-300 ${isActive ? 'ring-2 ring-white/50' : ''} ${glowColors[color]}`}
    >
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 rounded-xl" />
      
      <div className="relative h-full flex flex-col justify-between p-3">
        <div className="flex justify-between items-start">
          <div className={`p-2 rounded-lg bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`} />
        </div>
        
        <div className="text-left">
          <span className="block text-xs text-white/60 font-medium uppercase tracking-wider">{subtitle}</span>
          <span className="block text-white font-bold text-sm tracking-wide group-hover:text-white transition-colors">{label}</span>
        </div>
      </div>
    </motion.button>
  );
};

export default function AINexusView({ user, setActiveTab, onNavigate }) {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState('home');
  const [isMaximized, setIsMaximized] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  const handleCloseContent = () => {
    setActiveFeature('home');
    setIsMaximized(false);
  };

  const RightColumnContent = () => {
    // Default content if no feature or home selected
    if (!activeFeature || activeFeature === 'home') {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 rounded-3xl border border-slate-800/50 p-8">
                <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 border border-slate-700/50 animate-pulse">
                    <Bot className="w-12 h-12 text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">AI NEXUS CORE</h3>
                <p className="max-w-md text-center mb-6">Select a module from the navigation interface to access advanced systems.</p>
            </div>
        );
    }

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="h-full flex flex-col bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Window Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              {activeFeature === 'story' && <><BookOpen className="w-4 h-4 text-purple-400" /> AI STORY PROTOCOL</>}
              {activeFeature === 'skilltree' && <><Zap className="w-4 h-4 text-blue-400" /> NEURAL SKILL TREE</>}
              {activeFeature === 'loadout' && <><Sword className="w-4 h-4 text-orange-400" /> TACTICAL LOADOUT</>}
              {activeFeature === 'pingames' && <><Gamepad2 className="w-4 h-4 text-cyan-400" /> GAME LINK MATRIX</>}
              {activeFeature === 'fusion' && <><Flame className="w-4 h-4 text-red-400" /> FUSION CORE SYSTEM</>}
              {activeFeature === 'console' && <><Swords className="w-4 h-4 text-red-400" /> BATTLE CONSOLE</>}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsMaximized(!isMaximized)} className="text-slate-400 hover:text-white hover:bg-white/10">
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCloseContent} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Window Body */}
        <div className="flex-1 overflow-hidden relative">
          {/* Grid Background for content area */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
          
          <div className="h-full overflow-y-auto scrollbar-hide">
            <style>{`
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {activeFeature === 'story' && <Storyline />}
            {activeFeature === 'skilltree' && <MoveHubTab />}
            {activeFeature === 'loadout' && <Profile />}
            {activeFeature === 'pingames' && <div className="p-6"><PinGamesContent /></div>}
            {activeFeature === 'fusion' && <FusionCore />}
            {activeFeature === 'console' && <div className="h-full w-full overflow-hidden"><ConsoleHub /></div>}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative h-full w-full overflow-hidden"
    >
      {/* Futuristic Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-[#0B1120] to-black" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(14,165,233,0.1),_transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-[radial-gradient(circle_at_80%_80%,_rgba(168,85,247,0.1),_transparent_50%)]" />
      </div>

      <div className="grid grid-cols-12 gap-6 h-full">
        
        {/* LEFT SECTION: AVATAR & STATS */}
        <motion.div 
          layout
          className={`col-span-12 ${isMaximized ? 'hidden' : 'lg:col-span-4'} transition-all duration-500 ease-in-out flex flex-col gap-3 h-full`}
        >
          {/* Main Avatar Display */}
          <div className="relative flex-1 transition-all duration-500 bg-slate-800/20 rounded-3xl border border-white/5 overflow-hidden shadow-2xl group min-h-[300px]">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-0" />
            
            {/* Avatar Component */}
            <div className="relative z-10 h-full">
              <LiveAI3DAvatar user={user} />
            </div>
          </div>

          {/* Navigation Sidebar - Fixed Height Grid */}
          <div className="flex-shrink-0 grid grid-cols-2 gap-2 mt-auto">
               <Button 
                 variant={activeFeature === 'home' ? 'default' : 'outline'} 
                 onClick={() => setActiveFeature('home')} 
                 className="w-full h-10 justify-start gap-2 bg-slate-800/50 border-slate-700 px-3 overflow-hidden"
               >
                 <Home className="w-4 h-4 flex-shrink-0" /> 
                 <span className="text-xs font-medium truncate">AI Home</span>
               </Button>
               
               <Button 
                 variant={activeFeature === 'console' ? 'default' : 'outline'} 
                 onClick={() => setActiveFeature('console')} 
                 className="w-full h-10 justify-start gap-2 bg-slate-800/50 border-slate-700 px-3 overflow-hidden text-red-400 hover:text-red-300 hover:bg-red-900/20"
               >
                 <Swords className="w-4 h-4 flex-shrink-0" /> 
                 <span className="text-xs font-medium truncate">Battle Console</span>
               </Button>

               <Button 
                 variant={activeFeature === 'story' ? 'default' : 'outline'} 
                 onClick={() => setActiveFeature('story')} 
                 className="w-full h-10 justify-start gap-2 bg-slate-800/50 border-slate-700 px-3 overflow-hidden"
               >
                 <BookOpen className="w-4 h-4 flex-shrink-0" /> 
                 <span className="text-xs font-medium truncate">Story Protocol</span>
               </Button>

               <Button 
                 variant={activeFeature === 'skilltree' ? 'default' : 'outline'} 
                 onClick={() => setActiveFeature('skilltree')} 
                 className="w-full h-10 justify-start gap-2 bg-slate-800/50 border-slate-700 px-3 overflow-hidden"
               >
                 <Zap className="w-4 h-4 flex-shrink-0" /> 
                 <span className="text-xs font-medium truncate">Skill Tree</span>
               </Button>

               <Button 
                 variant={activeFeature === 'loadout' ? 'default' : 'outline'} 
                 onClick={() => setActiveFeature('loadout')} 
                 className="w-full h-10 justify-start gap-2 bg-slate-800/50 border-slate-700 px-3 overflow-hidden"
               >
                 <Sword className="w-4 h-4 flex-shrink-0" /> 
                 <span className="text-xs font-medium truncate">Loadout</span>
               </Button>

               <Button 
                 variant={activeFeature === 'pingames' ? 'default' : 'outline'} 
                 onClick={() => setActiveFeature('pingames')} 
                 className="w-full h-10 justify-start gap-2 bg-slate-800/50 border-slate-700 px-3 overflow-hidden"
               >
                 <Gamepad2 className="w-4 h-4 flex-shrink-0" /> 
                 <span className="text-xs font-medium truncate">Game Link</span>
               </Button>

               <Button 
                 variant={activeFeature === 'fusion' ? 'default' : 'outline'} 
                 onClick={() => setActiveFeature('fusion')} 
                 className="w-full h-10 justify-start gap-2 bg-slate-800/50 border-slate-700 px-3 overflow-hidden col-span-2"
               >
                 <Flame className="w-4 h-4 flex-shrink-0" /> 
                 <span className="text-xs font-medium truncate">Fusion Core</span>
               </Button>
          </div>
        </motion.div>

        {/* RIGHT SECTION: CONTENT WINDOW */}
        <motion.div 
          layout
          className={`col-span-12 ${isMaximized ? 'lg:col-span-12 fixed inset-4 z-50' : 'lg:col-span-8'} relative`}
          style={{ height: isMaximized ? 'auto' : '100%' }}
        >
          <div className="absolute inset-0 overflow-hidden">
             <RightColumnContent />
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}