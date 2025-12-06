import React from 'react';

const OctagonSkillTree = () => {
  // Shapes are meticulously crafted to interlock perfectly with minimal gaps
  // Adjusted sizes and spacing to reduce overlap and create a better "Big Diamond" shape
  
  // 1. The "Kite" shape - Used for the 4 main cardinal slots (Skill Slot 1-4)
  // Looks like a pentagon/diamond pointing towards center
  const KiteSlot = ({ rotation, label }) => (
    <div className="w-20 h-20 relative">
      <div 
        className="absolute inset-0 bg-slate-900/30 border border-slate-500/30 hover:border-cyan-400/80 hover:bg-cyan-900/20 transition-all cursor-pointer backdrop-blur-sm"
        style={{ 
          clipPath: 'polygon(50% 0%, 100% 30%, 100% 70%, 50% 90%, 0% 70%, 0% 30%)', // Hexagonal-ish kite - shortened tip
          transform: `rotate(${rotation}deg) scale(0.90)` 
        }}
      />
      {label && (
         <span 
           className="absolute text-slate-400 text-[8px] font-bold tracking-widest whitespace-nowrap"
           style={{ 
             top: rotation === 0 ? '-15px' : 'auto',
             bottom: rotation === 180 ? '-15px' : 'auto',
             left: rotation === 270 ? '-50px' : '50%',
             right: rotation === 90 ? '-50px' : 'auto',
             transform: `translateX(${rotation === 0 || rotation === 180 ? '-50%' : '0'})`,
             width: '100px',
             textAlign: 'center'
           }}
         >
           {label}
         </span>
      )}
    </div>
  );

  // 2. The "Shard" shape - Used for the 8 fillers between kites
  const ShardSlot = ({ rotation }) => (
    <div className="w-14 h-20 relative">
      <div 
        className="absolute inset-0 bg-slate-900/30 border border-slate-500/30 hover:border-cyan-400/80 hover:bg-cyan-900/20 transition-all cursor-pointer backdrop-blur-sm"
        style={{ 
          clipPath: 'polygon(0% 0%, 100% 0%, 50% 85%)', // Shortened triangle tip
          transform: `rotate(${rotation}deg) scale(0.85)`
        }}
      />
    </div>
  );

  // 3. The "Tip" shape - Used for the 4 outer corners
  const TipSlot = ({ rotation }) => (
    <div className="w-16 h-16 relative">
      <div 
        className="absolute inset-0 bg-slate-900/30 border border-slate-500/30 hover:border-cyan-400/80 hover:bg-cyan-900/20 transition-all cursor-pointer backdrop-blur-sm"
        style={{ 
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', // Diamond
          transform: `rotate(${rotation}deg) scale(0.85)`
        }}
      />
    </div>
  );

  // 4. The "Core" shape - 4 small triangles in the center
  const CoreSlot = ({ rotation }) => (
    <div className="w-6 h-6 relative">
      <div 
        className="absolute inset-0 bg-slate-900/30 border border-slate-500/30 hover:border-cyan-400/80 hover:bg-cyan-900/20 transition-all cursor-pointer backdrop-blur-sm"
        style={{ 
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          transform: `rotate(${rotation}deg) scale(0.75)`
        }}
      />
    </div>
  );

  return (
    <div className="relative w-[400px] h-[400px] flex items-center justify-center">
      {/* Container for the whole assembly to keep it centered */}
      <div className="relative w-full h-full">
        
        {/* CENTER CORE - 4 Small inward triangles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12">
           <div className="absolute top-0 left-1/2 -translate-x-1/2"><CoreSlot rotation={180} /></div>
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2"><CoreSlot rotation={0} /></div>
           <div className="absolute left-0 top-1/2 -translate-y-1/2"><CoreSlot rotation={90} /></div>
           <div className="absolute right-0 top-1/2 -translate-y-1/2"><CoreSlot rotation={270} /></div>
        </div>

        {/* INNER RING - 4 Large Kites (Skill Slots) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
          {/* Top */}
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 pointer-events-auto">
            <KiteSlot rotation={0} label="SKILL SLOT 1" />
          </div>
          {/* Bottom */}
          <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 pointer-events-auto">
            <KiteSlot rotation={180} label="SKILL SLOT 3" />
          </div>
          {/* Right */}
          <div className="absolute right-[15%] top-1/2 -translate-y-1/2 pointer-events-auto">
            <KiteSlot rotation={90} label="SKILL SLOT 2" />
          </div>
          {/* Left */}
          <div className="absolute left-[15%] top-1/2 -translate-y-1/2 pointer-events-auto">
            <KiteSlot rotation={270} label="SKILL SLOT 4" />
          </div>
        </div>

        {/* MIDDLE RING - 8 Shards filling gaps */}
        <div className="absolute inset-0 pointer-events-none">
           {/* Top Right Quad */}
           <div className="absolute top-[25%] right-[25%] pointer-events-auto">
             <ShardSlot rotation={45} />
           </div>
           {/* Top Left Quad */}
           <div className="absolute top-[25%] left-[25%] pointer-events-auto">
             <ShardSlot rotation={-45} />
           </div>
           {/* Bottom Right Quad */}
           <div className="absolute bottom-[25%] right-[25%] pointer-events-auto">
             <ShardSlot rotation={135} />
           </div>
           {/* Bottom Left Quad */}
           <div className="absolute bottom-[25%] left-[25%] pointer-events-auto">
             <ShardSlot rotation={-135} />
           </div>

           {/* Additional filler shards closer to center diagonals */}
           <div className="absolute top-[36%] right-[36%] pointer-events-auto">
             <div className="w-6 h-6 bg-slate-900/30 border border-slate-500/30 hover:border-cyan-400/80 rotate-45 transition-all" />
           </div>
           <div className="absolute top-[36%] left-[36%] pointer-events-auto">
             <div className="w-6 h-6 bg-slate-900/30 border border-slate-500/30 hover:border-cyan-400/80 rotate-45 transition-all" />
           </div>
           <div className="absolute bottom-[36%] right-[36%] pointer-events-auto">
             <div className="w-6 h-6 bg-slate-900/30 border border-slate-500/30 hover:border-cyan-400/80 rotate-45 transition-all" />
           </div>
           <div className="absolute bottom-[36%] left-[36%] pointer-events-auto">
             <div className="w-6 h-6 bg-slate-900/30 border border-slate-500/30 hover:border-cyan-400/80 rotate-45 transition-all" />
           </div>
        </div>

        {/* OUTER RING - 4 Tips at corners */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[2%] left-1/2 -translate-x-1/2 pointer-events-auto">
            <TipSlot rotation={0} />
          </div>
          <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 pointer-events-auto">
            <TipSlot rotation={0} />
          </div>
          <div className="absolute left-[2%] top-1/2 -translate-y-1/2 pointer-events-auto">
            <TipSlot rotation={0} />
          </div>
          <div className="absolute right-[2%] top-1/2 -translate-y-1/2 pointer-events-auto">
            <TipSlot rotation={0} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default OctagonSkillTree;