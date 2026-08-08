import React from 'react';
import { Wrench, Terminal, AlertCircle } from 'lucide-react';
import { useAttachmentCorrection } from './useAttachmentCorrection';
import CorrectionSetupPanel from './CorrectionSetupPanel';
import OffsetAdjustmentPanel from './OffsetAdjustmentPanel';
import ValidationPanel from './ValidationPanel';
import ComparisonPanel from './ComparisonPanel';
import PastCorrections from './PastCorrections';

export default function AttachmentCorrectionLab() {
  const v = useAttachmentCorrection();
  const previewImage = v.afterImage || v.beforeImage;
  return (
    <section className="space-y-6">
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Wrench className="w-6 h-6 text-cyan-500" /> Attachment Correction Lab
        </h2>
        <p className="text-slate-400 text-sm mt-2 max-w-3xl">
          The iteration layer for prop attachment and animation alignment. Load a setup, preview the result, adjust offsets live, re-validate, compare before/after, and commit approved corrections back as a base rule, animation override, or model override.
        </p>
      </div>

      {v.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-2 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {v.error}
        </div>
      )}

      <CorrectionSetupPanel
        title={v.title} setTitle={v.setTitle}
        characterModel={v.characterModel} setCharacterModel={v.setCharacterModel}
        rigProfile={v.rigProfile} setRigProfile={v.setRigProfile}
        prop={v.prop} setProp={v.setProp}
        attachmentRule={v.attachmentRule} setAttachmentRule={v.setAttachmentRule}
        animationClip={v.animationClip} setAnimationClip={v.setAnimationClip}
        modelOptions={v.modelOptions} clipOptions={v.clipOptions}
        previewImage={previewImage}
        onPreviewBefore={v.previewBefore} onPreviewAfter={v.previewAfter}
        busy={v.busy} action={v.action}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OffsetAdjustmentPanel
          base={v.base} corrected={v.corrected} setCorrected={v.setCorrected}
          onReset={v.resetToBase} onApply={v.previewAfter} onSetBase={v.setBaseFromCurrent}
          busy={v.busy} action={v.action}
        />
        <ValidationPanel
          correctionType={v.correctionType} setCorrectionType={v.setCorrectionType}
          correctionTypes={v.correctionTypes}
          notes={v.notes} setNotes={v.setNotes}
          approved={v.approved} setApproved={v.setApproved}
          issueNotes={v.issueNotes} keyframes={v.keyframes}
          onValidate={v.runQuickValidation} onCapture={v.captureKeyframes}
          onCompare={v.generateComparison} onSave={v.saveCorrection}
          busy={v.busy} action={v.action}
        />
      </div>

      {(v.busy || v.logs.length > 0) && (
        <div className="rounded-xl border border-slate-700 bg-black/60 font-mono text-sm overflow-hidden">
          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center gap-2 text-green-400">
            <Terminal className="w-4 h-4" />
            <span className="font-bold">Processing log</span>
            {v.busy && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse ml-2" />}
          </div>
          <div className="p-4 h-40 overflow-y-auto flex flex-col-reverse gap-1">
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

      <ComparisonPanel
        beforeImage={v.beforeImage} afterImage={v.afterImage}
        base={v.base} corrected={v.corrected}
        issueNotes={v.issueNotes} notes={v.notes}
      />
      <PastCorrections sessions={v.pastSessions} onReopen={v.reopen} onNew={v.reset} />
    </section>
  );
}