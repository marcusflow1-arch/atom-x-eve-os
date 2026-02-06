import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, Map, Globe, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

// Hardcoded list of environment metadata
// In a production app, these would likely be entities linked to achievements
const AVAILABLE_ENVIRONMENTS = [
  {
    id: 'default_room',
    name: 'Standard Quarters',
    description: 'Standard issue living quarters.',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
    modelQuery: ['room 1', 'room1'], // Keywords to search in Model3D/ModelFBX
    isDefault: true
  },
  {
    id: 'cyber_loft',
    name: 'Cyber Loft',
    description: 'High-tech apartment with neon accents.',
    thumbnail: 'https://images.unsplash.com/photo-1515630278258-407f66498911?w=400&q=80',
    modelQuery: ['room 2', 'room2'],
    achievementReq: 'Cyber Overlord',
    isDefault: false
  },
  {
    id: 'zen_garden',
    name: 'Zen Sanctuary',
    description: 'A peaceful retreat for meditation.',
    thumbnail: 'https://images.unsplash.com/photo-1599423300746-b62533397364?w=400&q=80',
    modelQuery: ['zen', 'garden'],
    achievementReq: 'Inner Peace',
    isDefault: false
  },
  {
    id: 'mars_outpost',
    name: 'Mars Outpost',
    description: 'Off-world habitat.',
    thumbnail: 'https://images.unsplash.com/photo-1614728853913-1e32005e3072?w=400&q=80',
    modelQuery: ['mars', 'outpost'],
    achievementReq: 'Red Planet Explorer',
    isDefault: false
  }
];

export default function EnvironmentSelector({ currentEnvId, onSelect }) {
  const { user } = useAuth();
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // 1. Fetch real models to resolve URLs
        const models = await base44.entities.Model3D.list();
        const fbxs = await base44.entities.ModelFBX.list();
        const allModels = [...(models || []), ...(fbxs || [])];

        // 2. Fetch User Achievements (for unlock logic)
        let unlockedKeys = new Set(['default_room']);
        
        if (user) {
          // For demo purposes, we will unlock 'Cyber Loft' if ANY achievement exists, 
          // or if the user has specific achievements.
          // Real implementation: check UserAchievement where achievement_id matches req.
          // Since we don't have a strict map of achievement IDs yet, we'll simulate.
          const ua = await base44.entities.UserAchievement.filter({ user_id: user.id });
          if (ua && ua.length > 0) {
             unlockedKeys.add('cyber_loft');
          }
          // Uncomment to test all unlocked
          // unlockedKeys.add('zen_garden'); 
          // unlockedKeys.add('mars_outpost');
        }

        // 3. Map available environments to real models
        const mapped = AVAILABLE_ENVIRONMENTS.map(env => {
          // Find a matching model
          const foundModel = allModels.find(m => 
            env.modelQuery.some(q => (m.name || '').toLowerCase().includes(q))
          );
          
          return {
            ...env,
            modelUrl: foundModel?.file_url || null, // Will be null if not found in DB
            isLocked: !env.isDefault && !unlockedKeys.has(env.id)
          };
        });

        // Filter out environments that don't have a model in the DB (to avoid broken 3D view),
        // unless it's the default one (which might have a hardcoded fallback in LunaTemplate).
        // Actually, let's keep them but maybe disable selection if modelUrl is missing?
        // For 'default_room', LunaTemplate has a hardcoded fallback URL, so it's fine.
        
        setEnvironments(mapped);
      } catch (e) {
        console.error("EnvironmentSelector init failed", e);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user]);

  const handleSelect = (env) => {
    if (env.isLocked) return;
    onSelect(env);
  };

  if (loading) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10">
        <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full mb-6 relative z-30 pointer-events-auto">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-bold text-lg text-shadow-sm">3D Environments</h3>
        </div>
        <span className="text-xs text-white/40 font-mono uppercase tracking-wider">
          {environments.filter(e => !e.isLocked).length} / {environments.length} Unlocked
        </span>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {environments.map(env => (
          <motion.div
            key={env.id}
            whileHover={!env.isLocked ? { scale: 1.02, y: -2 } : {}}
            whileTap={!env.isLocked ? { scale: 0.98 } : {}}
            onClick={() => handleSelect(env)}
            className={`
              relative flex-shrink-0 w-64 aspect-[16/9] rounded-xl overflow-hidden transition-all duration-300 border group
              ${currentEnvId === env.id 
                ? 'border-cyan-400 ring-2 ring-cyan-400/30' 
                : 'border-white/10 hover:border-white/30'}
              ${env.isLocked ? 'cursor-not-allowed grayscale opacity-60' : 'cursor-pointer'}
            `}
          >
            {/* Background Image */}
            <img 
              src={env.thumbnail} 
              alt={env.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            {/* Lock Overlay */}
            {env.isLocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-black/60 p-3 rounded-full border border-white/10">
                  <Lock className="w-6 h-6 text-white/50" />
                </div>
              </div>
            )}

            {/* Selected Indicator */}
            {currentEnvId === env.id && (
              <div className="absolute top-2 right-2 bg-cyan-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-cyan-500/20">
                <Check className="w-3 h-3" /> ACTIVE
              </div>
            )}

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className={`font-bold truncate pr-2 ${currentEnvId === env.id ? 'text-cyan-400' : 'text-white'}`}>
                  {env.name}
                </span>
              </div>
              
              <p className="text-[10px] text-white/60 line-clamp-1">
                {env.isLocked ? `Unlock via ${env.achievementReq}` : env.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}