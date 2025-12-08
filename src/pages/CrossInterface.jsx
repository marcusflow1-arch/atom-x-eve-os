import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export default function CrossInterface() {
  // Mock items for the rows
  const verticalItems = Array.from({ length: 8 }, (_, i) => ({ id: `v-${i}`, label: `V-${i+1}` }));
  const horizontalItems = Array.from({ length: 12 }, (_, i) => ({ id: `h-${i}`, label: `H-${i+1}` }));

  return (
    <div 
      className="min-h-screen w-full relative overflow-hidden bg-slate-900 text-white"
      style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 25%, #3d4a5c 50%, #2d3548 75%, #1a1f2e 100%)' }}
    >
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full h-screen flex items-center">
        
        {/* The Cross Container */}
        {/* We position the cross starting from the left side */}
        
        {/* Vertical Row (Column) - "Going up and down" */}
        {/* Positioned on the left side */}
        <div className="absolute left-12 top-0 bottom-0 w-24 flex flex-col items-center justify-center gap-4 py-8 z-20 pointer-events-none">
           {/* We make it a bit taller than screen or scrollable? User said "row going up and down". 
               Let's make it a scrollable column or just a static column for now. 
               "Row going up and down" usually implies a column. */}
           <div className="h-full flex flex-col gap-4 overflow-y-auto no-scrollbar pointer-events-auto py-20">
              {verticalItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="w-20 h-20 flex-shrink-0 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer flex items-center justify-center shadow-lg"
                >
                  <span className="text-white/40 font-mono text-xs">{item.label}</span>
                </motion.div>
              ))}
           </div>
        </div>

        {/* Horizontal Row - "Going left to right" */}
        {/* Positioned to intersect the vertical one. 
            "Start at on the far left side" -> The horizontal row should probably start from the intersection point or span the whole width? 
            "Cross" implies intersection. Let's make it span the width, intersecting the vertical column.
        */}
        <div className="absolute left-0 right-0 h-24 flex items-center gap-4 z-10 pointer-events-none">
           {/* Spacer to align with the vertical column's position (left-12 is 3rem, w-24 is 6rem. Center is 6rem) */}
           {/* Let's align the start of the horizontal items so they visually intersect or pass through */}
           
           <div className="w-full flex items-center gap-4 overflow-x-auto no-scrollbar px-12 pointer-events-auto">
              {/* Spacer for the intersection point if needed, or we just let them overlap/cross */}
              <div className="w-24 flex-shrink-0" /> {/* Space for the vertical column intersection */}
              
              {horizontalItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 + 0.2 }}
                  className="w-20 h-20 flex-shrink-0 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer flex items-center justify-center shadow-lg"
                >
                  <span className="text-white/40 font-mono text-xs">{item.label}</span>
                </motion.div>
              ))}
           </div>
        </div>

        {/* Center Intersection Highlight (Optional, just to emphasize the "Cross") */}
        <div className="absolute left-12 w-24 h-24 pointer-events-none z-0 flex items-center justify-center">
            <div className="w-full h-full bg-blue-500/20 blur-xl rounded-full" />
        </div>

      </div>
    </div>
  );
}