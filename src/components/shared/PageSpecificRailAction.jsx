import React from 'react';
import { Eye, MessageSquare } from 'lucide-react';

const actionForPath = (pathname = '') => {
  const path = pathname.toLowerCase();

  if (path.includes('/clan')) {
    return {
      label: 'Clan Quick Menu',
      icon: MessageSquare,
      run: () => window.dispatchEvent(new Event('openClanChatOverlay')),
    };
  }

  if (path.includes('/community') || path.includes('/forum')) {
    return {
      label: 'Forum Quick Menu',
      icon: MessageSquare,
      run: () => window.dispatchEvent(new CustomEvent('openForumDirectory')),
    };
  }

  if (path.includes('/aura') || path.includes('/streaminghome') || path.includes('/discover')) {
    return {
      label: 'Recently Streamed',
      icon: Eye,
      run: () => window.dispatchEvent(new Event('openAuraStreamsDrawer')),
    };
  }

  return null;
};

export default function PageSpecificRailAction({ pathname }) {
  const action = actionForPath(pathname);
  if (!action) return null;
  const Icon = action.icon;

  return (
    <button
      type="button"
      data-ui-editor-ignore="true"
      data-atom-page-rail-action="true"
      title={action.label}
      aria-label={action.label}
      onClick={action.run}
      className="group relative grid h-11 w-11 place-items-center rounded-[15px] border border-white/[0.10] bg-white/[0.035] text-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_10px_24px_rgba(0,0,0,.16)] transition-all duration-200 hover:border-white/[0.18] hover:bg-white/[0.075] hover:text-white"
    >
      <Icon className="h-[17px] w-[17px]" />
      <span className="pointer-events-none absolute left-[calc(100%+9px)] z-[340] hidden whitespace-nowrap rounded-lg bg-[#11161d]/95 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[.12em] text-white/65 shadow-xl backdrop-blur-xl group-hover:block">
        {action.label}
      </span>
    </button>
  );
}
