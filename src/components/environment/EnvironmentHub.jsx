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

  // Data
  const [hubProgression, setHubProgression] = useState(null);
  const [environments, setEnvironments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch hub progression for current user
        let hubList = [];
        if (user?.id) {
          hubList = await base44.entities.HubProgression.filter({ user_id: user.id });
        }
        const hub = hubList[0] || { global_hub_level: 1, global_hub_xp: 0, unlocked_features: [], mastery_badges: [] };
        setHubProgression(hub);

        // Fetch environment instances for current user
        let envList = [];
        if (user?.id) {
          envList = await base44.entities.EnvironmentInstance.filter({ owner_id: user.id });
        }
        setEnvironments(envList);
      } catch (e) {
        console.error('EnvironmentHub fetch error:', e);
        // Fallback to safe defaults
        setHubProgression({ global_hub_level: 1, global_hub_xp: 0, unlocked_features: [], mastery_badges: [] });
        setEnvironments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const globalLevel = hubProgression?.global_hub_level || 1;

  const tabs = [
    { id: 'environments', label: 'My Environments', icon: Map },
    { id: 'features', label: 'Feature Unlocks', icon: Gift },
    { id: 'selector', label: '3D Viewer', icon: Globe },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[80vh] overflow-hidden">
      {/* Header: Global Hub Progression */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <HubProgressionHeader hubProgression={hubProgression} environmentCount={environments.length} />
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 ml-4">
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedEnv(null); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white border border-white/15'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'environments' && (
            <motion.div key="envs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {environments.length === 0 ? (
                <div className="text-center py-12 text-white/20">
                  <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No environments yet.</p>
                  <p className="text-xs text-white/15 mt-1">Earn achievements or visit the 3D Viewer tab to get started.</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
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

                  {/* Detail panel for selected environment */}
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
              <p className="text-white/40 text-xs mb-4">
                Level up your Global Hub to unlock interactive features inside all environments.
                Legendary and Mythical environments have additional per-rank unlocks.
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