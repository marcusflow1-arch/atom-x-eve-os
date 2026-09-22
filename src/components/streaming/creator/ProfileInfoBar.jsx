import { useRef, useState } from 'react';
import { CalendarDays, Camera, Gamepad2, Images, Loader2, Settings, Sparkles, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

const SECTIONS = [
  { id: 'schedule', label: 'Schedule', hint: 'Upcoming streams', icon: CalendarDays },
  { id: 'cards', label: 'Cards', hint: 'Achievement collection', icon: Sparkles },
  { id: 'gallery', label: 'Gallery', hint: 'Clips & moments', icon: Images },
  { id: 'games', label: 'Games', hint: 'Played & pinned', icon: Gamepad2 },
];

export default function ProfileInfoBar({ activeProfile, isEditMode, isLive, updateEditProfile, activeTab, setActiveTab, onEnterEdit }) {
  const displayName = activeProfile?.display_name || activeProfile?.full_name || 'My Channel';
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);
  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (!file_url) throw new Error('Upload unavailable');
      updateEditProfile('avatar_url', file_url);
    } catch {
      setUploadError('Your photo could not be uploaded. Please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  return <section className="channel-profile-bar channel-profile-v2" aria-label="Channel profile">
    <div className="channel-identity-row">
      <div className="channel-identity">
        <div className="channel-identity-avatar">
          {activeProfile?.avatar_url ? <img src={activeProfile.avatar_url} alt="" /> : <span>{displayName.charAt(0).toUpperCase()}</span>}
          {isEditMode && <><input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarUpload} /><button type="button" aria-label="Change channel photo" disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? <Loader2 size={22} className="animate-spin" /> : <Camera size={22} />}</button></>}
          {!isEditMode && <i className={isLive ? 'is-live' : ''} aria-label={isLive ? 'Live now' : 'Offline'} />}
        </div>
        <div className="channel-identity-copy">
          {isEditMode ? <div className="channel-identity-fields"><label>Channel name<Input value={activeProfile?.display_name || ''} onChange={(event) => updateEditProfile('display_name', event.target.value)} placeholder="Your channel name" /></label><label>Tagline<Input value={activeProfile?.tagline || ''} onChange={(event) => updateEditProfile('tagline', event.target.value)} placeholder="Give visitors a feel for your channel" /></label></div>
            : <><div className="channel-name-line"><h1>{displayName}</h1><span className={isLive ? 'channel-status is-live' : 'channel-status'}>{isLive ? 'LIVE NOW' : 'OFFLINE'}</span></div><p>{activeProfile?.tagline || 'Games, good company, and a community to call your own.'}</p></>}
        </div>
      </div>
      <div className="channel-identity-actions">
        <div className="channel-follower-stat"><Users size={16} /><strong>{Math.max(0, Number(activeProfile?.follower_count) || 0).toLocaleString()}</strong><span>followers</span></div>
        {!isEditMode && onEnterEdit && <button type="button" className="channel-edit-profile" onClick={onEnterEdit}><Settings size={16} /><span>Edit channel</span></button>}
      </div>
    </div>
    {uploadError && <p className="channel-upload-error" role="alert">{uploadError}</p>}
    <nav className="channel-section-nav" aria-label="Streamer profile sections">
      {SECTIONS.map(({ id, label, hint, icon: Icon }) => <button key={id} type="button" aria-pressed={activeTab === id} aria-expanded={id === 'schedule' ? undefined : activeTab === id} aria-controls={id === 'schedule' ? 'channel-page-schedule' : id === 'cards' && activeTab === id ? 'player-achievement-collection' : undefined} onClick={() => setActiveTab(activeTab === id ? null : id)}><Icon size={18} /><span><strong>{label}</strong><small>{hint}</small></span><span className="channel-nav-indicator" aria-hidden="true">↗</span></button>)}
    </nav>
  </section>;
}
