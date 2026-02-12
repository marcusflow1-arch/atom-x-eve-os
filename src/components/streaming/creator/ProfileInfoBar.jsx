import React from 'react';
import { Gamepad2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

export default function ProfileInfoBar({ 
  activeProfile, 
  isEditMode, 
  isLive, 
  updateEditProfile, 
  activeTab, 
  setActiveTab 
}) {
  const displayName = activeProfile?.display_name || activeProfile?.full_name || 'My Channel';
  const tagline = activeProfile?.tagline || '';

  const handleAvatarUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        updateEditProfile('avatar_url', file_url);
      } catch (err) {
        // Fallback to local preview
        const url = URL.createObjectURL(file);
        updateEditProfile('avatar_url', url);
      }
    };
    input.click();
  };

  const tabs = ['schedule', 'cards', 'gallery', 'games'];

  return (
    <div className="w-full px-2 py-4 flex flex-col md:flex-row items-center justify-between gap-6 relative">
      {/* Left: Avatar + Identity */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-white/10 bg-black">
            {activeProfile?.avatar_url ? (
              <img src={activeProfile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
                {displayName.charAt(0)}
              </div>
            )}
          </div>
          {isEditMode && (
            <div
              onClick={handleAvatarUpload}
              className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors z-10"
            >
              <Plus className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
        <div className="flex flex-col">
          {isEditMode ? (
            <div className="space-y-1">
              <Input
                value={activeProfile?.display_name || ''}
                onChange={(e) => updateEditProfile('display_name', e.target.value)}
                className="h-8 bg-black/40 border-white/20 text-white font-bold"
                placeholder="Channel Name"
              />
              <Input
                value={activeProfile?.tagline || ''}
                onChange={(e) => updateEditProfile('tagline', e.target.value)}
                className="h-6 text-xs bg-black/40 border-white/20 text-white/70"
                placeholder="Tagline"
              />
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white tracking-wide">{displayName}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest">{tagline}</span>
                {isLive && <Badge className="bg-red-500 text-white text-[10px] h-4 px-1">LIVE</Badge>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center: Tab Navigation */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 mb-1">
          <Gamepad2 className="w-5 h-5 text-white/50" />
        </div>
        <div className="flex items-center gap-8 text-sm font-medium">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(activeTab === tab ? null : tab)}
              className={`pb-1 px-1 transition-colors border-b-2 capitalize ${
                activeTab === tab
                  ? 'text-white border-white'
                  : 'text-white/50 border-transparent hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Stats */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-xs text-white/40 uppercase font-bold">Total Views</div>
          <div className="text-lg font-mono font-bold text-white">42.5K</div>
        </div>
      </div>
    </div>
  );
}