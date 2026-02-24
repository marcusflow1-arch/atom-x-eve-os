import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, Cloud, Zap, Star, Palette, Sliders } from 'lucide-react';

const SKYBOX_GALLERY = [
  { id: 'dawn', label: 'Dawn', thumbnail: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=200', background: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1920' },
  { id: 'dusk', label: 'Dusk', thumbnail: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=200', background: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=1920' },
  { id: 'night', label: 'Night', thumbnail: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=200', background: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920' },
  { id: 'storm', label: 'Storm', thumbnail: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=200', background: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=1920' },
  { id: 'nebula', label: 'Nebula', thumbnail: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=200', background: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920' },
  { id: 'cyber', label: 'Cyberpunk', thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200', background: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920' },
];

export default function SkyboxMemoriesDropdown({ onBackgroundChange, references = [], activeReferenceId, onSelectReference }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');
  const [brightness, setBrightness] = useState(40);
  const [blur, setBlur] = useState(0);
  const [activeSkybox, setActiveSkybox] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelectSkybox = (skybox) => {
    setActiveSkybox(skybox.id);
    onBackgroundChange?.(skybox.background);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Clickable "Memories" label with underline */}
      <button
        onClick={() => setOpen(v => !v)}
        className="text-white/40 text-[8px] uppercase tracking-wider hover:text-white/70 transition-colors border-b border-white/20 hover:border-white/50 pb-0.5"
      >
        Memories
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 w-72 rounded-2xl overflow-hidden z-[200]"
            style={{
              background: 'rgba(10, 14, 22, 0.97)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/[0.06]">
              <span className="text-white/80 text-xs font-bold tracking-wide">Skybox Settings</span>
              <button onClick={() => setOpen(false)} className="w-5 h-5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center">
                <X className="w-3 h-3 text-white/40" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-3 pt-2">
              {[
                { id: 'gallery', label: 'Gallery' },
                { id: 'skyboxes', label: 'Skyboxes' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white border border-white/15'
                      : 'text-white/35 hover:text-white/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-3">
              {activeTab === 'gallery' && (
                <div>
                  <p className="text-white/30 text-[9px] mb-2 uppercase tracking-wider">Game Memories</p>
                  <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    {references.length > 0 ? references.map(ref => (
                      <button
                        key={ref.id}
                        onClick={() => { onSelectReference?.(ref); setOpen(false); }}
                        className={`relative aspect-square rounded-lg overflow-hidden border transition-all ${
                          activeReferenceId === ref.id ? 'border-cyan-400/60' : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <img src={ref.thumbnail} alt={ref.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <p className="absolute bottom-1 left-1 right-1 text-[8px] text-white font-bold truncate">{ref.title}</p>
                      </button>
                    )) : (
                      <div className="col-span-3 py-6 text-center text-white/20 text-[10px]">No memories yet</div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'skyboxes' && (
                <div className="space-y-3">
                  {/* Skybox Grid */}
                  <div>
                    <p className="text-white/30 text-[9px] mb-2 uppercase tracking-wider">Skybox Presets</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {SKYBOX_GALLERY.map(sky => (
                        <button
                          key={sky.id}
                          onClick={() => handleSelectSkybox(sky)}
                          className={`relative aspect-square rounded-lg overflow-hidden border transition-all ${
                            activeSkybox === sky.id ? 'border-cyan-400/60 ring-1 ring-cyan-400/30' : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <img src={sky.thumbnail} alt={sky.label} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                          <p className="absolute bottom-1 left-1 right-1 text-[8px] text-white font-bold truncate">{sky.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="border-t border-white/[0.06] pt-2 space-y-2">
                    <p className="text-white/30 text-[9px] uppercase tracking-wider flex items-center gap-1">
                      <Sliders className="w-3 h-3" /> Adjustments
                    </p>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-white/40 text-[9px]">Opacity</span>
                          <span className="text-white/40 text-[9px]">{brightness}%</span>
                        </div>
                        <input
                          type="range" min={0} max={100} value={brightness}
                          onChange={e => setBrightness(Number(e.target.value))}
                          className="w-full h-1 accent-cyan-400 bg-white/10 rounded-full appearance-none cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-white/40 text-[9px]">Blur</span>
                          <span className="text-white/40 text-[9px]">{blur}px</span>
                        </div>
                        <input
                          type="range" min={0} max={20} value={blur}
                          onChange={e => setBlur(Number(e.target.value))}
                          className="w-full h-1 accent-cyan-400 bg-white/10 rounded-full appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}