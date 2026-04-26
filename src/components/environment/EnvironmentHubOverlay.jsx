import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Globe, CloudSun, Gift, Bot, Map, Loader2, Lock, Check,
  Zap, Star, ArrowUp, Sparkles, Users, Package
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

const SKYBOXES = [
  { id: 'sky_1', title: 'Neon City Night', thumbnail: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400', background: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920' },
  { id: 'sky_2', title: 'Deep Space', thumbnail: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400', background: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920' },
  { id: 'sky_3', title: 'Alien Jungle', thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400', background: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920' },
  { id: 'sky_4', title: 'Volcanic World', thumbnail: 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=400', background: 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=1920' },
  { id: 'sky_5', title: 'Arctic Tundra', thumbnail: 'https://images.unsplash.com/photo-1517783999520-f068d7431a60?w=400', background: 'https://images.unsplash.com/photo-1517783999520-f068d7431a60?w=1920' },
  { id: 'sky_6', title: 'Desert Ruins', thumbnail: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400', background: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920' },
];

const UPGRADE_OPTIONS = [
  { id: 'lighting', name: 'Dynamic Lighting', desc: 'Time-of-day lighting cycles', cost: 500, icon: Star, unlocked: true },
  { id: 'weather', name: 'Weather System', desc: 'Rain, snow, fog effects', cost: 1200, icon: CloudSun, unlocked: false },
  { id: 'npc', name: 'NPC Companions', desc: 'Add AI characters to your space', cost: 2000, icon: Users, unlocked: false },
  { id: 'physics', name: 'Enhanced Physics', desc: 'Realistic object interactions', cost: 800, icon: Zap, unlocked: false },
  { id: 'effects', name: 'Particle Effects', desc: 'Magic particles and ambience', cost: 600, icon: Sparkles, unlocked: true },
  { id: 'expansion', name: 'Space Expansion', desc: 'Increase environment size', cost: 3000, icon: ArrowUp, unlocked: false },
];

const TABS = [
  { id: 'environments', label: 'Environments', icon: Map },
  { id: 'skyboxes', label: 'Skyboxes', icon: CloudSun },
  { id: 'upgrades', label: 'Upgrades', icon: Zap },
  { id: 'features', label: 'Features', icon: Gift },
  { id: 'companions', label: 'Companions', icon: Bot },
];

export default function EnvironmentHubOverlay({ currentEnvId, onSelectEnv, onClose }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('environments');
  const [loading, setLoading] = useState(true);
  const [roomModels, setRoomModels] = useState([]);
  const [skyboxModels, setSkyboxModels] = useState([]);
  const [sceneLayouts, setSceneLayouts] = useState([]);
  const [selectedEnv, setSelectedEnv] = useState(null);
  const [activeSkybox, setActiveSkybox] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [allModels, layouts] = await Promise.all([
          base44.entities.Model3D.list(),
          base44.entities.SceneLayout.list(),
        ]);
        setRoomModels(allModels.filter(m => m.name && m.name.toLowerCase().includes('room')));
        setSkyboxModels(allModels.filter(m => m.name && m.name.toLowerCase().includes('skybox')));
        setSceneLayouts(layouts);
      } catch (e) {
        console.error('EnvironmentHubOverlay fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  // Build environment list: SceneLayouts + raw room models
  const environments = [
    {
      id: 'default_room',
      name: 'Standard Quarters',
      description: 'Default System Environment',
      thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
      modelUrl: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/58d1bc849_scene.gltf',
    },
    ...sceneLayouts.map((layout, i) => ({
      id: layout.id,
      name: layout.name || `Scene ${i + 1}`,
      description: layout.description || 'Custom 3D Environment',
      thumbnail: 'https://images.unsplash.com/photo-1515630278258-407f66498911?w=400&q=80',
      modelUrl: layout.environment_url,
      layoutData: layout,
    })),
    ...roomModels.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description || '3D Room Environment',
      thumbnail: m.thumbnail_url || 'https://images.unsplash.com/photo-1599423300746-b62533397364?w=400&q=80',
      modelUrl: m.file_url,
    })),
  ];

  const handleSelectEnv = (env) => {
    setSelectedEnv(env.id);
    onSelectEnv?.({
      id: env.id,
      name: env.name,
      modelUrl: env.modelUrl,
      thumbnail: env.thumbnail,
      layoutData: env.layoutData,
      playerSpawn: { x: 0, y: -0.5, z: 0 },
    });
  };

  const handleSelectSkybox = (sky) => {
    setActiveSkybox(sky.id);
    onSelectEnv?.({ id: sky.id, name: sky.title || sky.name, background: sky.background || sky.file_url, isSkybox: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="absolute inset-0 z-[60] flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(6,10,18,0.98) 0%, rgba(10,16,28,0.97) 50%, rgba(6,10,18,0.98) 100%)',
        backdropFilter: 'blur(40px)',
      }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-8 py-5 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <Globe className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-white font-black text-xl tracking-wide">Environment Hub</h1>
            <p className="text-white/40 text-xs mt-0.5">{environments.length} environments owned</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all text-white/60 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8" style={{ scrollbarWidth: 'none' }}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-cyan-400/50 animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >

              {/* ENVIRONMENTS TAB */}
              {activeTab === 'environments' && (
                <div>
                  <p className="text-white/40 text-sm mb-6">Select an environment to load in your Luna Dashboard. Click to activate.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {environments.map(env => {
                      const isActive = (currentEnvId || selectedEnv) === env.id || selectedEnv === env.id;
                      return (
                        <button
                          key={env.id}
                          onClick={() => handleSelectEnv(env)}
                          className={`group relative rounded-xl overflow-hidden border text-left transition-all duration-300 ${
                            isActive
                              ? 'border-cyan-400/60 ring-2 ring-cyan-400/20 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                              : 'border-white/10 hover:border-white/25 hover:shadow-lg'
                          }`}
                        >
                          <div className="aspect-video w-full bg-black/40 overflow-hidden">
                            <img
                              src={env.thumbnail}
                              alt={env.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                          {isActive && (
                            <div className="absolute top-2 right-2 bg-cyan-400 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> ACTIVE
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 p-2.5">
                            <p className="text-white text-[11px] font-bold truncate">{env.name}</p>
                            <p className="text-white/40 text-[9px] truncate mt-0.5">{env.description}</p>
                          </div>
                        </button>
                      );
                    })}

                    {environments.length === 0 && (
                      <div className="col-span-6 text-center py-20">
                        <Globe className="w-12 h-12 mx-auto mb-4 text-white/10" />
                        <p className="text-white/30 text-sm">No environments found</p>
                        <p className="text-white/15 text-xs mt-1">Add 3D models or Scene Layouts from the Admin page.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SKYBOXES TAB */}
              {activeTab === 'skyboxes' && (
                <div>
                  <p className="text-white/40 text-sm mb-6">Choose a skybox to set as your dashboard background.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {[...skyboxModels.map(s => ({ id: s.id, title: s.name, thumbnail: s.thumbnail_url, background: s.file_url })), ...SKYBOXES].map(sky => (
                      <button
                        key={sky.id}
                        onClick={() => handleSelectSkybox(sky)}
                        className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all group ${
                          activeSkybox === sky.id
                            ? 'border-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.4)]'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        {sky.thumbnail ? (
                          <img src={sky.thumbnail} alt={sky.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-black/50 flex items-center justify-center">
                            <CloudSun className="w-6 h-6 text-white/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        {activeSkybox === sky.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center">
                            <Check className="w-3 h-3 text-black" />
                          </div>
                        )}
                        <p className="absolute bottom-2 left-2 right-2 text-white text-[10px] font-semibold truncate">{sky.title}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* UPGRADES TAB */}
              {activeTab === 'upgrades' && (
                <div>
                  <p className="text-white/40 text-sm mb-6">Upgrade your environments with powerful features and visual enhancements.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {UPGRADE_OPTIONS.map(upgrade => {
                      const Icon = upgrade.icon;
                      return (
                        <div
                          key={upgrade.id}
                          className={`group relative rounded-2xl border p-5 transition-all ${
                            upgrade.unlocked
                              ? 'border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/50'
                              : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              upgrade.unlocked ? 'bg-cyan-500/15 border border-cyan-500/30' : 'bg-white/5 border border-white/10'
                            }`}>
                              <Icon className={`w-6 h-6 ${upgrade.unlocked ? 'text-cyan-400' : 'text-white/30'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-bold text-sm ${upgrade.unlocked ? 'text-white' : 'text-white/60'}`}>{upgrade.name}</h3>
                                {upgrade.unlocked && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[8px] font-black uppercase tracking-wider border border-cyan-500/30">Owned</span>
                                )}
                              </div>
                              <p className="text-white/35 text-xs">{upgrade.desc}</p>
                              {!upgrade.unlocked && (
                                <div className="flex items-center gap-2 mt-3">
                                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold transition-all">
                                    <Package className="w-3 h-3" />
                                    Unlock — {upgrade.cost.toLocaleString()} AGP
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FEATURES TAB */}
              {activeTab === 'features' && (
                <div>
                  <p className="text-white/40 text-sm mb-6">Features unlock globally based on your Hub Level and become available across all environments.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[
                      { name: 'Custom Furniture', desc: 'Place items anywhere', level: 1, icon: Package },
                      { name: 'Music Player', desc: 'Background audio', level: 1, icon: Star },
                      { name: 'Portal Links', desc: 'Jump between envs', level: 3, icon: Globe },
                      { name: 'Social Visitors', desc: 'Friends can visit', level: 5, icon: Users },
                      { name: 'AI Interior Designer', desc: 'AI decorates for you', level: 7, icon: Bot },
                      { name: 'Event Hosting', desc: 'Host clan events here', level: 10, icon: Sparkles },
                    ].map((feature, i) => {
                      const Icon = feature.icon;
                      const unlocked = feature.level <= 1;
                      return (
                        <div key={i} className={`rounded-2xl border p-4 ${unlocked ? 'border-purple-500/25 bg-purple-500/5' : 'border-white/8 bg-white/[0.02]'}`}>
                          <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center border ${unlocked ? 'bg-purple-500/15 border-purple-500/30' : 'bg-white/5 border-white/10'}`}>
                            <Icon className={`w-5 h-5 ${unlocked ? 'text-purple-400' : 'text-white/20'}`} />
                          </div>
                          <h4 className={`font-bold text-sm mb-1 ${unlocked ? 'text-white' : 'text-white/40'}`}>{feature.name}</h4>
                          <p className="text-white/30 text-[10px]">{feature.desc}</p>
                          <div className="flex items-center gap-1 mt-2">
                            {unlocked
                              ? <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Unlocked</span>
                              : <span className="text-[8px] text-white/20 uppercase tracking-widest">Level {feature.level} required</span>
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* COMPANIONS TAB */}
              {activeTab === 'companions' && (
                <div>
                  <p className="text-white/40 text-sm mb-6">Assign companions to inhabit your environments.</p>
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <Bot className="w-14 h-14 text-white/10 mx-auto mb-4" />
                      <p className="text-white/30 text-sm">No companions assigned</p>
                      <p className="text-white/15 text-xs mt-1">Unlock companions through achievements to place them here.</p>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}