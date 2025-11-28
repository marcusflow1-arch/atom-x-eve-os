import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Play } from 'lucide-react';

export default function PinGamesContent() {
  const [activePinGamePage, setActivePinGamePage] = useState(0);

  return (
    <div className="bg-slate-800/20 rounded-lg border border-slate-700/30 p-3">
      {/* 4 columns x 5 rows grid */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[...Array(20)].map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            {/* Game Icon Box */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-16 h-16 flex-shrink-0 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-blue-500/50 cursor-pointer transition-all flex items-center justify-center"
            >
              <Gamepad2 className="w-6 h-6 text-slate-500" />
            </motion.div>
            
            {/* Game Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-300 truncate">Game {index + 1}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-0.5 px-2 py-0.5 bg-blue-600/80 hover:bg-blue-600 rounded text-[10px] font-medium text-white flex items-center gap-1 transition-all"
              >
                <Play className="w-2.5 h-2.5" fill="currentColor" />
                Play
              </motion.button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-2">
        {[0, 1, 2].map((page) => (
          <button
            key={page}
            onClick={() => setActivePinGamePage(page)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              activePinGamePage === page
                ? 'bg-blue-500 w-8'
                : 'bg-slate-600 hover:bg-slate-500'
            }`}
          />
        ))}
      </div>
    </div>
  );
}