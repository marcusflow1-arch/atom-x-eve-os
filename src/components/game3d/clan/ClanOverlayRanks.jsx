import React from 'react';
import { Crown, Star, User as UserIcon, Shield } from 'lucide-react';
import { clanAction } from './clanStore';

const RANK_DEFINITIONS = [
  { role: 'leader', label: 'Guild Leader', icon: Crown, color: 'text-amber-300 border-amber-400/40 bg-amber-500/10',
    perms: ['All permissions', 'Dismantle guild', 'Transfer ownership', 'Promote / demote', 'Claim hall'] },
  { role: 'officer', label: 'Officer', icon: Star, color: 'text-blue-300 border-blue-400/40 bg-blue-500/10',
    perms: ['Edit MOTD', 'Invite members', 'Kick members', 'Start missions', 'Start upgrades', 'Make announcements'] },
  { role: 'member', label: 'Member', icon: UserIcon, color: 'text-white/70 border-white/15 bg-white/5',
    perms: ['Chat in guild', 'Deposit / withdraw vault', 'Join missions', 'Earn favor'] },
];

/** Ranks & Permissions — visualizes the role hierarchy with granular permissions. */
export default function ClanOverlayRanks({ clan, members, myMembership }) {
  if (!clan) return null;

  const isLeader = myMembership?.role === 'leader';
  const grouped = Object.fromEntries(RANK_DEFINITIONS.map((r) => [r.role, []]));
  members.forEach((m) => { if (grouped[m.role]) grouped[m.role].push(m); });

  const promote = async (target, newRole) => {
    try { await clanAction('promote_member', { divisionId: clan.id, targetUserId: target.user_id, newRole }); }
    catch (e) { console.error(e); }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3"
        style={{ background: 'linear-gradient(90deg, rgba(60,100,160,0.18) 0%, rgba(15,18,25,0) 100%)' }}>
        <Shield className="w-6 h-6 text-blue-300" />
        <div>
          <h2 className="text-white text-lg font-bold">Ranks & Permissions</h2>
          <p className="text-white/50 text-xs">Manage guild hierarchy and what each rank can do.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {RANK_DEFINITIONS.map((r) => {
          const Icon = r.icon;
          const list = grouped[r.role] || [];
          return (
            <div key={r.role} className={`rounded-lg border ${r.color} p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5" />
                <span className="text-white font-bold">{r.label}</span>
                <span className="ml-auto text-xs text-white/40">{list.length} member{list.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-1.5">Permissions</div>
                  <ul className="space-y-0.5">
                    {r.perms.map((p) => (
                      <li key={p} className="text-white/70 text-xs flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-white/40" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-white/40 text-xs uppercase tracking-wider mb-1.5">Holders</div>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {list.length === 0 && <span className="text-white/30 text-xs italic">None</span>}
                    {list.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 text-xs">
                        <span className="text-white/80 truncate flex-1">{m.nickname || m.user_id.slice(0, 12)}</span>
                        {isLeader && m.role !== 'leader' && (
                          <select
                            value={m.role}
                            onChange={(e) => promote(m, e.target.value)}
                            className="text-xs bg-black/40 border border-white/10 rounded px-1 py-0.5 text-white/80"
                          >
                            <option value="member">Member</option>
                            <option value="officer">Officer</option>
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}