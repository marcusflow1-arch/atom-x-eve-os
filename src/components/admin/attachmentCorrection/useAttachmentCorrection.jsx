import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { showSuccess, showError } from '@/components/error/ErrorToast';
import {
  DEFAULT_OFFSETS, CORRECTION_TYPES,
  toEntityBase, toEntityCorrected, fromEntityBase, fromEntityCorrected,
  buildPreviewPrompt, buildCorrectionManifest, buildNotesMd,
  makeZip, fetchBytes, ANALYSIS_SCHEMA, buildAnalysisPrompt,
} from './aclShared';

function downloadBlob(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function useAttachmentCorrection() {
  const [title, setTitle] = useState('');
  const [characterModel, setCharacterModel] = useState('');
  const [rigProfile, setRigProfile] = useState('Humanoid');
  const [prop, setProp] = useState('Sword');
  const [attachmentRule, setAttachmentRule] = useState('Right Hand');
  const [animationClip, setAnimationClip] = useState('');
  const [base, setBase] = useState({ ...DEFAULT_OFFSETS });
  const [corrected, setCorrected] = useState({ ...DEFAULT_OFFSETS });
  const [correctionType, setCorrectionType] = useState('base_rule');
  const [notes, setNotes] = useState('');
  const [approved, setApproved] = useState(false);

  const [beforeImage, setBeforeImage] = useState('');
  const [afterImage, setAfterImage] = useState('');
  const [issueNotes, setIssueNotes] = useState('');
  const [keyframes, setKeyframes] = useState([]);

  const [session, setSession] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [clipOptions, setClipOptions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState('');
  const [error, setError] = useState('');

  const addLog = useCallback((msg, level = 'info') => {
    setLogs((l) => [...l, { id: Date.now() + Math.random(), msg, level, time: new Date().toLocaleTimeString() }]);
  }, []);

  const loadPast = useCallback(async () => {
    try {
      const list = await base44.entities.AttachmentCorrectionSession.list('-created_date', 50);
      setPastSessions(list || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadPast();
    (async () => {
      try { const ms = await base44.entities.Model3D.list('-created_date', 100); setModelOptions(ms.map((m) => m.name).filter(Boolean)); } catch { /* ignore */ }
      try { const cs = await base44.entities.AnimationFBX.list('-created_date', 100); setClipOptions(cs.map((c) => c.name).filter(Boolean)); } catch { /* ignore */ }
    })();
  }, [loadPast]);

  const opts = { characterModel, rigProfile, prop, attachmentRule, animationClip };

  const persistArtifact = useCallback(async (sid, url, type, label) => {
    try {
      const rec = await base44.entities.AttachmentComparisonArtifact.create({
        correction_session_id: sid, artifact_type: type, file_url: url, label: label || type,
      });
      setArtifacts((a) => [...a, rec]);
      return rec;
    } catch (e) { addLog(`Artifact save failed: ${e?.message || e}`, 'warning'); return null; }
  }, [addLog]);

  const ensureSession = useCallback(async () => {
    if (session) return session.id;
    const created = await base44.entities.AttachmentCorrectionSession.create({
      title: title || `${characterModel} · ${prop}`,
      character_model: characterModel,
      rig_profile_name: rigProfile,
      prop_name: prop,
      attachment_rule_name: attachmentRule,
      animation_clip_name: animationClip,
      ...toEntityBase(base),
      ...toEntityCorrected(corrected),
      correction_type: correctionType,
      notes,
      approved: false,
      before_image_url: beforeImage,
      after_image_url: afterImage,
      issue_notes: issueNotes,
    });
    setSession(created);
    return created.id;
  }, [session, title, characterModel, rigProfile, prop, attachmentRule, animationClip, base, corrected, correctionType, notes, beforeImage, afterImage, issueNotes]);

  const previewBefore = useCallback(async () => {
    setError('');
    if (!characterModel || !prop) { setError('Select a character model and a prop.'); showError('Select a model and a prop'); return; }
    setBusy(true); setAction('preview-before'); addLog('Rendering BEFORE preview (base offsets)…');
    try {
      const r = await base44.integrations.Core.GenerateImage({ prompt: buildPreviewPrompt(opts, base, 'BEFORE — baseline offsets') });
      setBeforeImage(r.url);
      addLog('Before preview rendered.', 'success');
    } catch (e) { const msg = e?.message || String(e); setError(msg); addLog(`Before render failed: ${msg}`, 'error'); showError(msg, 'Preview'); }
    finally { setBusy(false); setAction(''); }
  }, [characterModel, prop, base, opts, addLog]);

  const previewAfter = useCallback(async () => {
    setError('');
    if (!characterModel || !prop) { setError('Select a character model and a prop.'); showError('Select a model and a prop'); return; }
    setBusy(true); setAction('preview-after'); addLog('Rendering AFTER preview (corrected offsets)…');
    try {
      const r = await base44.integrations.Core.GenerateImage({ prompt: buildPreviewPrompt(opts, corrected, 'AFTER — corrected offsets') });
      setAfterImage(r.url);
      addLog('After preview rendered.', 'success');
    } catch (e) { const msg = e?.message || String(e); setError(msg); addLog(`After render failed: ${msg}`, 'error'); showError(msg, 'Preview'); }
    finally { setBusy(false); setAction(''); }
  }, [characterModel, prop, corrected, opts, addLog]);

  const runQuickValidation = useCallback(async () => {
    setError('');
    if (!afterImage) { setError('Preview the corrected result first.'); showError('Preview the corrected result first'); return; }
    setBusy(true); setAction('validate'); addLog('Running quick validation on corrected preview…');
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildAnalysisPrompt(),
        file_urls: [afterImage],
        model: 'gemini_3_flash',
        response_json_schema: ANALYSIS_SCHEMA,
      });
      const flags = [];
      if (res.clipping_detected) flags.push('clipping');
      if (res.drift_detected) flags.push('drift');
      if (res.occlusion_detected) flags.push('occlusion');
      const text = `${res.visual_summary || ''} | ${res.alignment_notes || ''} | flags: ${flags.join(', ') || 'none'}`;
      setIssueNotes(text);
      addLog(`Validation: ${flags.length ? flags.join(', ') : 'alignment OK'}`, flags.length ? 'warning' : 'success');
    } catch (e) { const msg = e?.message || String(e); setError(msg); addLog(`Validation failed: ${msg}`, 'error'); showError(msg, 'Validation'); }
    finally { setBusy(false); setAction(''); }
  }, [afterImage, addLog]);

  const captureKeyframes = useCallback(async () => {
    setError('');
    if (!characterModel || !prop) { setError('Select a character model and a prop.'); showError('Select a model and a prop'); return; }
    setBusy(true); setAction('capture'); addLog('Capturing keyframes across the clip…');
    try {
      const sid = await ensureSession();
      const times = [0, 0.5, 1];
      const kfs = [];
      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        addLog(`Rendering keyframe ${i + 1}/${times.length} (t=${t})…`);
        const r = await base44.integrations.Core.GenerateImage({ prompt: buildPreviewPrompt(opts, corrected, `keyframe t=${t}`) });
        kfs.push(r.url);
        await persistArtifact(sid, r.url, 'keyframe', `keyframe_${t}`);
      }
      setKeyframes(kfs);
      addLog('Keyframes captured.', 'success');
    } catch (e) { const msg = e?.message || String(e); setError(msg); addLog(`Keyframes failed: ${msg}`, 'error'); showError(msg, 'Keyframes'); }
    finally { setBusy(false); setAction(''); }
  }, [characterModel, prop, corrected, opts, ensureSession, persistArtifact, addLog]);

  const generateComparison = useCallback(async () => {
    setError('');
    if (!beforeImage || !afterImage) { setError('Generate both before and after previews first.'); showError('Generate before & after previews first'); return; }
    setBusy(true); setAction('compare'); addLog('Generating before/after comparison package…');
    try {
      const sid = await ensureSession();
      const manifestSession = { ...session, title: title || `${characterModel} · ${prop}`, character_model: characterModel, rig_profile_name: rigProfile, prop_name: prop, attachment_rule_name: attachmentRule, animation_clip_name: animationClip, correction_type: correctionType, approved, notes, issue_notes: issueNotes };
      const manifest = buildCorrectionManifest(manifestSession, base, corrected);
      const notesMd = buildNotesMd(title || `${characterModel} · ${prop}`, base, corrected, issueNotes, notes);
      const enc = new TextEncoder();
      const zipFiles = [
        { name: 'before.jpg', data: await fetchBytes(beforeImage) },
        { name: 'after.jpg', data: await fetchBytes(afterImage) },
        { name: 'manifest.json', data: enc.encode(JSON.stringify(manifest, null, 2)) },
        { name: 'notes.md', data: enc.encode(notesMd) },
      ];
      for (let i = 0; i < keyframes.length; i++) {
        try { zipFiles.push({ name: `keyframes/keyframe_${i}.jpg`, data: await fetchBytes(keyframes[i]) }); } catch { /* skip */ }
      }
      const blob = await makeZip(zipFiles);
      const fname = `correction_comparison_${sid}.zip`;
      downloadBlob(fname, blob);
      const file = new File([blob], fname, { type: 'application/zip' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await persistArtifact(sid, file_url, 'comparison_export', 'comparison.zip');
      addLog('Comparison package generated.', 'success');
      showSuccess('Comparison package downloaded');
    } catch (e) { const msg = e?.message || String(e); setError(msg); addLog(`Comparison failed: ${msg}`, 'error'); showError(msg, 'Comparison'); }
    finally { setBusy(false); setAction(''); }
  }, [beforeImage, afterImage, keyframes, session, title, characterModel, rigProfile, prop, attachmentRule, animationClip, correctionType, approved, notes, issueNotes, base, corrected, ensureSession, persistArtifact, addLog]);

  const saveCorrection = useCallback(async () => {
    setError('');
    if (!characterModel || !prop) { setError('Select a character model and a prop.'); showError('Select a model and a prop'); return; }
    setBusy(true); setAction('save'); addLog(`Saving correction (${correctionType})…`);
    try {
      const payload = {
        title: title || `${characterModel} · ${prop}`,
        character_model: characterModel,
        rig_profile_name: rigProfile,
        prop_name: prop,
        attachment_rule_name: attachmentRule,
        animation_clip_name: animationClip,
        ...toEntityBase(base),
        ...toEntityCorrected(corrected),
        correction_type: correctionType,
        notes,
        approved,
        before_image_url: beforeImage,
        after_image_url: afterImage,
        issue_notes: issueNotes,
      };
      let rec;
      if (session) {
        rec = await base44.entities.AttachmentCorrectionSession.update(session.id, payload);
        setSession(rec);
      } else {
        rec = await base44.entities.AttachmentCorrectionSession.create(payload);
        setSession(rec);
        if (beforeImage) await persistArtifact(rec.id, beforeImage, 'before_image', 'before.jpg');
        if (afterImage) await persistArtifact(rec.id, afterImage, 'after_image', 'after.jpg');
      }
      addLog('Correction saved to history.', 'success');
      showSuccess('Correction saved');
      await loadPast();
    } catch (e) { const msg = e?.message || String(e); setError(msg); addLog(`Save failed: ${msg}`, 'error'); showError(msg, 'Save correction'); }
    finally { setBusy(false); setAction(''); }
  }, [characterModel, prop, title, rigProfile, attachmentRule, animationClip, base, corrected, correctionType, notes, approved, beforeImage, afterImage, issueNotes, session, persistArtifact, addLog, loadPast]);

  const resetToBase = useCallback(() => {
    setCorrected({ ...base });
    addLog('Corrected offsets reset to base values.');
  }, [base, addLog]);

  const setBaseFromCurrent = useCallback(() => {
    setBase({ ...corrected });
    addLog('Base offsets set from current corrected values.');
  }, [corrected, addLog]);

  const reopen = useCallback(async (id) => {
    setError(''); setBusy(true); setAction('reopen');
    try {
      const list = await base44.entities.AttachmentCorrectionSession.filter({ id });
      const s = list[0];
      if (!s) throw new Error('Session not found');
      const ar = await base44.entities.AttachmentComparisonArtifact.filter({ correction_session_id: id });
      setSession(s); setArtifacts(ar);
      setTitle(s.title || ''); setCharacterModel(s.character_model || ''); setRigProfile(s.rig_profile_name || 'Humanoid');
      setProp(s.prop_name || ''); setAttachmentRule(s.attachment_rule_name || ''); setAnimationClip(s.animation_clip_name || '');
      setBase(fromEntityBase(s)); setCorrected(fromEntityCorrected(s));
      setCorrectionType(s.correction_type || 'base_rule'); setNotes(s.notes || ''); setApproved(!!s.approved);
      setBeforeImage(s.before_image_url || ''); setAfterImage(s.after_image_url || ''); setIssueNotes(s.issue_notes || '');
      setKeyframes(ar.filter((a) => a.artifact_type === 'keyframe').map((a) => a.file_url));
      addLog(`Reopened correction "${s.title || 'Untitled'}"`, 'success');
    } catch (e) { setError(e?.message || String(e)); showError(e?.message || String(e), 'Reopen'); }
    finally { setBusy(false); setAction(''); }
  }, [addLog]);

  const reset = useCallback(() => {
    setTitle(''); setCharacterModel(''); setRigProfile('Humanoid'); setProp('Sword');
    setAttachmentRule('Right Hand'); setAnimationClip('');
    setBase({ ...DEFAULT_OFFSETS }); setCorrected({ ...DEFAULT_OFFSETS });
    setCorrectionType('base_rule'); setNotes(''); setApproved(false);
    setBeforeImage(''); setAfterImage(''); setIssueNotes(''); setKeyframes([]);
    setSession(null); setArtifacts([]); setLogs([]); setError('');
  }, []);

  return {
    title, setTitle,
    characterModel, setCharacterModel,
    rigProfile, setRigProfile,
    prop, setProp,
    attachmentRule, setAttachmentRule,
    animationClip, setAnimationClip,
    base, setBase, corrected, setCorrected,
    correctionType, setCorrectionType, notes, setNotes, approved, setApproved,
    beforeImage, afterImage, issueNotes, keyframes,
    session, artifacts, pastSessions, modelOptions, clipOptions,
    logs, busy, action, error,
    previewBefore, previewAfter, runQuickValidation, captureKeyframes,
    generateComparison, saveCorrection, resetToBase, setBaseFromCurrent,
    reopen, reset,
    correctionTypes: CORRECTION_TYPES,
  };
}