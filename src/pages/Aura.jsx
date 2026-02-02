import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Gamepad2, Users, MessageSquare, Settings, Play, Radio, LayoutGrid } from 'lucide-react';
import StreamingGamesLive from '@/components/streaming/StreamingGamesLive';
import BottomQuickBar from '@/components/streaming/BottomQuickBar';
import LibrarySidebar from '@/components/streaming/LibrarySidebar';

export default function Aura() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-[#0f1419] relative">
      {/* Top Navigation Bar - Matches Screenshot */}
      <div className="fixed top-0 left-0 right-0 z-50 px-8 py-4 bg-[#0f1419]/90 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between">
          
          {/* Left: Brand/Title */}
          <div className="flex items-center gap-6">
            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all shadow-lg border border-white/10">
              <div className="flex flex-col gap-[3px]">
                <span className="w-4 h-[2px] bg-white/90 rounded-full" />
                <span className="w-4 h-[2px] bg-white/90 rounded-full" />
                <span className="w-4 h-[2px] bg-white/90 rounded-full" />
              </div>
            </button>
            <span className="text-xl font-bold text-white tracking-wide">Atom X Eve Dashboard Home</span>
          </div>

          {/* Right: Navigation Links */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(createPageUrl('LunaTemplate'))}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all border border-transparent text-white/70 hover:bg-white/10 hover:text-white"
            >
              Home
            </button>

            <button
              onClick={() => navigate(createPageUrl('LunaTemplate') + '?panel=library')}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all border border-transparent text-white/70 hover:bg-white/10 hover:text-white"
            >
              Library
            </button>

            <button
              onClick={() => navigate(createPageUrl('ClanHub'))}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all border border-transparent text-white/70 hover:bg-white/10 hover:text-white"
            >
              Clan
            </button>

            <button
              onClick={() => navigate(createPageUrl('Community'))}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all border border-transparent text-white/70 hover:bg-white/10 hover:text-white"
            >
              Forum
            </button>

            <button
              onClick={() => navigate(createPageUrl('LunaTemplate') + '?panel=settings')}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all border border-transparent text-white/70 hover:bg-white/10 hover:text-white"
            >
              Settings
            </button>

            <button
              onClick={() => navigate(createPageUrl('LunaTemplate') + '?panel=entertainment')}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all border border-transparent text-white/70 hover:bg-white/10 hover:text-white"
            >
              Entertainment
            </button>

            <button
              className="px-4 py-2 rounded-full text-sm font-medium transition-all border bg-white/10 border-white/10 text-white shadow-sm"
            >
              Aura
            </button>

            <a
              href="https://discord.gg/VJQQNxAa"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 px-4 py-2 rounded-full text-sm font-medium transition-all border bg-[#5865F2]/20 border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/30 hover:text-white flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0  1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Discord
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-24">
        <StreamingGamesLive />
      </div>

      {/* Sidebars & Overlays */}
      <LibrarySidebar />
      <BottomQuickBar />
    </div>
  );
}