import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, Map, Globe, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

export default function EnvironmentSelector({ currentEnvId, onSelect }) {
  const { user } = useAuth();
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch SceneLayouts from Admin Hub
        const sceneLayouts = await base44.entities.SceneLayout.list();
        
        // 2. Fetch User Achievements (for unlock logic placeholder)
        // For now, we'll assume all layouts are unlocked or unlockable via future logic
        // If we want to simulate unlocking, we can check for 'unlocked_scenes' on user or similar.
        
        // 3. Map SceneLayouts to Environment Objects
        const mapped = sceneLayouts.map((layout, index) => {
          // Use a deterministic thumbnail based on index or layout ID
          const placeholders = [
            'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
            'https://images.unsplash.com/photo-1515630278258-407f66498911?w=400&q=80',
            'https://images.unsplash.com/photo-1599423300746-b62533397364?w=400&q=80',
            'https://images.unsplash.com/photo-1614728853913-1e32005e3072?w=400&q=80',
            'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&q=80'
          ];
          
          return {
            id: layout.id,
            name: layout.name || `Scene ${index + 1}`,
            description: layout.description || 'Custom 3D Environment',
            thumbnail: placeholders[index % placeholders.length],
            modelUrl: layout.environment_url,
            // Pass full layout data for LunaTemplate to use
            layoutData: layout,
            isLocked: false // Initially unlock all for demo, or implement logic later
          };
        });

        // Add default/fallback if list is empty
        if (mapped.length === 0) {
           mapped.push({
             id: 'default_room',
             name: 'Standard Quarters',
             description: 'Default System Environment',
             thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
             modelQuery: ['room 1', 'room1'],
             isLocked: false
           });
        }
        
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