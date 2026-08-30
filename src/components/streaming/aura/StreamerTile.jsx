import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Clock, MicOff, VideoOff, MessageCircle, Users, Play, X } from 'lucide-react';
import { formatViewers, formatUptime } from './streamerMockData';

export default function StreamerTile({ streamer, onClick }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const closePreview = (e) => { e?.stopPropagation(); setPreviewOpen(false); };
  return (
    <>
      <motion.button type="button" onClick={() => onClick?.(streamer)} onMouseEnter={() => setPreviewOpen(true)} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className="group w-full text-left">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 group-hover:border-cyan-400/50 transition-colors shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
          <img src={streamer.thumbnail} alt={streamer.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute top-2 left-2 flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold">LIVE</span><span className="px-1.5 py-0.5 rounded bg-black/70 text-white/90 text-[10px] inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {formatViewers(streamer.viewers)}</span></div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><span className="px-1.5 py-0.5 rounded bg-black/70 text-white/80 text-[10px] inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {formatUptime(streamer.uptimeMinutes)}</span></div>
        </div>
        <div className="flex items-start gap-2.5 mt-2.5"><img src={streamer.avatar} alt={streamer.name} className="w-8 h-8 rounded-full object-cover border border-white/15" /><div className="min-w-0"><p className="text-white font-bold text-sm truncate">{streamer.name}</p><p className="text-white/50 text-xs truncate">{streamer.title}</p><div className="flex flex-wrap gap-1 mt-1">{streamer.tags.slice(0, 2).map((t) => <span key={t} className="px-1.5 py-0.5 rounded-full bg-white/10 text-white/60 text-[9px] uppercase">{t}</span>)}</div></div></div>
      </motion.button>
      <AnimatePresence>
        {previewOpen && <motion.div className="fixed inset-0 z-[11000] flex items-center justify-center p-6 bg-black/35 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseLeave={closePreview} onClick={closePreview}>
          <motion.div initial={{ opacity: 0, scale: .96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96, y: 12 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-5xl overflow-hidden border border-white/15 bg-[#091018]/90 backdrop-blur-xl shadow-[0_30px_100px_rgba(0,0,0,.65)] rounded-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10"><div className="flex items-center gap-3"><img src={streamer.avatar} alt="" className="w-10 h-10 rounded-full" /><div><div className="font-bold text-white">{streamer.name}</div><div className="text-xs text-white/45">{streamer.game} · {formatViewers(streamer.viewers)} watching</div></div></div><button onClick={closePreview} className="p-2 text-white/50 hover:text-white"><X size={18} /></button></div>
            <div className="grid lg:grid-cols-[1.35fr_.65fr]"><div className="relative aspect-video bg-black overflow-hidden"><img src={streamer.thumbnail} alt="Live preview" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5"><div className="text-xs uppercase tracking-[.2em] text-red-300">Live preview</div><div className="mt-1 text-lg font-bold">{streamer.title}</div></div><div className="absolute inset-0 flex items-center justify-center"><div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center"><Play className="w-6 h-6 fill-white" /></div></div></div>
              <aside className="p-5 space-y-5"><div><div className="text-[10px] uppercase tracking-[.2em] text-white/35">About this streamer</div><p className="mt-2 text-sm text-white/75 leading-6">{streamer.title}. A quick look at this creator before you join the live stream.</p></div><div className="grid grid-cols-2 gap-2 text-xs"><div className="p-3 bg-white/5"><div className="text-white/35">Followers</div><div className="mt-1 font-bold">{formatViewers(streamer.followers)}</div></div><div className="p-3 bg-white/5"><div className="text-white/35">Live for</div><div className="mt-1 font-bold">{formatUptime(streamer.uptimeMinutes)}</div></div></div><div className="flex flex-wrap gap-2"><span className="px-2 py-1 text-[10px] bg-white/5 text-white/60 inline-flex gap-1 items-center">{streamer.isNoCommentary ? <MicOff size={12}/> : <MessageCircle size={12}/>} {streamer.isNoCommentary ? 'No commentary' : 'Talkative'}</span><span className="px-2 py-1 text-[10px] bg-white/5 text-white/60 inline-flex gap-1 items-center">{streamer.isNoCam ? <VideoOff size={12}/> : <Users size={12}/>} {streamer.isNoCam ? 'No camera' : 'Camera on'}</span><span className="px-2 py-1 text-[10px] bg-white/5 text-white/60">Personality: {streamer.personality}</span></div><div><div className="text-[10px] uppercase tracking-[.2em] text-white/35 mb-2">Highlights</div><div className="grid grid-cols-3 gap-2">{streamer.highlights.map((h) => <div key={h.title} className="relative aspect-video bg-white/5 overflow-hidden"><img src={h.image} alt="" className="w-full h-full object-cover" /><div className="absolute bottom-1 left-1 right-1 text-[9px] text-white truncate">{h.title}</div></div>)}</div></div><button onClick={() => onClick?.(streamer)} className="w-full py-3 bg-cyan-400/15 hover:bg-cyan-400/25 border border-cyan-300/30 text-cyan-100 font-bold text-sm transition">Join Stream</button></aside>
            </div>
          </motion.div>
        </motion.div>}
      </AnimatePresence>
    </>
  );
}
