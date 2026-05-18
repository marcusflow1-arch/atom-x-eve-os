import React from 'react';
import { Shield, HelpCircle, Plus } from 'lucide-react';

/**
 * Left sidebar of the clan overlay — matches the GW2 layout:
 *  - Account Guilds (label)
 *  - What is a guild? (help link)
 *  - <Clan Name> [TAG]  (one row per guild)
 */
export default function ClanOverlaySidebar({ myClans, activeClanId, onSelect, onCreateClan, onWhatIsGuild }) {
  return (
    <div className="w-56 flex-shrink-0 border-r border-white/10 flex flex-col"
      style={{ background: 'rgba(15, 18, 25, 0.65)' }}
    >
      <div className="px-4 py-3 text-white/90 text-sm font-semibold tracking-wide border-b border-white/5">
        Account Guilds
      </div>

      <button
        onClick={onWhatIsGuild}
        className="flex items-center gap-2 px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/5 text-sm transition-colors text-left"
      >
        <HelpCircle className="w-4 h-4" />
        What is a guild?
      </button>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {myClans.map((clan) => {
          const isActive = clan.id === activeClanId;
          return (
            <button
              key={clan.id}
              onClick={() => onSelect(clan.id)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors border-l-2 ${
                isActive
                  ? 'bg-amber-500/10 text-white border-amber-400'
                  : 'text-white/70 hover:bg-white/5 hover:text-white border-transparent'
              }`}
            >
              <Shield className="w-3.5 h-3.5 flex-shrink-0 text-amber-300/80" />
              <span className="truncate">{clan.name}</span>
              {clan.tag ? (
                <span className="ml-auto text-white/40 text-xs">[{clan.tag}]</span>
              ) : null}
            </button>
          );
        })}

        {myClans.length === 0 && (
          <div className="px-4 py-6 text-center text-white/40 text-xs">
            You are not in any guilds yet.
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/5">
        <button
          onClick={onCreateClan}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-semibold text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Guild
        </button>
      </div>
    </div>
  );
}