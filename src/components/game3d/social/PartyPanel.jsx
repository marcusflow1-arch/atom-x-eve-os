import React, { useEffect, useState } from 'react';
import { Users, X, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/auth/AuthContext';
import { partyStore, removePartyMember, PARTY_MAX } from './socialStores';
import { kickPartyMember, leaveParty } from './partyInvite';

/**
 * PartyPanel — small box anchored under the Active Quest panel (top-left).
 * Lists the party members (the shared partySystem party). You can leave; the
 * leader can remove others. Both go through the server, which owns the party.
 */
export default function PartyPanel() {
  const { user } = useAuth();
  const [partyState, setState] = useState(partyStore.get());
  const { members, partyId, leaderId } = partyState;
  useEffect(() => partyStore.subscribe(setState), []);
  const me = user?.id;
  const isLeader = !!me && leaderId === me;
  const removeFromParty = async (member) => {
    try {
      if (member.id === me) await leaveParty(); else await kickPartyMember(member.id);
      removePartyMember(member.id); // the server's change refreshes the store too
    } catch (e) {
      toast.error(e?.message || 'Could not update the party');
    }
  };

  // When party forms or changes, switch voice chat to the party-specific channel
  // so party members hear only each other, no matter where they are on the map.
  useEffect(() => {
    if (partyId && members.length > 1) {
      window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', {
        detail: { channelId: `party_${partyId}`, hostId: `party_${partyId}` },
      }));
    }
    // When party dissolves, rejoin the world channel
    if (members.length === 0) {
      window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', {
        detail: { channelId: 'game_world_main', hostId: 'game_world_main' },
      }));
    }
  }, [partyId, members.length]);

  if (members.length === 0) return null; // hidden when empty

  return (
    <div
      className="absolute left-4 top-[324px] w-[260px] rounded-xl overflow-hidden pointer-events-auto z-20"
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
            {(m.id === me || isLeader) && (
              <button
                title={m.id === me ? 'Leave the party' : 'Remove from the party'}
                onClick={() => removeFromParty(m)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-red-300"
              >
                {m.id === me ? <LogOut className="w-3 h-3" /> : <X className="w-3 h-3" />}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}