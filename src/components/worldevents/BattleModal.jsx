import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sword, Shield, Heart, Zap, Award, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function BattleModal({ event, onClose, onVictory }) {
  const [playerHealth, setPlayerHealth] = useState(100);
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [combatLog, setCombatLog] = useState([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const [showVictory, setShowVictory] = useState(false);

  const addLog = (msg) => setCombatLog(prev => [msg, ...prev].slice(0, 3));

  const handleAttack = () => {
    if (isAttacking || showVictory) return;
    setIsAttacking(true);

    // Player Attack
    const playerDmg = Math.floor(Math.random() * 20) + 10;
    setTimeout(() => {
      setEnemyHealth(prev => Math.max(0, prev - playerDmg));
      addLog(`You dealt ${playerDmg} damage!`);
      
      if (enemyHealth - playerDmg <= 0) {
        setShowVictory(true);
        setTimeout(() => {
            onVictory(event);
        }, 1500);
        return;
      }

      // Enemy Counter Attack
      setTimeout(() => {
        const enemyDmg = Math.floor(Math.random() * 15) + 5;
        setPlayerHealth(prev => Math.max(0, prev - enemyDmg));
        addLog(`${event.name} dealt ${enemyDmg} damage!`);
        setIsAttacking(false);
      }, 800);
    }, 500);
  };

  const handleLoot = () => {
    // Instant loot for chests
    setShowVictory(true);
    setTimeout(() => {
        onVictory(event);
    }, 1500);
  };

  if (event.type === 'Chest') {
      // Auto-open logic visually could be here, but we'll reuse the victory screen for "Looted"
      if (!showVictory) handleLoot();
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        {/* Victory Overlay */}
        {showVictory && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-8 text-center"
            >
                <Award className="w-24 h-24 text-yellow-400 mb-4 animate-bounce" />
                <h2 className="text-3xl font-black text-white mb-2">{event.type === 'Chest' ? 'LOOTED!' : 'VICTORY!'}</h2>
                <p className="text-white/60 mb-6">Rewards acquired</p>
                <div className="flex gap-2">
                    {event.rewards?.map((r, i) => (
                        <span key={i} className="bg-white/10 text-white px-3 py-1 rounded-full text-sm border border-white/20">{r}</span>
                    ))}
                </div>
            </motion.div>
        )}

        {/* Header Image */}
        <div className="h-48 bg-slate-800 relative">
            <img 
                src={event.type === 'Monster' ? "https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?w=800&q=80" : "https://images.unsplash.com/photo-1533158388470-9a56699990c6?w=800&q=80"} 
                className="w-full h-full object-cover opacity-60" 
                alt="Event"
            />
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/40 rounded-full hover:bg-black/60 text-white transition-colors">
                <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 to-transparent">
                <h2 className="text-2xl font-bold text-white">{event.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${event.difficulty === 'Hard' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                        {event.difficulty}
                    </span>
                    <span className="text-white/60 text-xs">Lvl {event.level}</span>
                </div>
            </div>
        </div>

        {/* Combat Area */}
        {event.type === 'Monster' && (
            <div className="p-6 space-y-6">
                {/* Health Bars */}
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-xs text-white/60 mb-1">
                            <span>Enemy</span>
                            <span>{enemyHealth}%</span>
                        </div>
                        <Progress value={enemyHealth} className="h-3 bg-white/10 [&>div]:bg-red-500" />
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-white/60 mb-1">
                            <span>You</span>
                            <span>{playerHealth}%</span>
                        </div>
                        <Progress value={playerHealth} className="h-3 bg-white/10 [&>div]:bg-green-500" />
                    </div>
                </div>

                {/* Combat Log */}
                <div className="h-20 bg-black/40 rounded-xl p-3 text-xs text-white/70 overflow-hidden space-y-1 font-mono">
                    {combatLog.map((log, i) => (
                        <div key={i} className="opacity-80">{log}</div>
                    ))}
                    {combatLog.length === 0 && <span className="opacity-30">Battle started...</span>}
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 gap-3">
                    <Button 
                        onClick={handleAttack} 
                        disabled={isAttacking || showVictory}
                        className="bg-red-600 hover:bg-red-700 text-white h-12 text-lg font-bold"
                    >
                        <Sword className="w-5 h-5 mr-2" /> Attack
                    </Button>
                    <Button 
                        disabled={isAttacking || showVictory}
                        variant="outline" 
                        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 h-12"
                    >
                        <Shield className="w-5 h-5 mr-2" /> Defend
                    </Button>
                </div>
            </div>
        )}

        {event.type === 'Chest' && !showVictory && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
                <Zap className="w-16 h-16 text-yellow-400 mb-4 animate-pulse" />
                <p className="text-white/60 mb-6">Unlocking ancient containment field...</p>
                <div className="w-full max-w-[200px]">
                    <Progress value={100} className="h-2 bg-white/10 [&>div]:bg-yellow-400 [&>div]:animate-pulse" />
                </div>
            </div>
        )}
      </motion.div>
    </div>
  );
}