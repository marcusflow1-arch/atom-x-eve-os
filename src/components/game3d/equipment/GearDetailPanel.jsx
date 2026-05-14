import React from 'react';
import { Lock } from 'lucide-react';

/**
 * Right-side detail panel showing the currently inspected item:
 * Equipped tag, name, type, Mastery, Gear Tier, Physical Attack, Durability, Level.
 */
export default function GearDetailPanel({ item }) {
  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40">
        <div className="w-20 h-20 mb-4 opacity-40">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 20 L25 60 L75 60 Z M40 60 L60 60 L55 85 L45 85 Z" />
          </svg>
        </div>
        <div className="text-sm tracking-wider">No Gear Available</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {item.equipped && (
        <div className="inline-flex items-center self-start gap-2 px-3 py-1 mb-3 rounded-sm border-l-2 border-amber-500/80 bg-amber-900/30">
          <span className="text-amber-200 text-[11px] tracking-[0.2em] uppercase font-medium">
            Equipped
          </span>
        </div>
      )}

      <div className="flex items-start justify-between mb-1">
        <div className="text-white text-xl font-medium">{item.name}</div>
        <button className="flex items-center gap-1 text-white/60 hover:text-white/90 text-xs">
          <Lock className="w-3.5 h-3.5" />
          {item.locked ? 'Locked' : 'Lock'}
        </button>
      </div>
      <div className="text-white/45 text-xs mb-5">{item.type}</div>

      <div className="text-white/60 text-[11px] tracking-[0.2em] uppercase mb-1">Mastery</div>
      <div className="text-white text-4xl font-light mb-5">{item.mastery}</div>

      <div className="space-y-1.5 text-sm">
        <Row label="Gear Tier" value={`Tier ${item.tier}`} />
        <Row label="Physical Attack" value={item.atk} />
      </div>

      <div className="mt-4 text-white/50 text-xs leading-relaxed">
        A {item.type.toLowerCase()}.
      </div>

      <div className="mt-auto pt-4 border-t border-white/10 space-y-1 text-sm">
        <Row label="Durability" value={item.durability} muted />
        <Row label="Gear Level" value={`Level ${item.level}`} muted />
      </div>
    </div>
  );
}

function Row({ label, value, muted }) {
  return (
    <div className="flex justify-between">
      <span className={muted ? 'text-white/50' : 'text-white/55'}>{muted ? label : `• ${label}`}</span>
      <span className="text-white/85">{value}</span>
    </div>
  );
}