import React from 'react';

const OctagonSkillTree = () => {
  const HexSlot = ({ rotation, size = 'md' }) => {
    const sizeClasses = {
      sm: 'w-10 h-10',
      md: 'w-12 h-12',
      lg: 'w-16 h-16'
    };
    
    return (
      <div className={`${sizeClasses[size]} relative`}>
        <div 
          className="absolute inset-0 bg-white/5 border-2 border-white/20 hover:border-white/40 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-md"
          style={{ 
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
            transform: `rotate(${rotation}deg)`
          }}
        />
      </div>
    );
  };

  const TriangleSlot = ({ rotation }) => (
    <div className="w-16 h-16 relative">
      <div 
        className="absolute inset-0 bg-white/5 border-2 border-white/20 hover:border-white/40 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-md"
        style={{ 
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          transform: `rotate(${rotation}deg)`
        }}
      />
    </div>
  );

  const DiamondSlot = () => (
    <div className="w-10 h-10 relative">
      <div className="absolute inset-0 bg-white/5 border-2 border-white/20 hover:border-white/40 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-md rotate-45 rounded-sm" />
    </div>
  );

  return (
    <div className="relative w-64 h-64">
      {/* Center - 4 small triangles forming inner cross */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 w-6 h-6">
          <TriangleSlot rotation={0} />
        </div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-3 w-6 h-6">
          <TriangleSlot rotation={90} />
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3 w-6 h-6">
          <TriangleSlot rotation={180} />
        </div>
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-3 w-6 h-6">
          <TriangleSlot rotation={270} />
        </div>
      </div>

      {/* Main 4 Hexagons - Cardinal directions */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <HexSlot rotation={0} size="lg" />
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-white/60 text-[8px] font-bold tracking-wider whitespace-nowrap">SKILL SLOT 1</span>
      </div>
      <div className="absolute top-1/2 right-8 -translate-y-1/2">
        <HexSlot rotation={90} size="lg" />
        <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 text-white/60 text-[8px] font-bold tracking-wider whitespace-nowrap">SKILL SLOT 2</span>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <HexSlot rotation={0} size="lg" />
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-white/60 text-[8px] font-bold tracking-wider whitespace-nowrap">SKILL SLOT 3</span>
      </div>
      <div className="absolute top-1/2 left-8 -translate-y-1/2">
        <HexSlot rotation={90} size="lg" />
        <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 text-white/60 text-[8px] font-bold tracking-wider whitespace-nowrap">SKILL SLOT 4</span>
      </div>

      {/* 8 Medium Hexagons around the main diamond */}
      {/* Top-Left diagonal */}
      <div className="absolute top-16 left-16">
        <HexSlot rotation={0} size="md" />
      </div>
      {/* Top-Right diagonal */}
      <div className="absolute top-16 right-16">
        <HexSlot rotation={90} size="md" />
      </div>
      {/* Bottom-Left diagonal */}
      <div className="absolute bottom-16 left-16">
        <HexSlot rotation={90} size="md" />
      </div>
      {/* Bottom-Right diagonal */}
      <div className="absolute bottom-16 right-16">
        <HexSlot rotation={0} size="md" />
      </div>
      {/* Top between center and top slot */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2">
        <HexSlot rotation={0} size="sm" />
      </div>
      {/* Right between center and right slot */}
      <div className="absolute top-1/2 right-20 -translate-y-1/2">
        <HexSlot rotation={90} size="sm" />
      </div>
      {/* Bottom between center and bottom slot */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
        <HexSlot rotation={0} size="sm" />
      </div>
      {/* Left between center and left slot */}
      <div className="absolute top-1/2 left-20 -translate-y-1/2">
        <HexSlot rotation={90} size="sm" />
      </div>

      {/* 4 Large Outer Triangles */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2">
        <TriangleSlot rotation={0} />
      </div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2">
        <TriangleSlot rotation={90} />
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <TriangleSlot rotation={180} />
      </div>
      <div className="absolute top-1/2 left-0 -translate-y-1/2">
        <TriangleSlot rotation={270} />
      </div>

      {/* 4 Corner Diamonds */}
      <div className="absolute top-4 left-4">
        <DiamondSlot />
      </div>
      <div className="absolute top-4 right-4">
        <DiamondSlot />
      </div>
      <div className="absolute bottom-4 left-4">
        <DiamondSlot />
      </div>
      <div className="absolute bottom-4 right-4">
        <DiamondSlot />
      </div>
    </div>
  );
};

export default OctagonSkillTree;