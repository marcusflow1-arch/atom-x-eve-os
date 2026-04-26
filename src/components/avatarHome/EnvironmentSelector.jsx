import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check, Globe, Loader2, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

export default function EnvironmentSelector({ currentEnvId, onSelect, isEnvironmentActive, onToggleEnvironment }) {
  const { user } = useAuth();
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const sceneLayouts = await base44.entities.SceneLayout.list();

        const mapped = sceneLayouts.map((layout, index) => {
          let thumb = 'https://images.unsplash.com/photo-1515630278258-407f66498911?w=400&q=80';
          if (layout.name === 'Room 2') {
            thumb = 'https://images.unsplash.com/photo-1555679427-1f6dfcce943b?w=400&q=80';
          } else {
            const placeholders = [
              'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
              'https://images.unsplash.com/photo-1515630278258-407f66498911?w=400&q=80',
              'https://images.unsplash.com/photo-1599423300746-b62533397364?w=400&q=80',
              'https://images.unsplash.com/photo-1614728853913-1e32005e3072?w=400&q=80',
              'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&q=80'
            ];
            thumb = placeholders[index % placeholders.length];
          }

          return {
            id: layout.id,
            name: layout.name || `Scene ${index + 1}`,
            description: layout.description || 'Custom 3D Environment',
            thumbnail: thumb,
            modelUrl: layout.environment_url,
            layoutData: layout,
            isLocked: false
          };
        });

        let defaultRoomUrl = null;
        try {
          const models = await base44.entities.Model3D.list();
          const fbxs = await base44.entities.ModelFBX.list();
          const allModels = [...(models || []), ...(fbxs || [])];
          const found = allModels.find(m => (m.name || '').toLowerCase().includes('room 1') || (m.name || '').toLowerCase().includes('room1'));
          if (found) defaultRoomUrl = found.file_url;
        } catch (e) {}

        const finalEnvironments = [
          {
            id: 'default_room',
            name: 'Standard Quarters',
            description: 'Default System Environment',
            thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
            modelUrl: defaultRoomUrl || 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/58d1bc849_scene.gltf',
            isLocked: false
          },
          ...mapped
        ];

        setEnvironments(finalEnvironments);
      } catch (e) {
        console.error("EnvironmentSelector init failed", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleSelect = (env) => {
    if (env.isLocked) return;
    onSelect(env);
    setIsOpen(false);
  };

  const activeEnv = environments.find(e => e.id === currentEnvId);

  if (loading) {
    return (
      <div className="w-full h-12 flex items-center justify-center rounded-2xl" style={{
        background: 'rgba(200, 210, 220, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.10)'
      }}>
        <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full relative z-30 pointer-events-auto" ref={dropdownRef}>
      {/* Top Left Toggle */}
      {onToggleEnvironment && (
        <button
          onClick={onToggleEnvironment}
          className={`absolute -top-3 left-2 z-10 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border transition-all ${
            isEnvironmentActive 
              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30' 
              : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
          Luna Dashboard
        </button>
      )}
      
      {/* Trigger Button — clicking the label text opens the full hub overlay */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group mt-2"
        style={{
          background: isOpen ? 'rgba(200, 210, 220, 0.14)' : 'rgba(200, 210, 220, 0.08)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: `1px solid ${isOpen ? 'rgba(255, 255, 255, 0.20)' : 'rgba(255, 255, 255, 0.10)'}`,
          boxShadow: isOpen
            ? '0 4px 20px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.04)'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className="text-[#A0A8B4]"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          </div>
          <div className="flex flex-col text-left">
            <span
              className="text-white text-sm font-bold tracking-wide hover:text-cyan-300 transition-colors cursor-pointer"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
              onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('openEnvironmentHub')); }}
            >
              Environment Hub
            </span>
            <span className="text-white/50 text-[10px]">
              Change your 3D world
            </span>
          </div>
          <span className="text-[10px] text-white/30 font-mono uppercase tracking-wider ml-2">
            {environments.filter(e => !e.isLocked).length}/{environments.length}
          </span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-4 h-4 text-[#A0A8B4]" />
        </motion.div>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden rounded-2xl"
            style={{
              background: 'rgba(180, 190, 200, 0.08)',
              backdropFilter: 'blur(30px) saturate(140%)',
              WebkitBackdropFilter: 'blur(30px) saturate(140%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
            }}
          >
            <div className="p-3 max-h-[320px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {environments.map(env => (
                  <motion.button
                    key={env.id}
                    whileHover={!env.isLocked ? { scale: 1.02 } : {}}
                    whileTap={!env.isLocked ? { scale: 0.98 } : {}}
                    onClick={() => handleSelect(env)}
                    className={`
                      relative w-full aspect-[16/10] rounded-xl overflow-hidden transition-all duration-300 border group text-left
                      ${currentEnvId === env.id
                        ? 'border-white/40 ring-1 ring-white/20'
                        : 'border-white/[0.06] hover:border-white/20'}
                      ${env.isLocked ? 'cursor-not-allowed grayscale opacity-50' : 'cursor-pointer'}
                    `}
                  >
                    {/* Thumbnail */}
                    <img
                      src={env.thumbnail}
                      alt={env.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Lock */}
                    {env.isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                        <Lock className="w-5 h-5 text-white/40" />
                      </div>
                    )}

                    {/* Active Badge */}
                    {currentEnvId === env.id && (
                      <div className="absolute top-1.5 right-1.5 bg-white/90 text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                        <Check className="w-2.5 h-2.5" /> ACTIVE
                      </div>
                    )}

                    {/* Label */}
                    <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 pt-4">
                      <span className={`text-xs font-semibold truncate block ${currentEnvId === env.id ? 'text-white' : 'text-white/80'}`}>
                        {env.name}
                      </span>
                      <span className="text-[9px] text-white/40 truncate block">
                        {env.isLocked ? 'Locked' : env.description}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}