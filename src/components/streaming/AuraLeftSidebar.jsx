import React from 'react';
import { Library, Users, PlaySquare, Tv, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const quickActions = [
  {
    id: 'watch-streams',
    label: 'Watch Streams',
    icon: Tv,
    iconClass: 'text-purple-300',
    className: 'bg-purple-500/20 border-purple-400/30 shadow-[0_0_18px_rgba(168,85,247,0.25)]',
  },
  {
    id: 'friends',
    label: 'Friends',
    icon: Users,
    iconClass: 'text-cyan-200',
    className: 'bg-white/10 border-white/15',
  },
  {
    id: 'library',
    label: 'Library Rewards',
    icon: Library,
    iconClass: 'text-white/80',
    className: 'bg-white/10 border-white/15',
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    icon: PlaySquare,
    iconClass: 'text-white/80',
    className: 'bg-white/10 border-white/15',
  },
  {
    id: 'stream-settings',
    label: 'Stream Settings',
    icon: Settings,
    iconClass: 'text-amber-200',
    className: 'bg-amber-500/15 border-amber-300/25',
  },
];

export default function AuraLeftSidebar() {
  const navigate = useNavigate();

  const handleAction = (actionId) => {
    if (actionId === 'friends') {
      window.dispatchEvent(new CustomEvent('openSocialHub'));
      return;
    }

    if (actionId === 'library') {
      window.dispatchEvent(new CustomEvent('openLibrarySidebar'));
      return;
    }

    if (actionId === 'entertainment') {
      navigate(createPageUrl('LunaTemplate') + '?panel=entertainment');
      return;
    }

    if (actionId === 'stream-settings') {
      navigate(createPageUrl('StreamerProfileEdit'));
      return;
    }
  };

  return (
    <div className="w-[5%] min-w-[88px] h-full border-r border-white/20 bg-black/20 relative z-40 flex-shrink-0 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm flex flex-col items-center pt-6 pb-24">
      <div className="flex flex-col items-center w-full px-2 mt-16 flex-1 min-h-0">
        <span className="text-[9px] uppercase tracking-wider text-white/50 font-bold text-center mb-1 leading-tight">Recently<br/>Watched<br/>Streams</span>
        <div className="w-8 h-px bg-white/20 mb-4 mt-2" />

        <div className="flex flex-col gap-3 w-full items-center">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center shadow-lg">
              <span className="text-white/30 text-lg font-bold">?</span>
            </div>
          ))}
        </div>

        <div className="mt-auto w-full flex flex-col items-center gap-3 pb-2">
          {quickActions.map(({ id, label, icon: Icon, iconClass, className }) => (
            <button
              key={id}
              onClick={() => handleAction(id)}
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all hover:scale-105 ${className}`}
              title={label}
              aria-label={label}
            >
              <Icon className={`w-5 h-5 ${iconClass}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}