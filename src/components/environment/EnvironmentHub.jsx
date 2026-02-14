import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, X, Map, Gift, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import HubProgressionHeader from './HubProgressionHeader';
import EnvironmentInstanceCard from './EnvironmentInstanceCard';
import EnvironmentDetailPanel from './EnvironmentDetailPanel';
import FeatureUnlockGrid from './FeatureUnlockGrid';
import EnvironmentSelector from '@/components/avatarHome/EnvironmentSelector';

export default function EnvironmentHub({ currentEnvId, onSelectEnv, onClose }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('environments');
  const [selectedEnv, setSelectedEnv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hubProgression, setHubProgression] = useState(null);
  const [environments, setEnvironments] = useState([]);

  const [roomModels, setRoomModels] = useState([]);

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

        // Fetch Model3D records whose name contains "room"
        const allModels = await base44.entities.Model3D.list();
        const rooms = allModels.filter(m => m.name && m.name.toLowerCase().includes('room'));
        setRoomModels(rooms);
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

  const tabs = [
    { id: 'environments', label: 'Environments', icon: Map },
    { id: 'features', label: 'Features', icon: Gift },
    { id: 'selector', label: '3D Viewer', icon: Globe },
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
    <div className="flex flex-col h-full max-h-[80vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 mb-4 border-b border-white/[0.06]">
        <HubProgressionHeader hubProgression={hubProgression} environmentCount={environments.length} />
        <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center flex-shrink-0 ml-3 transition-colors">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'environments' && (
            <motion.div key="envs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {environments.length === 0 ? (
                <div className="text-center py-16">
                  <Globe className="w-10 h-10 mx-auto mb-3 text-white/10" />
                  <p className="text-white/30 text-sm font-medium">No environments yet</p>
                  <p className="text-white/15 text-xs mt-1">Earn achievements or use the 3D Viewer to get started.</p>
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
            </motion.div>
          )}

          {activeTab === 'features' && (
            <motion.div key="feats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-white/30 text-xs mb-4">
                Features unlock globally at each Hub Level and become available across all environments.
              </p>
              <FeatureUnlockGrid
                globalHubLevel={globalLevel}
                onFeatureClick={(f) => console.log('Open feature:', f.name)}
              />
            </motion.div>
          )}

          {activeTab === 'selector' && (
            <motion.div key="sel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EnvironmentSelector
                currentEnvId={currentEnvId}
                onSelect={(env) => onSelectEnv?.(env)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}