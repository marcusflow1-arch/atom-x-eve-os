import React, { useState } from 'react';
import { Shield, Edit3, MapPin, Crown, Star } from 'lucide-react';
import { clanAction } from './clanStore';

/**
 * Main "Home" view — mirrors the GW2 screenshot:
 *  - Clan header (icon, name, tag, online count)
 *  - Message of the Day (editable for officers+)
 *  - Member roster with Name / Location columns
 */
export default function ClanOverlayHome({ clan, members, onlineUserIds, myMembership }) {
  const [editingMotd, setEditingMotd] = useState(false);
  const [motdDraft, setMotdDraft] = useState('');
  const [saving, setSaving] = useState(false);

  if (!clan) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
        Select a guild to view details.
      </div>
    );
  }

  const onlineCount = members.filter((m) => onlineUserIds.has(m.user_id)).length;
  const canEditMotd = myMembership && (myMembership.role === 'leader' || myMembership.role === 'officer');

  const startEdit = () => { setMotdDraft(clan.motto || ''); setEditingMotd(true); };
  const saveMotd = async () => {
    setSaving(true);
    try { await clanAction('edit_motd', { divisionId: clan.id, motd: motdDraft }); setEditingMotd(false); }
    catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const ROLE_ICON = { leader: Crown, officer: Star };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Clan Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-start gap-4"
        style={{ background: 'linear-gradient(90deg, rgba(120,80,30,0.18) 0%, rgba(15,18,25,0) 100%)' }}
      >
        <div className="w-14 h-14 rounded-lg border border-amber-400/30 flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(120,80,30,0.4), rgba(60,40,15,0.6))' }}
        >
          {clan.icon ? (
            <img src={clan.icon} alt={clan.name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <Shield className="w-7 h-7 text-amber-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h2 className="text-white text-xl font-bold tracking-wide truncate">{clan.name}</h2>
            {clan.tag && <span className="text-white/50 text-sm font-semibold">[{clan.tag}]</span>}
          </div>
          <p className="text-white/60 text-xs mt-0.5">
            {onlineCount}/{members.length} Members Online
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-amber-300 text-xs font-bold uppercase tracking-wider">Level</div>
          <div className="text-white text-2xl font-bold">{clan.level || 1}</div>
        </div>
      </div>

      {/* Message of the Day */}
      <div className="px-6 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Message of the Day</span>
          {canEditMotd && !editingMotd && (
            <button
              onClick={startEdit}
              className="flex items-center gap-1 text-xs text-white/50 hover:text-white px-2 py-0.5 rounded hover:bg-white/5 transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </button>
          )}
        </div>
        {editingMotd ? (
          <div className="space-y-2">
            <textarea
              value={motdDraft}
              onChange={(e) => setMotdDraft(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400/40 resize-none"
              placeholder="Write a welcome message for your guild..."
            />
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setEditingMotd(false)} disabled={saving} className="px-3 py-1 text-xs text-white/60 hover:text-white">
                Cancel
              </button>
              <button onClick={saveMotd} disabled={saving} className="px-4 py-1 text-xs font-semibold bg-amber-500/20 border border-amber-400/40 text-amber-200 rounded hover:bg-amber-500/30 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="min-h-[2.5rem] px-3 py-2 bg-black/30 border border-white/5 rounded text-white/80 text-sm whitespace-pre-wrap">
            {clan.motto || <span className="text-white/30 italic">No message set.</span>}
          </div>
        )}
      </div>

      {/* Member Roster */}
      <div className="flex-1 overflow-hidden flex flex-col px-6 pb-4">
        <div className="grid grid-cols-[1fr_180px_80px] gap-3 px-3 py-2 text-white/40 text-xs font-semibold uppercase tracking-wider border-b border-white/5">
          <span>Name</span>
          <span>Location</span>
          <span className="text-right">Rank</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {members.map((m) => {
            const isOnline = onlineUserIds.has(m.user_id);
            const RoleIcon = ROLE_ICON[m.role];
            return (
              <div key={m.id} className="grid grid-cols-[1fr_180px_80px] gap-3 px-3 py-2 items-center hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-white/15'}`} />
                  {RoleIcon ? <RoleIcon className={`w-3.5 h-3.5 flex-shrink-0 ${m.role === 'leader' ? 'text-amber-300' : 'text-blue-300'}`} /> : <span className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span className="text-white text-sm truncate">{m.nickname || m.user_id.slice(0, 12)}</span>
                  {m.title && <span className="text-white/40 text-xs truncate">— {m.title}</span>}
                </div>
                <div className="flex items-center gap-1 text-white/50 text-xs truncate">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{isOnline ? 'In-Game' : '—'}</span>
                </div>
                <div className="text-right text-white/60 text-xs capitalize">{m.role}</div>
              </div>
            );
          })}
          {members.length === 0 && (
            <div className="text-center py-6 text-white/30 text-sm">No members yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}