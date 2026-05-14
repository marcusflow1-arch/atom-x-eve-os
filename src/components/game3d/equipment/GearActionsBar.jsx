import React from 'react';

/**
 * Bottom action bar — left: Return / Filter / Obtain More
 *                     right: Enhance / Repair / Replace
 */
export default function GearActionsBar() {
  return (
    <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between text-sm text-white/70 pointer-events-auto">
      <div className="flex items-center gap-6">
        <Action keyHint="Esc" label="Return" />
        <Action keyHint="△" label="Filter" />
        <Action keyHint="□" label="Obtain More" />
      </div>
      <div className="flex items-center gap-6">
        <Action keyHint="◯" label="Enhance" />
        <Action keyHint="△" label="Repair" />
        <Action keyHint="✕" label="Replace" accent />
      </div>
    </div>
  );
}

function Action({ keyHint, label, accent }) {
  return (
    <button className="flex items-center gap-2 group">
      <span
        className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold border ${
          accent
            ? 'bg-amber-700/30 border-amber-400/40 text-amber-200'
            : 'bg-white/[0.05] border-white/20 text-white/70 group-hover:text-white'
        }`}
      >
        {keyHint}
      </span>
      <span className="group-hover:text-white">{label}</span>
    </button>
  );
}