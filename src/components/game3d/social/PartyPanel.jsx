import React, { useEffect, useState } from 'react';
import { Users, X } from 'lucide-react';
import { partyStore, removePartyMember, PARTY_MAX } from './socialStores';

/**
 * PartyPanel — small box anchored under the Active Quest panel (top-left).
 * Lists current party members and lets the user kick them.
 */
export default function PartyPanel() {
  const [{ members }, setState] = useState(partyStore.get());
  useEffect(() => partyStore.subscribe(setState), []);

  if (members.length === 0) return null; // hidden when empty

  return (
    <div
      className="absolute left-4 top-[260px] w-[260px] rounded-xl overflow-hidden pointer-events-auto z-20"
      style={{
        background: 'rgba(10, 14, 22, 0.78)',
        backdropFilter: 'blur(14px) saturate(160%)',
        border: '1px solid rgba(34, 211, 238, 0.35)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45), 0 0 18px rgba(34, 211, 238, 0.15)',
      }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-cyan-500/10">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-cyan-300" />
          <div className="text-[11px] font-bold text-cyan-200 tracking-[0.15em] uppercase">Party</div>
        </div>
        <div className="text-[10px] font-mono text-white/50">{members.length}/{PARTY_MAX}</div>
      </div>
      <div className="p-2 space-y-1">
        {members.map((m) => (
          <div
            key={m.id}
            className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-200 text-[10px] font-bold">
              {(m.name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-xs text-white truncate font-medium">{m.name}</div>
            <button
              title="Kick"
              onClick={() => removePartyMember(m.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-red-300"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}