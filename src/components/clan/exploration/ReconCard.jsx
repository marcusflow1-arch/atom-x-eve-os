import React from 'react';
import { Badge } from '@/components/ui/badge';

const statusStyles = {
  scouted: 'bg-blue-500/20 text-blue-300',
  found: 'bg-emerald-500/20 text-emerald-300',
  cleared: 'bg-yellow-500/20 text-yellow-300',
};

export default function ReconCard({ intel }) {
  const media = intel.media_urls?.[0];
  const isVideo = media && /\.(mp4|webm|ogg)$/i.test(media);
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="aspect-video bg-black/40 relative">
        {media ? (
          isVideo ? (
            <video src={media} className="w-full h-full object-cover" controls muted />
          ) : (
            <img src={media} alt={intel.title} className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full grid place-items-center text-white/30 text-sm">No media</div>
        )}
        <div className="absolute top-2 left-2">
          <Badge className={`${statusStyles[intel.status] || 'bg-white/10 text-white/70'}`}>{intel.status}</Badge>
        </div>
      </div>
      <div className="p-3">
        <div className="text-white font-semibold truncate">{intel.title}</div>
        {intel.location && <div className="text-white/50 text-xs truncate">{intel.location}</div>}
        {intel.notes && <p className="text-white/60 text-xs mt-1 line-clamp-2">{intel.notes}</p>}
      </div>
    </div>
  );
}