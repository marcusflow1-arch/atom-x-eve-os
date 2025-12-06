import React from 'react';

const OctagonSkillTree = () => {
  const HexSlot = ({ rotation }) => (
    <div className="w-16 h-16 relative">
      <div 
        className="absolute inset-0 bg-white/5 border-2 border-white/20 hover:border-white/40 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-md"
        style={{ 
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
          transform: `rotate(${rotation}deg)`
        }}
      />
    </div>
  );

  const TriangleSlot = ({ rotation, label }) => (
    <div className="w-24 h-24 relative flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-white/5 border-2 border-white/20 hover:border-white/40 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-md"
        style={{ 
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          transform: `rotate(${rotation}deg)`
        }}
      />
      {label && (
        <span className="absolute text-white/60 text-[8px] font-bold tracking-wider whitespace-nowrap" style={{ transform: `rotate(-${rotation}deg)` }}>
          {label}
        </span>
      )}
    </div>
  );

  const DiamondSlot = () => (
    <div className="w-14 h-14 relative">
      <div className="absolute inset-0 bg-white/5 border-2 border-white/20 hover:border-white/40 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-md rotate-45 rounded-sm" />
    </div>
  );

  return (
    <div className="relative w-96 h-96">
      {/* Center Hexagons - Inner octagon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12">
          <HexSlot rotation={0} />
        </div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-12">
          <HexSlot rotation={90} />
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-12">
          <HexSlot rotation={0} />
        </div>
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-12">
          <HexSlot rotation={90} />
        </div>
      </div>

      {/* Middle Layer - Main diamond hexagons */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2">
        <HexSlot rotation={0} />
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-white/60 text-[10px] font-bold tracking-wider whitespace-nowrap">SKILL SLOT 1</span>
      </div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2">
        <HexSlot rotation={90} />
        <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-20 text-white/60 text-[10px] font-bold tracking-wider whitespace-nowrap">SKILL SLOT 2</span>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <HexSlot rotation={0} />
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-[10px] font-bold tracking-wider whitespace-nowrap">SKILL SLOT 3</span>
      </div>
      <div className="absolute top-1/2 left-0 -translate-y-1/2">
        <HexSlot rotation={90} />
        <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-20 text-white/60 text-[10px] font-bold tracking-wider whitespace-nowrap">SKILL SLOT 4</span>
      </div>

      {/* Outer Triangles - Top */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2">
        <TriangleSlot rotation={0} />
      </div>

      {/* Outer Triangles - Right */}
      <div className="absolute top-1/2 right-2 -translate-y-1/2">
        <TriangleSlot rotation={90} />
      </div>

      {/* Outer Triangles - Bottom */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
        <TriangleSlot rotation={180} />
      </div>

      {/* Outer Triangles - Left */}
      <div className="absolute top-1/2 left-2 -translate-y-1/2">
        <TriangleSlot rotation={270} />
      </div>

      {/* Corner Diamonds - Top Left */}
      <div className="absolute top-8 left-8">
        <DiamondSlot />
      </div>

      {/* Corner Diamonds - Top Right */}
      <div className="absolute top-8 right-8">
        <DiamondSlot />
      </div>

      {/* Corner Diamonds - Bottom Left */}
      <div className="absolute bottom-8 left-8">
        <DiamondSlot />
      </div>

      {/* Corner Diamonds - Bottom Right */}
      <div className="absolute bottom-8 right-8">
        <DiamondSlot />
      </div>
    </div>
  );
};

export default OctagonSkillTree;