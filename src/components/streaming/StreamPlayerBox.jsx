import React from 'react';
import { Play, Pause, MessageSquare, WifiOff, Volume2, Settings, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function StreamPlayerBox({ isLive, onToggleLive, isPlaying, onTogglePlay, volume, onVolumeChange, onOpenSettings, settingsOpen, onCloseSettings, isSettingsMaximized, onToggleSettingsMaximize }) {
  const [featured, setFeatured] = React.useState([]);
  const [current, setCurrent] = React.useState(0);
  const [loadingFeatured, setLoadingFeatured] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    let timer;
    (async () => {
      try {
        const liveRes = await base44.entities.Stream.filter({ is_live: true }, '-started_at', 10);
        const live = liveRes?.data || liveRes || [];
        let items = live.map((s) => ({ id: s.id, title: s.title || 'Live Stream', image: s.preview_image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200', sub: s.viewer_count ? `${s.viewer_count} watching` : 'Live now', live: true }));
        if (items.length === 0) {
          const vidRes = await base44.entities.StreamVideo.list();
          const vids = vidRes?.data || vidRes || [];
          items = vids.slice(0, 10).map((v) => ({ id: v.id, title: v.title || 'Featured Video', image: v.thumbnail_url || 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=1200', sub: v.duration ? `${Math.round((v.duration || 0) / 60)} min` : 'Video', live: false }));
        }
        if (mounted) {
          const dayKey = new Date().toISOString().slice(0,10);
          let sum = 0; for (let i = 0; i < dayKey.length; i++) sum += dayKey.charCodeAt(i);
          const idx = items.length ? (sum % items.length) : 0;
          const pick = items.length ? items[idx] : null;
          setFeatured(pick ? [pick] : []);
          setCurrent(0);
          setLoadingFeatured(false);
        }
      } catch { if (mounted) setLoadingFeatured(false); }
    })();
    return () => { mounted = false; if (timer) clearInterval(timer); };
  }, []);

  return (
    <div
      data-stream-player-box="true"
      className="h-full min-h-[320px] relative group overflow-hidden rounded-2xl bg-[#090d14] shadow-[0_24px_70px_rgba(0,0,0,.48),0_8px_28px_rgba(0,0,0,.26)]"
    >
      <button
        onClick={() => (typeof onOpenSettings === 'function' ? onOpenSettings() : (typeof onToggleLive === 'function' ? onToggleLive() : null))}
        className="absolute top-3 left-3 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white/90 backdrop-blur-md hover:bg-black/80 transition shadow-lg"
        title="Go Live"
      >
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse mr-1" />
        <span className="text-[11px] font-bold uppercase tracking-wider">Go Live</span>
      </button>
      {settingsOpen && (
        <div className={isSettingsMaximized ? 'fixed inset-0 z-[200] flex flex-col' : 'absolute inset-0 z-30 flex flex-col'}>
          <div className="flex items-center justify-between px-4 py-3 bg-black/65">
            <div className="text-white font-bold">Stream Settings</div>
            <div className="flex items-center gap-2">
              <button onClick={onToggleSettingsMaximize} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title={isSettingsMaximized ? 'Restore' : 'Maximize'}>{isSettingsMaximized ? <Minimize className="w-4 h-4 text-white" /> : <Maximize className="w-4 h-4 text-white" />}</button>
              <span onClick={onCloseSettings} className="ml-1 text-white/70 hover:text-white cursor-pointer select-none text-lg leading-none" title="Close">x</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-black/70 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl p-4 bg-white/5"><h4 className="text-white font-semibold mb-3 text-sm">General</h4><div className="space-y-3 text-sm text-white/80"><label className="flex items-center justify-between"><span>Auto record</span><input type="checkbox" defaultChecked className="accent-cyan-400" /></label><label className="flex items-center justify-between"><span>Show chat overlay</span><input type="checkbox" className="accent-cyan-400" /></label></div></div>
              <div className="rounded-xl p-4 bg-white/5"><h4 className="text-white font-semibold mb-3 text-sm">Video</h4><div className="space-y-3 text-sm text-white/80"><label className="flex items-center justify-between gap-3"><span>Resolution</span><select className="bg-black/40 px-2 py-1 text-white/90"><option>1080p</option><option>720p</option><option>480p</option></select></label><label className="flex items-center justify-between gap-3"><span>Bitrate</span><select className="bg-black/40 px-2 py-1 text-white/90"><option>High</option><option>Medium</option><option>Low</option></select></label></div></div>
              <div className="rounded-xl p-4 bg-white/5"><h4 className="text-white font-semibold mb-3 text-sm">Audio</h4><div className="space-y-3 text-sm text-white/80"><label className="flex items-center justify-between"><span>Mic Enabled</span><input type="checkbox" defaultChecked className="accent-cyan-400" /></label><label className="flex items-center justify-between gap-3"><span>Audio Bitrate</span><select className="bg-black/40 px-2 py-1 text-white/90"><option>High</option><option>Medium</option><option>Low</option></select></label></div></div>
            </div>
            <div className="flex justify-end mt-4"><Button onClick={onToggleLive} className="bg-red-600 hover:bg-red-700 text-white border-none">Go Live</Button></div>
          </div>
        </div>
      )}
      {isLive ? (
        <div className="w-full h-full relative bg-black">
          <div className="absolute top-6 left-6"><div className="bg-red-600 px-3 py-1 rounded text-white text-xs font-bold uppercase animate-pulse shadow-lg shadow-red-600/20">LIVE</div></div>
          <div className="absolute top-6 right-6"><div className="bg-black/45 backdrop-blur-md px-3 py-1 rounded text-white text-xs font-medium flex items-center gap-2 shadow-lg"><MessageSquare className="w-3 h-3 text-white/60" />1.2k Viewers</div></div>
          <div className="absolute z-30 top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"><button onClick={onTogglePlay} className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center pointer-events-auto hover:bg-white/20 hover:scale-110 transition-all shadow-2xl" title={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}</button></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/80 to-transparent"><div className="mb-4"><h3 className="font-bold text-xl text-white drop-shadow-md">My Awesome Stream Title</h3><p className="text-sm text-cyan-400 font-medium">Playing: Valorant</p></div><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-4"><button onClick={onTogglePlay} className="text-white hover:text-cyan-400 transition-colors">{isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}</button><div className="flex items-center gap-2 group/vol"><Volume2 className="w-5 h-5 text-white" /><div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300"><div className="w-20 h-1 bg-white/30 rounded-full ml-2 relative cursor-pointer"><div className="absolute left-0 top-0 bottom-0 bg-white rounded-full" style={{ width: `${volume}%` }} /></div></div></div><div className="flex items-center gap-2 text-xs text-white/60 font-mono"><span className="text-red-500">●</span> 02:14:35</div></div><div className="flex items-center gap-4"><button className="text-white/70 hover:text-white transition-colors" title="Settings"><Settings className="w-5 h-5" /></button><button className="text-white/70 hover:text-white transition-colors" title="Fullscreen"><Maximize className="w-5 h-5" /></button></div></div></div>
        </div>
      ) : (
        <div className="w-full h-full relative">
          {loadingFeatured && featured.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin" /></div>
          ) : featured.length > 0 ? (
            <>
              <img src={featured[current]?.image} alt={featured[current]?.title || 'Featured'} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute top-4 left-4 flex items-center gap-2"><div className="px-3 py-1 rounded text-[10px] font-bold uppercase shadow bg-cyan-500/20 text-cyan-200">Game of the Day</div>{featured[current]?.live && <div className="px-3 py-1 rounded text-[10px] font-bold uppercase shadow bg-red-600 text-white">Live</div>}{featured[current]?.sub && <div className="px-3 py-1 rounded text-[10px] bg-black/50 text-white/80 backdrop-blur-md flex items-center gap-1 shadow"><MessageSquare className="w-3 h-3 text-white/60" />{featured[current].sub}</div>}</div>
              <div className="absolute inset-0 flex items-start justify-center pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"><button className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all shadow-2xl"><Play className="w-6 h-6 text-white" /></button></div>
              <div className="absolute bottom-0 left-0 right-0 p-6"><h3 className="text-white font-bold text-xl drop-shadow-md line-clamp-1">{featured[current]?.title}</h3><p className="text-sm text-white/60">{featured[current]?.live ? 'Happening now' : 'Recommended for you'}</p></div>
            </>
          ) : <div className="absolute inset-0 flex items-center justify-center text-white/50">No featured content available</div>}
        </div>
      )}
    </div>
  );
}
