import React from 'react';
import { GitCompare } from 'lucide-react';

function OffsetList({ o }) {
  return (
    <div className="text-xs text-slate-300 space-y-0.5">
      <div>position: [{o.posX}, {o.posY}, {o.posZ}]</div>
      <div>rotation: [{o.rotX}°, {o.rotY}°, {o.rotZ}°]</div>
      <div>scale: [{o.scaleX}, {o.scaleY}, {o.scaleZ}]</div>
      <div>off-hand pos: [{o.offPosX}, {o.offPosY}, {o.offPosZ}]</div>
      <div>off-hand rot: [{o.offRotX}°, {o.offRotY}°, {o.offRotZ}°]</div>
    </div>
  );
}

export default function ComparisonPanel({ beforeImage, afterImage, base, corrected, issueNotes, notes }) {
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-3"><GitCompare className="w-5 h-5 text-cyan-500" /> Before / After Comparison</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-400 mb-1">Before (base offsets)</div>
          <div className="aspect-video bg-slate-950 border border-slate-700 rounded-lg overflow-hidden flex items-center justify-center">
            {beforeImage ? <img src={beforeImage} alt="before" className="w-full h-full object-cover" /> : <span className="text-slate-600 text-sm">No before preview</span>}
          </div>
          <div className="mt-2"><OffsetList o={base} /></div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">After (corrected offsets)</div>
          <div className="aspect-video bg-slate-950 border border-slate-700 rounded-lg overflow-hidden flex items-center justify-center">
            {afterImage ? <img src={afterImage} alt="after" className="w-full h-full object-cover" /> : <span className="text-slate-600 text-sm">No after preview</span>}
          </div>
          <div className="mt-2"><OffsetList o={corrected} /></div>
        </div>
      </div>
      {(issueNotes || notes) && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {issueNotes && <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-3 text-sm text-slate-200"><div className="text-xs text-slate-400 mb-1">Issue notes</div>{issueNotes}</div>}
          {notes && <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-3 text-sm text-slate-200"><div className="text-xs text-slate-400 mb-1">Admin comments</div>{notes}</div>}
        </div>
      )}
    </section>
  );
}