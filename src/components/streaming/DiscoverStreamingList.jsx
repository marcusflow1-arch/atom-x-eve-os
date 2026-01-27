import React from 'react';
import { motion } from 'framer-motion';
import ShinyCard from '@/components/shared/ShinyCard';

const mockStreamers = Array.from({ length: 14 }).map((_, i) => ({
  id: `str_${i + 1}`,
  name: [
    'NovaKnight','PixelSage','ZeroShift','LunaVox','CrimsonByte','EchoBlade','SolarFlare',
    'FrostSpark','NeonRift','AstraWave','NightPulse','QuantumFox','VortexEdge','ZenithKai'
  ][i],
  avatar: `https://source.unsplash.com/random/240x240?gamer,portrait&sig=${i + 11}`,
}));

export default function DiscoverStreamingList() {
  const [selected, setSelected] = React.useState(0);
  const itemRefs = React.useRef([]);

  // A = up, S = down navigation
  React.useEffect(() => {
    const onKey = (e) => {
      const key = e.key?.toLowerCase();
      if (key === 'a' || key === 's') {
        e.preventDefault();
        setSelected((prev) => {
          if (key === 'a') return Math.max(0, prev - 1);
          if (key === 's') return Math.min(mockStreamers.length - 1, prev + 1);
          return prev;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Keep selected card in view
  React.useEffect(() => {
    const el = itemRefs.current[selected];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selected]);

  return (
    <div className="w-full min-h-screen pt-20 pb-24 px-4 md:px-8">
      <div className="mx-auto max-w-7xl grid grid-cols-1 gap-6">
        {/* Left: Streamer cards column */}
        <div
          className="overflow-y-auto no-scrollbar pr-2"
          style={{ maxHeight: 'calc(100vh - 160px)' }}
        >
          <div className="flex flex-col gap-4">
            {mockStreamers.map((s, idx) => (
              <motion.div
                key={s.id}
                ref={(el) => (itemRefs.current[idx] = el)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.02 }}
                onClick={() => setSelected(idx)}
              >
                <ShinyCard
                  className={`relative w-full rounded-2xl p-4 border ${
                    selected === idx
                      ? 'border-white/30 bg-white/15'
                      : 'border-white/10 bg-white/8'
                  } backdrop-blur-xl transition-all`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-1 ring-white/15">
                      <img
                        src={s.avatar}
                        alt={s.name}
                        className="w-full h-full object-cover"
                      />
                      {/* subtle glass overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-bold tracking-wide truncate">
                          {s.name}
                        </h3>
                        {selected === idx && (
                          <span className="text-xs text-cyan-300 font-semibold">Selected</span>
                        )}
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                          style={{ width: `${40 + (idx % 5) * 12}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </ShinyCard>
              </motion.div>
            ))}
          </div>
        </div>


      </div>

      {/* Local styles for hidden scrollbar */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}