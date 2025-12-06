import React from 'react';

const OctagonSkillTree = () => {
  const HexSlot = ({ rotation, size = 'md' }) => {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-14 h-14',
      lg: 'w-20 h-20'
    };
    
    return (
      <div className={`${sizeClasses[size]} relative`}>
        <div 
          className="absolute inset-0 bg-slate-900/30 border-2 border-slate-600/40 hover:border-cyan-400/60 hover:bg-slate-800/40 transition-all cursor-pointer backdrop-blur-sm"
          style={{ 
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
            transform: `rotate(${rotation}deg)`
          }}
        />
      </div>
    );
  };

  const TriangleSlot = ({ rotation, size = 'md' }) => {
    const sizeClasses = {
      sm: 'w-10 h-10',
      md: 'w-16 h-16',
      lg: 'w-20 h-20'
    };
    
    return (
      <div className={`${sizeClasses[size]} relative`}>
        <div 
          className="absolute inset-0 bg-slate-900/30 border-2 border-slate-600/40 hover:border-cyan-400/60 hover:bg-slate-800/40 transition-all cursor-pointer backdrop-blur-sm"
          style={{ 
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            transform: `rotate(${rotation}deg)`
          }}
        />
      </div>
    );
  };

  const DiamondSlot = ({ size = 'md' }) => {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16'
    };
    
    return (
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 bg-slate-900/30 border-2 border-slate-600/40 hover:border-cyan-400/60 hover:bg-slate-800/40 transition-all cursor-pointer backdrop-blur-sm rotate-45" />
      </div>
    );
  };

  return (
    <div className="relative w-80 h-80">
      {/* Center - 4 small triangles forming inner cross */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <TriangleSlot rotation={0} size="sm" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 translate-x-5">
        <TriangleSlot rotation={90} size="sm" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 translate-y-5">
        <TriangleSlot rotation={180} size="sm" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -translate-x-5">
        <TriangleSlot rotation={270} size="sm" />
      </div>

      {/* Main 4 Hexagons - Cardinal directions with labels */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2">
        <HexSlot rotation={0} size="lg" />
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-slate-300 text-[10px] font-bold tracking-wider whitespace-nowrap">SKILL SLOT 1</span>
      </div>
      <div className="absolute top-1/2 right-12 -translate-y-1/2">
        <HexSlot rotation={90} size="lg" />
        <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-20 text-slate-300 text-[10px] font-bold tracking-wider whitespace-nowrap">SKILL SLOT 2</span>
      </div>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <HexSlot rotation={0} size="lg" />
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-slate-300 text-[10px] font-bold tracking-wider whitespace-nowrap">SKILL SLOT 3</span>
      </div>
      <div className="absolute top-1/2 left-12 -translate-y-1/2">
        <HexSlot rotation={90} size="lg" />
        <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-20 text-slate-300 text-[10px] font-bold tracking-wider whitespace-nowrap">SKILL SLOT 4</span>
      </div>

      {/* 8 Medium Triangles between the main hexagons */}
      {/* Top-Left pair */}
      <div className="absolute top-24 left-24">
        <TriangleSlot rotation={45} size="md" />
      </div>
      <div className="absolute top-20 left-28">
        <TriangleSlot rotation={135} size="md" />
      </div>
      
      {/* Top-Right pair */}
      <div className="absolute top-24 right-24">
        <TriangleSlot rotation={315} size="md" />
      </div>
      <div className="absolute top-20 right-28">
        <TriangleSlot rotation={225} size="md" />
      </div>
      
      {/* Bottom-Left pair */}
      <div className="absolute bottom-24 left-24">
        <TriangleSlot rotation={135} size="md" />
      </div>
      <div className="absolute bottom-20 left-28">
        <TriangleSlot rotation={45} size="md" />
      </div>
      
      {/* Bottom-Right pair */}
      <div className="absolute bottom-24 right-24">
        <TriangleSlot rotation={225} size="md" />
      </div>
      <div className="absolute bottom-20 right-28">
        <TriangleSlot rotation={315} size="md" />
      </div>

      {/* 4 Large Corner Triangles */}
      <div className="absolute top-2 left-2">
        <TriangleSlot rotation={45} size="lg" />
      </div>
      <div className="absolute top-2 right-2">
        <TriangleSlot rotation={315} size="lg" />
      </div>
      <div className="absolute bottom-2 left-2">
        <TriangleSlot rotation={135} size="lg" />
      </div>
      <div className="absolute bottom-2 right-2">
        <TriangleSlot rotation={225} size="lg" />
      </div>

      {/* 4 Corner Diamonds - very small */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2">
        <DiamondSlot size="sm" />
      </div>
      <div className="absolute top-1/2 right-6 -translate-y-1/2">
        <DiamondSlot size="sm" />
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <DiamondSlot size="sm" />
      </div>
      <div className="absolute top-1/2 left-6 -translate-y-1/2">
        <DiamondSlot size="sm" />
      </div>
    </div>
  );
};

export default OctagonSkillTree;