import React from 'react';
import { Plus, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

export default function ProfileInfoBar({
  activeProfile,
  isEditMode,
  isLive,
  updateEditProfile,
  activeTab,
  setActiveTab,
  onEnterEdit
}) {
  const displayName = activeProfile?.display_name || activeProfile?.full_name || 'My Channel';
  const tagline = activeProfile?.tagline || '';
  const tabs = ['schedule', 'cards', 'gallery', 'games'];

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
        const url = URL.createObjectURL(file);
        updateEditProfile('avatar_url', url);
      }
    };
    input.click();
  };

  return (
    <div className="w-full px-2 py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative">
      <div className="flex items-center gap-4 min-w-0">
        <div className="relative group shrink-0">
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
            <div onClick={handleAvatarUpload} className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors z-10">
              <Plus className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        <div className="flex flex-col min-w-0">
          {isEditMode ? (
            <div className="space-y-1">
              <Input value={activeProfile?.display_name || ''} onChange={(e) => updateEditProfile('display_name', e.target.value)} className="h-8 bg-black/40 border-white/20 text-white font-bold" placeholder="Channel Name" />
              <Input value={activeProfile?.tagline || ''} onChange={(e) => updateEditProfile('tagline', e.target.value)} className="h-6 text-xs bg-black/40 border-white/20 text-white/70" placeholder="Tagline" />
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white tracking-wide truncate">{displayName}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest">{tagline}</span>
                {isLive && <Badge className="bg-red-500 text-white text-[10px] h-4 px-1">LIVE</Badge>}
              </div>
            </>
          )}
        </div>

        {!isEditMode && (
          <nav aria-label="Streamer profile sections" className="flex items-center gap-1 sm:gap-2 ml-1 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(activeTab === tab ? null : tab)}
                className={`relative px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium capitalize transition-all ${activeTab === tab ? 'text-white' : 'text-white/50 hover:text-white'}`}
              >
                {tab}
                <span className={`absolute left-2 right-2 -bottom-0.5 h-px transition-opacity ${activeTab === tab ? 'bg-white opacity-100' : 'bg-white/30 opacity-0 group-hover:opacity-100'}`} />
              </button>
            ))}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-4 self-end lg:self-auto shrink-0">
        <div className="text-right hidden sm:block">
          <div className="text-xs text-white/40 uppercase font-bold">Total Views</div>
          <div className="text-lg font-mono font-bold text-white">42.5K</div>
        </div>
        {!isEditMode && onEnterEdit && (
          <button onClick={onEnterEdit} className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all hover:scale-110" title="Edit Profile">
            <Settings className="w-4 h-4 text-white/50 hover:text-white/80" />
          </button>
        )}
      </div>
    </div>
  );
}
