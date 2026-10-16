import { useEffect, useState } from 'react';
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

  // In a party, voice switches to the party's own voice room (party members hear each
  // other wherever they are) while the hero stays in the world channel and still sees
  // everyone. This used to switch the whole world channel to the party, so party members
  // stopped seeing other players. The toggle sends voice back to the world.
  const [voiceScope, setVoiceScope] = useState('party');
  const inParty = !!partyId && members.length > 1;
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('lunaVoiceScope', { detail: { scope: inParty && voiceScope === 'party' ? 'party' : 'dashboard' } }));
  }, [inParty, voiceScope]);

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
        <div className="flex items-center gap-2">
          {inParty && (
            <button
              type="button"
              title={voiceScope === 'party' ? 'Voice: party only — switch to world voice' : 'Voice: world — switch to party voice'}
              onClick={() => setVoiceScope((s) => (s === 'party' ? 'world' : 'party'))}
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-200/80 hover:bg-cyan-500/15"
            >
              {voiceScope === 'party' ? 'Party voice' : 'World voice'}
            </button>
          )}
          <div className="text-[10px] font-mono text-white/50">{members.length}/{PARTY_MAX}</div>
        </div>
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