import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, X, Map, Gift, Loader2, Bot, CloudSun } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import HubProgressionHeader from './HubProgressionHeader';
import EnvironmentInstanceCard from './EnvironmentInstanceCard';
import EnvironmentDetailPanel from './EnvironmentDetailPanel';
import FeatureUnlockGrid from './FeatureUnlockGrid';
import EnvironmentSelector from '@/components/avatarHome/EnvironmentSelector';
import CompanionsGrid from './CompanionsGrid';

export default function EnvironmentHub({ currentEnvId, onSelectEnv, onClose, expanded, onToggleExpand }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('environments');
  const [selectedEnv, setSelectedEnv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hubProgression, setHubProgression] = useState(null);
  const [environments, setEnvironments] = useState([]);

  const [roomModels, setRoomModels] = useState([]);
  const [skyboxModels, setSkyboxModels] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let hubList = [];
        if (user?.id) {
          hubList = await base44.entities.HubProgression.filter({ user_id: user.id });
        }
        setHubProgression(hubList[0] || { global_hub_level: 1, global_hub_xp: 0, unlocked_features: [], mastery_badges: [] });

        let envList = [];
        if (user?.id) {
          envList = await base44.entities.EnvironmentInstance.filter({ owner_id: user.id });
        }
        setEnvironments(envList);

        // Fetch Model3D records whose name contains "room" or "skybox"
        const allModels = await base44.entities.Model3D.list();
        const rooms = allModels.filter(m => m.name && m.name.toLowerCase().includes('room'));
        setRoomModels(rooms);
        
        const skyboxes = allModels.filter(m => m.name && m.name.toLowerCase().includes('skybox'));
        setSkyboxModels(skyboxes);
      } catch (e) {
        console.error('EnvironmentHub fetch error:', e);
        setHubProgression({ global_hub_level: 1, global_hub_xp: 0, unlocked_features: [], mastery_badges: [] });
        setEnvironments([]);
        setRoomModels([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const globalLevel = hubProgression?.global_hub_level || 1;

  const SKYBOXES = [
    { id: 'sky_1', title: 'Neon City Night', thumbnail: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400', background: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920' },
    { id: 'sky_2', title: 'Deep Space', thumbnail: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400', background: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920' },
    { id: 'sky_3', title: 'Alien Jungle', thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400', background: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920' },
    { id: 'sky_4', title: 'Volcanic World', thumbnail: 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=400', background: 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=1920' },
    { id: 'sky_5', title: 'Arctic Tundra', thumbnail: 'https://images.unsplash.com/photo-1517783999520-f068d7431a60?w=400', background: 'https://images.unsplash.com/photo-1517783999520-f068d7431a60?w=1920' },
    { id: 'sky_6', title: 'Desert Ruins', thumbnail: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400', background: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920' },
  ];

  const [activeSkybox, setActiveSkybox] = useState(null);

  const tabs = [
    { id: 'environments', label: 'Environments', abbr: 'Env', icon: Map },
    { id: 'skyboxes', label: 'Skyboxes', abbr: 'S-Box', icon: CloudSun },
    { id: 'features', label: 'Features', abbr: 'Features', icon: Gift },
    { id: 'companions', label: 'Companions', abbr: 'Companions', icon: Bot },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-6 h-6 text-cyan-400/50 animate-spin mx-auto mb-2" />
          <p className="text-[10px] text-white/20">Loading hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      {/* Hub Progression Info */}
       {hubProgression && <HubProgressionHeader hubProgression={hubProgression} />}

       {/* Header with Current Section */}
       <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
         <button 
           onClick={onToggleExpand}
           className="flex items-center gap-2 hover:opacity-70 transition-opacity cursor-pointer"
         >
           <div className="text-sm text-white/60 font-light">{expanded ? 'Collapse' : 'Full'}</div>
           <div className="text-lg font-bold text-white">{tabs.find(t => t.id === activeTab)?.abbr}</div>
         </button>
         <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-colors">
           <X className="w-3.5 h-3.5 text-white/50" />
         </button>
       </div>

       {/* Tabs */}
      <div className="flex items-center gap-0.5 mb-4 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.05] w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedEnv(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                isActive
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Box - Single persistent box with changing content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4">
            {activeTab === 'environments' && (
              <>
                {/* 3D Room Environments from Admin */}
                {roomModels.length > 0 ? (
                  <div className={`grid gap-2 ${expanded ? 'grid-cols-6 lg:grid-cols-8' : 'grid-cols-4'}`}>
                    {roomModels.map(model => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedEnv(model);
                          onSelectEnv?.({
                            id: model.id,
                            name: model.name,
                            modelUrl: model.file_url,
                            thumbnail: model.thumbnail_url,
                            description: model.description,
                            playerSpawn: model.player_spawn || { x: 0, y: -0.5, z: 0 },
                            useMeshCollision: model.use_mesh_collision || false,
                          });
                        }}
                        className={`relative group rounded-lg overflow-hidden border transition-all text-left ${
                          selectedEnv?.id === model.id
                            ? 'border-cyan-400/40 bg-white/10 ring-1 ring-cyan-400/20'
                            : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        <div className="aspect-video w-full bg-black/30 overflow-hidden">
                          {model.thumbnail_url ? (
                            <img src={model.thumbnail_url} alt={model.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Globe className="w-5 h-5 text-white/10" />
                            </div>
                          )}
                        </div>
                        <div className="p-1.5">
                          <h4 className="text-[10px] font-bold text-white truncate">{model.name}</h4>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[8px] px-1 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 font-semibold">3D</span>
                            {model.file_type && (
                              <span className="text-[8px] px-1 py-0.5 rounded bg-white/5 text-white/30 border border-white/10 uppercase font-mono">{model.file_type}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : environments.length === 0 ? (
                  <div className="text-center py-16">
                    <Globe className="w-10 h-10 mx-auto mb-3 text-white/10" />
                    <p className="text-white/30 text-sm font-medium">No environments yet</p>
                    <p className="text-white/15 text-xs mt-1">Add 3D models with "Room" in their name from the Admin page.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2.5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                      {environments.map(env => (
                        <EnvironmentInstanceCard
                          key={env.id}
                          env={env}
                          isActive={env.is_active || env.id === currentEnvId}
                          isSelected={selectedEnv?.id === env.id}
                          onClick={(e) => setSelectedEnv(selectedEnv?.id === e.id ? null : e)}
                        />
                      ))}
                    </div>

                    <AnimatePresence>
                      {selectedEnv && (
                        <EnvironmentDetailPanel
                          env={selectedEnv}
                          globalHubLevel={globalLevel}
                          onClose={() => setSelectedEnv(null)}
                        />
                      )}
                    </AnimatePresence>
                  </>
                )}
              </>
            )}

            {activeTab === 'skyboxes' && (
              <>
                <p className="text-white/30 text-xs mb-4">Select a skybox to set as your dashboard background.</p>
                <div className={`grid gap-2 ${expanded ? 'grid-cols-4 lg:grid-cols-6' : 'grid-cols-2'}`}>
                  {/* Dynamic Skyboxes */}
                  {skyboxModels.map(sky => (
                    <button
                      key={sky.id}
                      onClick={() => { setActiveSkybox(sky.id); onSelectEnv?.({ id: sky.id, name: sky.name, background: sky.file_url, isSkybox: true }); }}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                        activeSkybox === sky.id ? 'border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      {sky.thumbnail_url ? (
                        <img src={sky.thumbnail_url} alt={sky.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-black/50 flex items-center justify-center">
                          <CloudSun className="w-6 h-6 text-white/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      {activeSkybox === sky.id && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center">
                          <span className="text-black text-[9px] font-black">✓</span>
                        </div>
                      )}
                      <p className="absolute bottom-1.5 left-2 right-2 text-white text-[9px] font-semibold truncate">{sky.name}</p>
                    </button>
                  ))}
                  
                  {/* Static Skyboxes */}
                  {SKYBOXES.map(sky => (
                    <button
                      key={sky.id}
                      onClick={() => { setActiveSkybox(sky.id); onSelectEnv?.({ id: sky.id, name: sky.title, background: sky.background, isSkybox: true }); }}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                        activeSkybox === sky.id ? 'border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={sky.thumbnail} alt={sky.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      {activeSkybox === sky.id && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center">
                          <span className="text-black text-[9px] font-black">✓</span>
                        </div>
                      )}
                      <p className="absolute bottom-1.5 left-2 right-2 text-white text-[9px] font-semibold truncate">{sky.title}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'features' && (
              <>
                <p className="text-white/30 text-xs mb-4">
                  Features unlock globally at each Hub Level and become available across all environments.
                </p>
                <FeatureUnlockGrid
                  globalHubLevel={globalLevel}
                  onFeatureClick={(f) => console.log('Open feature:', f.name)}
                />
              </>
            )}

            {activeTab === 'companions' && (
              <>
                <CompanionsGrid />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}