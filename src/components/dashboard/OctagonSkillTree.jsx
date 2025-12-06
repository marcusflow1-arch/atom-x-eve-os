import React from 'react';

const OctagonSkillTree = () => {
  // Shapes are meticulously crafted to interlock perfectly with minimal gaps
  
  // 1. The "Kite" shape - Used for the 4 main cardinal slots (Skill Slot 1-4)
  // Looks like a pentagon/diamond pointing towards center
  const KiteSlot = ({ rotation, label }) => (
    <div className="w-24 h-24 relative">
      <div 
        className="absolute inset-0 bg-slate-900/30 border border-slate-500/30 hover:border-cyan-400/80 hover:bg-cyan-900/20 transition-all cursor-pointer backdrop-blur-sm"
        style={{ 
          clipPath: 'polygon(50% 0%, 100% 30%, 100% 70%, 50% 100%, 0% 70%, 0% 30%)', // Hexagonal-ish kite
          transform: `rotate(${rotation}deg) scale(0.95)` // Scale down slightly for spacing
        }}
      />
      {label && (
         <span 
           className="absolute text-slate-400 text-[9px] font-bold tracking-widest whitespace-nowrap"
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
    <div className="w-16 h-24 relative">
      <div 
        className="absolute inset-0 bg-slate-900/30 border border-slate-500/30 hover:border-cyan-400/80 hover:bg-cyan-900/20 transition-all cursor-pointer backdrop-blur-sm"
        style={{ 
          clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)', // Sharp triangle
          transform: `rotate(${rotation}deg) scale(0.9)`
        }}
      />
    </div>
  );

  // 3. The "Tip" shape - Used for the 4 outer corners
  const TipSlot = ({ rotation }) => (
    <div className="w-20 h-20 relative">
      <div 
        className="absolute inset-0 bg-slate-900/30 border border-slate-500/30 hover:border-cyan-400/80 hover:bg-cyan-900/20 transition-all cursor-pointer backdrop-blur-sm"
        style={{ 
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', // Diamond
          transform: `rotate(${rotation}deg) scale(0.9)`
        }}
      />
    </div>
  );

  // 4. The "Core" shape - 4 small triangles in the center
  const CoreSlot = ({ rotation }) => (
    <div className="w-8 h-8 relative">
      <div 
        className="absolute inset-0 bg-slate-900/30 border border-slate-500/30 hover:border-cyan-400/80 hover:bg-cyan-900/20 transition-all cursor-pointer backdrop-blur-sm"
        style={{ 
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          transform: `rotate(${rotation}deg) scale(0.8)`
        }}
      />
    </div>
  );

  return (
    <div className="relative w-[400px] h-[400px] flex items-center justify-center">
      {/* Container for the whole assembly to keep it centered */}
      <div className="relative w-full h-full">
        
        {/* CENTER CORE - 4 Small inward triangles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16">
           <div className="absolute top-0 left-1/2 -translate-x-1/2"><CoreSlot rotation={180} /></div>
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2"><CoreSlot rotation={0} /></div>
           <div className="absolute left-0 top-1/2 -translate-y-1/2"><CoreSlot rotation={90} /></div>
           <div className="absolute right-0 top-1/2 -translate-y-1/2"><CoreSlot rotation={270} /></div>
        </div>

        {/* INNER RING - 4 Large Kites (Skill Slots) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
          {/* Top */}
          <div className="absolute top-[18%] left-1/2 -translate-x-1/2 pointer-events-auto">
            <KiteSlot rotation={0} label="SKILL SLOT 1" />
          </div>
          {/* Bottom */}
          <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 pointer-events-auto">
            <KiteSlot rotation={180} label="SKILL SLOT 3" />
          </div>
          {/* Right */}
          <div className="absolute right-[18%] top-1/2 -translate-y-1/2 pointer-events-auto">
            <KiteSlot rotation={90} label="SKILL SLOT 2" />
          </div>
          {/* Left */}
          <div className="absolute left-[18%] top-1/2 -translate-y-1/2 pointer-events-auto">
            <KiteSlot rotation={270} label="SKILL SLOT 4" />
          </div>
        </div>

        {/* MIDDLE RING - 8 Shards filling gaps */}
        <div className="absolute inset-0 pointer-events-none">
           {/* Top Right Quad */}
           <div className="absolute top-[28%] right-[28%] pointer-events-auto">
             <ShardSlot rotation={45} />
           </div>
           {/* Top Left Quad */}
           <div className="absolute top-[28%] left-[28%] pointer-events-auto">
             <ShardSlot rotation={-45} />
           </div>
           {/* Bottom Right Quad */}
           <div className="absolute bottom-[28%] right-[28%] pointer-events-auto">
             <ShardSlot rotation={135} />
           </div>
           {/* Bottom Left Quad */}
           <div className="absolute bottom-[28%] left-[28%] pointer-events-auto">
             <ShardSlot rotation={-135} />
           </div>

           {/* Additional filler shards closer to center diagonals */}
           <div className="absolute top-[38%] right-[38%] pointer-events-auto">
             <div className="w-8 h-8 bg-slate-900/30 border border-slate-500/30 hover:border-cyan-400/80 rotate-45" />
           </div>
           <div className="absolute top-[38%] left-[38%] pointer-events-auto">
             <div className="w-8 h-8 bg-slate-900/30 border border-slate-500/30 hover:border-cyan-400/80 rotate-45" />
           </div>
           <div className="absolute bottom-[38%] right-[38%] pointer-events-auto">
             <div className="w-8 h-8 bg-slate-900/30 border border-slate-500/30 hover:border-cyan-400/80 rotate-45" />
           </div>
           <div className="absolute bottom-[38%] left-[38%] pointer-events-auto">
             <div className="w-8 h-8 bg-slate-900/30 border border-slate-500/30 hover:border-cyan-400/80 rotate-45" />
           </div>
        </div>

        {/* OUTER RING - 4 Tips at corners */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[5%] left-1/2 -translate-x-1/2 pointer-events-auto">
            <TipSlot rotation={0} />
          </div>
          <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 pointer-events-auto">
            <TipSlot rotation={0} />
          </div>
          <div className="absolute left-[5%] top-1/2 -translate-y-1/2 pointer-events-auto">
            <TipSlot rotation={0} />
          </div>
          <div className="absolute right-[5%] top-1/2 -translate-y-1/2 pointer-events-auto">
            <TipSlot rotation={0} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default OctagonSkillTree;