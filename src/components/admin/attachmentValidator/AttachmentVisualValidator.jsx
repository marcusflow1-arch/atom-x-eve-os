import React from 'react';
import { ScanSearch, Terminal, AlertCircle } from 'lucide-react';
import { useAttachmentValidator } from './useAttachmentValidator';
import ValidationSetupPanel from './ValidationSetupPanel';
import ValidationResultsPanel from './ValidationResultsPanel';
import FrameGallery from './FrameGallery';
import ExportSection from './ExportSection';
import PastSessions from './PastSessions';

export default function AttachmentVisualValidator() {
  const v = useAttachmentValidator();
  return (
    <section className="space-y-6">
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ScanSearch className="w-6 h-6 text-cyan-500" /> Attachment Visual Validator
        </h2>
        <p className="text-slate-400 text-sm mt-2 max-w-3xl">
          Visual QA for character attachments, prop placement, and animation alignment. This tool samples rendered frames across an animation clip, inspects each frame for misalignment, clipping, drift, and occlusion, and exports a downloadable evidence package for further review. It is for visual verification, not structural placement logic.
        </p>
      </div>

      {v.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-2 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {v.error}
        </div>
      )}

      <ValidationSetupPanel
        title={v.title} setTitle={v.setTitle}
        characterModel={v.characterModel} setCharacterModel={v.setCharacterModel}
        rigProfile={v.rigProfile} setRigProfile={v.setRigProfile}
        prop={v.prop} setProp={v.setProp}
        attachmentRule={v.attachmentRule} setAttachmentRule={v.setAttachmentRule}
        animationClip={v.animationClip} setAnimationClip={v.setAnimationClip}
        options={v.options} setOptions={v.setOptions}
        modelOptions={v.modelOptions} clipOptions={v.clipOptions}
        onRun={v.runValidation} onPackage={v.generatePackage} onFull={v.runValidationAndPackage}
        busy={v.busy} action={v.action} hasSession={!!v.session}
      />

      {(v.busy || v.logs.length > 0) && (
        <div className="rounded-xl border border-slate-700 bg-black/60 font-mono text-sm overflow-hidden">
          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center gap-2 text-green-400">
            <Terminal className="w-4 h-4" />
            <span className="font-bold">Processing log</span>
            {v.busy && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse ml-2" />}
          </div>
          <div className="p-4 h-44 overflow-y-auto flex flex-col-reverse gap-1">
            {v.logs.length === 0 && <div className="text-slate-600 italic">Waiting…</div>}
            {v.logs.map((l) => (
              <div key={l.id} className="flex gap-2">
                <span className="text-slate-600 text-xs">[{l.time}]</span>
                <span className={l.level === 'error' ? 'text-red-400' : l.level === 'success' ? 'text-green-400' : l.level === 'warning' ? 'text-yellow-400' : 'text-slate-300'}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ValidationResultsPanel session={v.session} frames={v.frames} />
      <FrameGallery frames={v.frames} onUpdate={v.updateFrame} />
      <ExportSection
        exports={v.exports}
        onDownloadZip={v.downloadZip} onDownloadJson={v.downloadJson}
        onDownloadCsv={v.downloadCsv} onDownloadSummary={v.downloadSummary}
        onPackage={v.generatePackage} busy={v.busy} action={v.action} hasSession={!!v.session}
      />
      <PastSessions sessions={v.pastSessions} onReopen={v.reopen} onNew={v.reset} />
    </section>
  );
}