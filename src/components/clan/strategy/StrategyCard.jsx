import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function StrategyCard({ s }) {
  const media = s.media_urls?.[0];
  const voice = s.voice_urls || [];
  const isVideo = media && /\.(mp4|webm|ogg)$/i.test(media);
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="aspect-video bg-black/40 relative">
        {media ? (
          isVideo ? (
            <video src={media} className="w-full h-full object-cover" controls muted />
          ) : (
            <img src={media} alt={s.title} className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full grid place-items-center text-white/30 text-sm">No media</div>
        )}
        <div className="absolute top-2 left-2 flex gap-2">
          <Badge className="bg-cyan-500/20 text-cyan-300">Strategy</Badge>
          <Badge className="bg-white/10 text-white/70">{(s.visibility||'clan').toUpperCase()}</Badge>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div className="text-white font-semibold truncate">{s.title}</div>
        {s.summary && <div className="text-white/60 text-xs line-clamp-2">{s.summary}</div>}
        {s.steps?.length > 0 && (
          <ol className="list-decimal list-inside text-[12px] text-white/70 space-y-0.5">
            {s.steps.slice(0,5).map((st, i) => (<li key={i}>{st}</li>))}
            {s.steps.length > 5 && <li className="text-white/40">+{s.steps.length-5} more…</li>}
          </ol>
        )}
        {voice.length > 0 && (
          <div className="space-y-1">
            {voice.slice(0,2).map((v, i) => (
              <audio key={i} src={v} controls className="w-full" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}