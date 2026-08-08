import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Box, Swords, Clapperboard, Clock, AlertTriangle, Camera } from 'lucide-react';
import { formatTimestamp, STATUS_STYLES } from './avvShared';

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-4 h-4 text-slate-500 shrink-0" />
      <span className="text-slate-400">{label}:</span>
      <span className="text-slate-200 truncate">{value || '—'}</span>
    </div>
  );
}

export default function ValidationResultsPanel({ session, frames }) {
  if (!session) {
    return (
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-1">Validation Results</h2>
        <p className="text-slate-400 text-sm">Run a validation to see the session summary and issue breakdown here.</p>
      </section>
    );
  }
  const clip = frames.filter((f) => f.clipping_detected).length;
  const drift = frames.filter((f) => f.drift_detected).length;
  const occl = frames.filter((f) => f.occlusion_detected).length;
  const lastT = frames.length ? frames[frames.length - 1].timestamp_seconds : 0;
  const range = frames.length ? `0:00 – ${formatTimestamp(lastT)}` : '—';
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className="text-xl font-bold truncate">{session.title || 'Validation Session'}</h2>
        <Badge className={STATUS_STYLES[session.status] || 'bg-slate-500/20 text-slate-300'}>{session.status}</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        <Row icon={Box} label="Model" value={session.character_model} />
        <Row icon={Swords} label="Prop" value={session.weapon_or_prop_name} />
        <Row icon={Clapperboard} label="Animation" value={session.animation_clip_name} />
        <Row icon={Camera} label="Frames" value={session.total_frames || frames.length} />
        <Row icon={Clock} label="Timestamps covered" value={range} />
        <Row icon={AlertTriangle} label="Issues" value={`clip ${clip} · drift ${drift} · occl ${occl}`} />
      </div>
      {session.summary && (
        <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-3 text-sm text-slate-300">{session.summary}</div>
      )}
    </section>
  );
}