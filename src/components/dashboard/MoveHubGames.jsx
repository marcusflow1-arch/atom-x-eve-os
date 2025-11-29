import React from 'react';

export const moveHubGamesData = [
{
  id: 1,
  title: 'Star Wars Knights of the Old Republic',
  genre: 'RPG',
  isFavorite: true,
  lastPlayed: '2023-11-25',
  image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=80&h=80&fit=crop',
  achievements: [
  { id: 1, name: 'Jedi Master', icon: '⚔️', description: 'Complete the Jedi training' },
  { id: 2, name: 'Sith Lord', icon: '🔴', description: 'Embrace the dark side' },
  { id: 3, name: 'Republic Hero', icon: '🌟', description: 'Save the Republic' },
  { id: 4, name: 'Force Sensitive', icon: '✨', description: 'Master all Force powers' }]

},
{
  id: 2,
  title: 'Legend of Kain Blood Omen',
  genre: 'Adventure',
  isFavorite: false,
  lastPlayed: '2023-10-10',
  image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=80&h=80&fit=crop',
  achievements: [
  { id: 1, name: 'Vampire Lord', icon: '🦇', description: 'Become the ultimate vampire' },
  { id: 2, name: 'Blood Feast', icon: '🩸', description: 'Drain 100 enemies' },
  { id: 3, name: 'Soul Reaver', icon: '⚔️', description: 'Obtain the Soul Reaver' },
  { id: 4, name: 'Ancient Power', icon: '💀', description: 'Unlock ancient abilities' }]

},
{
  id: 3,
  title: 'Star Wars Jedi Knight Outcast',
  genre: 'Action',
  isFavorite: true,
  lastPlayed: '2023-11-28',
  image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=80&h=80&fit=crop',
  achievements: [
  { id: 1, name: 'Lightsaber Master', icon: '🗡️', description: 'Master all lightsaber forms' },
  { id: 2, name: 'Force Push', icon: '👋', description: 'Push 50 enemies off ledges' },
  { id: 3, name: 'Jedi Knight', icon: '⭐', description: 'Complete the story' },
  { id: 4, name: 'Dark Forces', icon: '🌑', description: 'Defeat the dark Jedi' }]

},
{
  id: 4,
  title: 'Star Wars Jedi Academy',
  genre: 'Action',
  isFavorite: false,
  lastPlayed: '2023-09-15',
  image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=80&h=80&fit=crop',
  achievements: [
  { id: 1, name: 'Academy Graduate', icon: '🎓', description: 'Complete Jedi training' },
  { id: 2, name: 'Dual Wielder', icon: '⚔️⚔️', description: 'Master dual lightsabers' },
  { id: 3, name: 'Saber Staff', icon: '🔱', description: 'Master the double-bladed saber' },
  { id: 4, name: 'Chosen Path', icon: '🛤️', description: 'Choose your destiny' }]

},
{
  id: 5,
  title: 'Fallout 4',
  genre: 'RPG',
  isFavorite: true,
  lastPlayed: '2023-11-20',
  image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=80&h=80&fit=crop',
  achievements: [
  { id: 1, name: 'Vault Dweller', icon: '🏠', description: 'Leave Vault 111' },
  { id: 2, name: 'Wasteland Wanderer', icon: '🌍', description: 'Discover 50 locations' },
  { id: 3, name: 'Power Armor', icon: '🤖', description: 'Acquire power armor' },
  { id: 4, name: 'Brotherhood', icon: '⚙️', description: 'Join the Brotherhood of Steel' }]

},
{
  id: 6,
  title: 'Quake',
  genre: 'FPS',
  isFavorite: false,
  lastPlayed: '2023-08-01',
  image: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=80&h=80&fit=crop',
  achievements: [
  { id: 1, name: 'Rocket Master', icon: '🚀', description: 'Get 100 rocket kills' },
  { id: 2, name: 'Quad Damage', icon: '💥', description: 'Activate Quad Damage 10 times' },
  { id: 3, name: 'Speedrunner', icon: '⚡', description: 'Complete a level in under 2 minutes' },
  { id: 4, name: 'Arena Master', icon: '🏆', description: 'Win 25 multiplayer matches' }]

},
{
  id: 7,
  title: 'Elder Scrolls',
  genre: 'RPG',
  isFavorite: true,
  lastPlayed: '2023-11-10',
  image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=80&h=80&fit=crop',
  achievements: [
  { id: 1, name: 'Dragonborn', icon: '🐉', description: 'Discover your true nature' },
  { id: 2, name: 'Thane', icon: '👑', description: 'Become Thane of a hold' },
  { id: 3, name: 'Master Wizard', icon: '🔮', description: 'Master all schools of magic' },
  { id: 4, name: 'Legendary', icon: '⭐', description: 'Reach level 50' }]

},
{
  id: 8,
  title: 'Star Wars Force Unleashed',
  genre: 'Action',
  isFavorite: false,
  lastPlayed: '2023-10-01',
  image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=80&h=80&fit=crop',
  achievements: [
  { id: 1, name: 'Sith Apprentice', icon: '🔴', description: 'Complete your training' },
  { id: 2, name: 'Force Lightning', icon: '⚡', description: 'Master Force Lightning' },
  { id: 3, name: 'Star Destroyer', icon: '🚀', description: 'Pull down a Star Destroyer' },
  { id: 4, name: 'Unleashed', icon: '💫', description: 'Unleash your full power' }]

}];


import { motion } from 'framer-motion';
import { Zap, Lock, CheckCircle2, Star } from 'lucide-react';

const AbilityNode = ({ x, y, icon: Icon, status = 'locked', label, delay = 0 }) => {
  const colors = {
    locked: 'border-slate-700 bg-slate-900/50 text-slate-600',
    unlocked: 'border-cyan-500/50 bg-cyan-950/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    mastered: 'border-yellow-500/50 bg-yellow-950/30 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 20 }}
      className="absolute flex flex-col items-center gap-2 transform -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, top: y }}
    >
      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center backdrop-blur-sm transition-all duration-300 hover:scale-110 cursor-pointer z-10 ${colors[status]}`}>
        <Icon size={20} />
      </div>
      {label && (
        <div className="bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-slate-300 whitespace-nowrap backdrop-blur-md border border-white/5">
          {label}
        </div>
      )}
    </motion.div>
  );
};

const ConnectionLine = ({ start, end, active = false, delay = 0 }) => {
  // Calculate path
  const midY = start.y + (end.y - start.y) / 2;
  const path = `M ${start.x} ${start.y} C ${start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <motion.path
        d={path}
        fill="none"
        stroke={active ? "url(#gradient-active)" : "#334155"}
        strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay, duration: 1, ease: "easeInOut" }}
      />
      <defs>
        <linearGradient id="gradient-active" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const AbilityTree = ({ achievement }) => {
  // Mock tree data structure relative to 100% width/height
  const nodes = [
    { id: 'root', x: '50%', y: '85%', icon: Star, status: 'mastered', label: 'Core' },
    
    { id: 'l1', x: '30%', y: '60%', icon: Zap, status: 'unlocked', label: 'Power' },
    { id: 'r1', x: '70%', y: '60%', icon: Lock, status: 'locked', label: 'Control' },
    
    { id: 'l2', x: '20%', y: '35%', icon: CheckCircle2, status: 'unlocked', label: 'Efficiency' },
    { id: 'l3', x: '40%', y: '35%', icon: Lock, status: 'locked', label: 'Overload' },
    
    { id: 'r2', x: '60%', y: '35%', icon: Lock, status: 'locked', label: 'Duration' },
    { id: 'r3', x: '80%', y: '35%', icon: Lock, status: 'locked', label: 'Range' },

    { id: 'top', x: '50%', y: '15%', icon: Trophy, status: 'locked', label: 'Mastery' },
  ];

  const connections = [
    { start: 'root', end: 'l1', active: true },
    { start: 'root', end: 'r1', active: false },
    { start: 'l1', end: 'l2', active: true },
    { start: 'l1', end: 'l3', active: false },
    { start: 'r1', end: 'r2', active: false },
    { start: 'r1', end: 'r3', active: false },
    { start: 'l2', end: 'top', active: false },
    { start: 'l3', end: 'top', active: false },
    { start: 'r2', end: 'top', active: false },
    { start: 'r3', end: 'top', active: false },
  ];

  // Helper to get coordinates from percentage string
  const getCoords = (node) => {
    const containerW = 600; // approximate logical width
    const containerH = 500; // approximate logical height
    return {
      x: parseFloat(node.x) / 100 * containerW,
      y: parseFloat(node.y) / 100 * containerH
    };
  };

  return (
    <div className="flex h-full w-full bg-slate-950/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5" />
      
      {/* Main Tree Area */}
      <div className="flex-1 relative flex items-center justify-center p-8">
        <div className="relative w-[600px] h-[500px]">
          {/* Connections Layer */}
          <div className="absolute inset-0 z-0">
            {connections.map((conn, idx) => {
              const startNode = nodes.find(n => n.id === conn.start);
              const endNode = nodes.find(n => n.id === conn.end);
              return (
                <ConnectionLine 
                  key={idx} 
                  start={getCoords(startNode)} 
                  end={getCoords(endNode)} 
                  active={conn.active}
                  delay={idx * 0.1} 
                />
              );
            })}
          </div>

          {/* Nodes Layer */}
          {nodes.map((node, idx) => (
            <AbilityNode 
              key={node.id} 
              {...node} 
              delay={0.5 + (idx * 0.1)} 
            />
          ))}
        </div>
      </div>

      {/* Side Info Panel */}
      <div className="w-80 h-full border-l border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 flex flex-col">
        <div className="mb-6">
          <div className="text-4xl mb-4 animate-bounce">{achievement.icon}</div>
          <h3 className="text-2xl font-bold text-white mb-2">{achievement.name}</h3>
          <p className="text-slate-400 leading-relaxed">{achievement.description}</p>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Stats Impact</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Power Level</span>
              <span className="text-white font-mono">+150</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Skill Points</span>
              <span className="text-white font-mono">3/8</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div className="bg-cyan-500 h-full w-[37%]" />
            </div>
          </div>
        </div>

        <div className="mt-auto">
           <button className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-cyan-500/20">
             Upgrade Skill
           </button>
        </div>
      </div>
    </div>
  );
};

export default function MoveHubTab({ filter = { mode: 'all' } }) {
  const [selectedGame, setSelectedGame] = React.useState(null);
  const [selectedAchievement, setSelectedAchievement] = React.useState(null);

  const filteredGames = React.useMemo(() => {
    let games = [...moveHubGamesData];
    
    if (filter.mode === 'favorites') {
      games = games.filter(g => g.isFavorite);
    } else if (filter.mode === 'recent') {
      games.sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed));
    } else if (filter.mode === 'genre' && filter.value) {
      games = games.filter(g => g.genre === filter.value);
    }
    
    return games;
  }, [filter]);

  const handleGameClick = (game) => {
    setSelectedGame(game);
    setSelectedAchievement(null);
  };

  const handleAchievementClick = (achievement) => {
    setSelectedAchievement(achievement);
  };

  const handleCloseOverlay = () => {
    setSelectedGame(null);
    setSelectedAchievement(null);
  };

  const handleBackToGame = () => {
    setSelectedAchievement(null);
  };

  return (
    <div className="h-full w-full flex">
      <div className="w-[20%] h-full bg-slate-800/20 relative overflow-hidden">
        <div className="h-full overflow-y-auto">
          {filteredGames.map((game) =>
          <div
            key={game.id}
            onClick={() => handleGameClick(game)}
            className="flex items-center gap-3 p-3 cursor-pointer">

              <img
              src={game.image}
              alt={game.title}
              className="w-12 h-12 rounded object-cover flex-shrink-0" />

              <span className="text-slate-300 text-sm hover:text-blue-400 transition-colors">
                {game.title}
              </span>
            </div>
          )}
        </div>

        {selectedGame &&
        <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-10 flex flex-col">
            <div className="p-4 border-b border-slate-700">
              <button
              onClick={handleCloseOverlay}
              className="text-slate-400 hover:text-white mb-2">

                ← Back
              </button>
              <h3 className="text-white font-bold text-lg">{selectedGame.title}</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <h4 className="text-blue-400 font-semibold mb-3 text-sm">Achievements & Abilities</h4>
              <div className="space-y-3">
                {selectedGame.achievements.map((achievement) =>
              <div
                key={achievement.id}
                onClick={() => handleAchievementClick(achievement)}
                className={`bg-slate-800/50 rounded-lg p-3 border transition-colors cursor-pointer ${
                selectedAchievement?.id === achievement.id ?
                'border-blue-500 bg-blue-500/10' :
                'border-slate-700/50 hover:border-blue-500/50'}`
                }>

                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{achievement.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-white font-semibold text-sm mb-1">
                          {achievement.name}
                        </h5>
                        <p className="text-slate-400 text-xs">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  </div>
              )}
              </div>
            </div>
          </div>
        }
      </div>
      
      <div className="w-[1px] h-full bg-slate-600"></div>
      
      <div className="flex-1 h-full bg-slate-800/10">
        {selectedAchievement ?
        <>
            <div className="p-4 border-b border-slate-700">
              <button
              onClick={handleBackToGame}
              className="text-slate-400 hover:text-white text-sm">

                ← Back to Achievements
              </button>
            </div>
            <AbilityTree achievement={selectedAchievement} />
          </> :

        <div className="flex items-center justify-center h-full text-slate-500">
            <p className="text-center">
              {selectedGame ?
            'Select an achievement to view its ability tree' :
            'Select a game and achievement to view ability tree'
            }
            </p>
          </div>
        }
      </div>
    </div>);

}