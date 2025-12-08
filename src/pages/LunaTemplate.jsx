import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, X, ArrowLeft } from 'lucide-react';
import InventoryPanel from '../components/profile/InventoryPanel';
import LunaStatsPanel from '../components/profile/LunaStatsPanel';
import LunaCardScroll from '../components/profile/LunaCardScroll';
import { inventoryData, profileData } from '../components/profile/mockData';
import { DragDropContext } from '@hello-pangea/dnd';
import { useDashboardMode } from '../components/dashboard/DashboardModeContext';
import UserInterfaceView from '../components/dashboard/views/UserInterfaceView';

export default function LunaTemplate() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const { mode } = useDashboardMode();

  const handleBoxClick = () => {
    setShowInventory(true);
  };

  return (
    <div 
      className="min-h-screen text-white overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 25%, #3d4a5c 50%, #2d3548 75%, #1a1f2e 100%)' }}
    >
      {mode === 'user' ? (
        <div className="h-screen w-full pt-24 px-8 pb-8">
           <UserInterfaceView />
        </div>
      ) : (
        <DragDropContext onDragEnd={() => {}}>
          <div className="p-8 h-full">
            {/* Circle Icon Button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="fixed top-24 left-8 z-40 w-11 h-11 rounded-full bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.1] flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10"
          style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
        >
          <Circle className="w-5 h-5 text-white/80" />
        </button>

        {/* Back to Loadout X Button (Only visible when Inventory is open) */}
        <AnimatePresence>
          {showInventory && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setShowInventory(false)}
              className="fixed top-40 left-8 z-40 w-11 h-11 rounded-full bg-white/[0.05] backdrop-blur-2xl hover:bg-white/[0.1] flex items-center justify-center transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/10"
              style={{ WebkitBackdropFilter: 'blur(40px) saturate(200%)' }}
            >
              <X className="w-5 h-5 text-white/80" />
              </motion.button>
              )}
              </AnimatePresence> */
              }

              {/* Main Content Area */}
              <div className="w-full mt-24 px-12 relative">
              <AnimatePresence mode="wait">
                {!showInventory ? (
                  <motion.div 
                    key="boxes"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-between gap-12"
                  >
                    <div className="flex flex-col items-start gap-12">
                      {/* Weapons Section */}
                      <div className="flex flex-col items-start">
                        <h2 className="text-xs font-bold tracking-[0.3em] uppercase mb-6 text-white/50 text-left pl-1">Weapons</h2>
                        <div className="flex gap-4">
                          <div onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                          <div onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                        </div>
                      </div>

                      {/* Equipment Section */}
                      <div className="flex flex-col items-start gap-4">
                        <h2 className="text-xs font-bold tracking-[0.3em] uppercase mb-2 text-white/50 text-left pl-1">Equipment</h2>

                        {/* Top Row: 5 Boxes */}
                        <div className="flex gap-4">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={`top-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                          ))}
                        </div>

                        {/* Bottom Row: 5 Boxes */}
                        <div className="flex gap-4">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={`bottom-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                          ))}
                        </div>
                      </div>

                      {/* Artifacts Section */}
                      <div className="flex flex-col items-start gap-4">
                        <h2 className="text-xs font-bold tracking-[0.3em] uppercase mb-2 text-white/50 text-left pl-1">Artifacts</h2>

                        <div className="flex gap-4">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={`artifact-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                          ))}
                        </div>
                      </div>

                      {/* Relics Section */}
                      <div className="flex flex-col items-start gap-4">
                        <h2 className="text-xs font-bold tracking-[0.3em] uppercase mb-2 text-white/50 text-left pl-1">Relics</h2>

                        <div className="flex gap-4">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={`relic-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                          ))}
                        </div>
                      </div>

                      {/* Aspect Section */}
                      <div className="flex flex-col items-start gap-4">
                        <h2 className="text-xs font-bold tracking-[0.3em] uppercase mb-2 text-white/50 text-left pl-1">Aspect</h2>

                        <div className="flex gap-4">
                          {[1, 2, 3].map(i => (
                            <div key={`aspect-${i}`} onClick={handleBoxClick} className="w-20 h-20 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] shadow-lg hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"></div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Side Stats Panel */}
                    <div className="flex-shrink-0 pt-6 flex flex-col">
                      <LunaStatsPanel />
                      <LunaCardScroll />
                    </div>

                  </motion.div>
            ) : (
              <motion.div 
                key="inventory"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                className="w-full max-w-5xl"
              >
                <InventoryPanel 
                  inventory={inventoryData} 
                  capacity={profileData.inventoryCapacity} 
                  profile={profileData} 
                  onClose={() => setShowInventory(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

          {/* Blank Drawer */}
          <AnimatePresence>
            {drawerOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                  onClick={() => setDrawerOpen(false)}
                />
                <motion.div
                  initial={{ x: -320, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -320, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed top-0 left-0 bottom-0 w-80 bg-white/[0.03] backdrop-blur-3xl z-50 shadow-[0_4px_30px_rgba(0,0,0,0.2)] flex flex-col rounded-r-3xl border-r border-white/10"
                  style={{ WebkitBackdropFilter: 'blur(50px) saturate(200%)' }}
                >
                  <div className="p-6 flex justify-end">
                      <button 
                        onClick={() => setDrawerOpen(false)}
                        className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-all"
                      >
                        <X className="w-4 h-4 text-white/60" />
                      </button>
                  </div>
                  {/* Blank Content Area */}
                  <div className="flex-1"></div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          </div>
        </DragDropContext>
      )}
    </div>
  );
}