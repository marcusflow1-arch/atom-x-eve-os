import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { showSuccess, showError } from '@/components/error/ErrorToast';
import {
  DEFAULT_OPTIONS, deriveTimestamps, buildFramePrompt, buildAnalysisPrompt, ANALYSIS_SCHEMA,
  buildManifest, buildCsv, buildSummaryMd, makeZip, fetchBytes, formatTimestamp,
} from './avvShared';

function downloadBlob(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function useAttachmentValidator() {
  const [title, setTitle] = useState('');
  const [characterModel, setCharacterModel] = useState('');
  const [rigProfile, setRigProfile] = useState('Humanoid');
  const [prop, setProp] = useState('Sword');
  const [attachmentRule, setAttachmentRule] = useState('Right Hand');
  const [animationClip, setAnimationClip] = useState('');
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [modelOptions, setModelOptions] = useState([]);
  const [clipOptions, setClipOptions] = useState([]);
  const [session, setSession] = useState(null);
  const [frames, setFrames] = useState([]);
  const [exportsList, setExportsList] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState('');
  const [error, setError] = useState('');

  const addLog = useCallback((msg, level = 'info') => {
    setLogs((l) => [...l, { id: Date.now() + Math.random(), msg, level, time: new Date().toLocaleTimeString() }]);
  }, []);

  const loadPast = useCallback(async () => {
    try {
      const list = await base44.entities.AttachmentValidationSession.list('-created_date', 50);
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

  const persistExport = useCallback(async (sid, blob, name, type, frameCount = 0) => {
    try {
      const file = new File([blob], name, { type: blob.type });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const rec = await base44.entities.AttachmentValidationExport.create({
        validation_session_id: sid, export_type: type, file_url, label: name, frame_count: frameCount,
      });
      setExportsList((e) => [...e, rec]);
      return file_url;
    } catch (e) { addLog(`Upload failed (${name}): ${e?.message || e}`, 'warning'); return null; }
  }, [addLog]);

  const generatePackageFor = useCallback(async (sessionRec, frameRecs) => {
    const sid = sessionRec.id;
    addLog('Building fallback evidence package…');
    const enc = new TextEncoder();
    await persistExport(sid, new Blob([JSON.stringify(buildManifest(sessionRec, frameRecs), null, 2)], { type: 'application/json' }), 'manifest.json', 'json', frameRecs.length);
    await persistExport(sid, new Blob([buildCsv(frameRecs)], { type: 'text/csv' }), 'frame_index.csv', 'csv', frameRecs.length);
    await persistExport(sid, new Blob([buildSummaryMd(sessionRec, frameRecs)], { type: 'text/markdown' }), 'summary.md', 'md', frameRecs.length);
    try {
      addLog('Bundling ZIP evidence package…');
      const zipFiles = [
        { name: 'manifest.json', data: enc.encode(JSON.stringify(buildManifest(sessionRec, frameRecs), null, 2)) },
        { name: 'frame_index.csv', data: enc.encode(buildCsv(frameRecs)) },
        { name: 'summary.md', data: enc.encode(buildSummaryMd(sessionRec, frameRecs)) },
      ];
      for (const f of frameRecs) {
        if (f.image_url) { try { zipFiles.push({ name: `frames/${String(f.frame_index).padStart(4, '0')}.jpg`, data: await fetchBytes(f.image_url) }); } catch { /* skip */ } }
      }
      const zipBlob = await makeZip(zipFiles);
      const zipUrl = await persistExport(sid, zipBlob, `validation_package_${sid}.zip`, 'zip', frameRecs.length);
      if (zipUrl) {
        await base44.entities.AttachmentValidationSession.update(sid, { packaged: true, status: 'packaged' });
        setSession((s) => (s && s.id === sid ? { ...s, packaged: true, status: 'packaged' } : s));
      }
      addLog('Evidence package generated.', 'success');
    } catch (e) { addLog(`ZIP build failed: ${e?.message || e}`, 'warning'); }
    await loadPast();
  }, [addLog, loadPast, persistExport]);

  const runValidation = useCallback(async () => {
    setError('');
    if (!characterModel || !prop) { setError('Select a character model and a prop.'); showError('Select a model and a prop'); return null; }
    setBusy(true);
    setAction('validation');
    setLogs([]);
    addLog(`Starting validation: ${characterModel} · ${prop} · ${attachmentRule}`);
    let sessionId = null;
    try {
      const created = await base44.entities.AttachmentValidationSession.create({
        title: title || `${characterModel} · ${prop}`,
        character_model: characterModel,
        rig_profile_name: rigProfile,
        weapon_or_prop_name: prop,
        attachment_rule_name: attachmentRule,
        animation_clip_name: animationClip,
        status: 'processing',
        frame_sampling_mode: options.frame_sampling_mode,
        frame_interval_seconds: options.frame_interval_seconds,
        max_frames: options.max_frames,
        ai_issue_detection: options.ai_issue_detection,
        total_frames: 0,
        summary: '',
        packaged: false,
      });
      sessionId = created.id;
      setSession(created);

      const timestamps = deriveTimestamps(options);
      addLog(`Sampling ${timestamps.length} frames at ${options.frame_interval_seconds}s interval…`);
      const collected = [];
      for (let i = 0; i < timestamps.length; i++) {
        const t = timestamps[i];
        addLog(`Rendering frame ${i + 1}/${timestamps.length} @ ${t}s…`);
        let url = '';
        try {
          const r = await base44.integrations.Core.GenerateImage({ prompt: buildFramePrompt({ characterModel, rigProfile, prop, attachmentRule, animationClip }, t) });
          url = r.url;
        } catch (e) { addLog(`Frame ${i + 1} render failed: ${e?.message || e}`, 'warning'); }

        const frame = await base44.entities.AttachmentValidationFrame.create({
          validation_session_id: sessionId,
          frame_index: i,
          timestamp_seconds: t,
          image_url: url,
          thumbnail_url: url,
          visual_summary: '',
          alignment_notes: '',
          clipping_detected: false,
          drift_detected: false,
          occlusion_detected: false,
          admin_notes: '',
        });
        collected.push(frame);
        setFrames([...collected]);

        if (options.ai_issue_detection && url) {
          addLog(`Analyzing frame ${i + 1} for attachment issues…`);
          try {
            const res = await base44.integrations.Core.InvokeLLM({
              prompt: buildAnalysisPrompt(),
              file_urls: [url],
              model: 'gemini_3_flash',
              response_json_schema: ANALYSIS_SCHEMA,
            });
            const upd = await base44.entities.AttachmentValidationFrame.update(frame.id, {
              visual_summary: res.visual_summary || '',
              alignment_notes: res.alignment_notes || '',
              clipping_detected: !!res.clipping_detected,
              drift_detected: !!res.drift_detected,
              occlusion_detected: !!res.occlusion_detected,
            });
            collected[i] = upd;
            setFrames([...collected]);
            const flags = [];
            if (upd.clipping_detected) flags.push('clipping');
            if (upd.drift_detected) flags.push('drift');
            if (upd.occlusion_detected) flags.push('occlusion');
            if (flags.length) addLog(`Frame ${i + 1}: ${flags.join(', ')} detected`, 'warning');
            else addLog(`Frame ${i + 1}: alignment OK`);
          } catch (e) { addLog(`Frame ${i + 1} analysis failed: ${e?.message || e}`, 'warning'); }
        }
      }

      const clip = collected.filter((f) => f.clipping_detected).length;
      const drift = collected.filter((f) => f.drift_detected).length;
      const occl = collected.filter((f) => f.occlusion_detected).length;
      const lastT = timestamps[timestamps.length - 1] || 0;
      const summary = `${collected.length} frames sampled across ${formatTimestamp(lastT)}. Issues — clipping: ${clip}, drift: ${drift}, occlusion: ${occl}.`;
      const updated = await base44.entities.AttachmentValidationSession.update(sessionId, { total_frames: collected.length, summary, status: 'completed' });
      setSession(updated);
      addLog('Validation complete.', 'success');
      await loadPast();
      return { session: updated, frames: collected };
    } catch (e) {
      const msg = e?.message || String(e);
      setError(msg);
      addLog(`Validation failed: ${msg}`, 'error');
      showError(msg, 'Attachment Validator');
      if (sessionId) { try { await base44.entities.AttachmentValidationSession.update(sessionId, { status: 'failed' }); } catch { /* ignore */ } }
      return null;
    } finally {
      setBusy(false);
      setAction('');
    }
  }, [title, characterModel, rigProfile, prop, attachmentRule, animationClip, options, addLog, loadPast]);

  const generatePackage = useCallback(async () => {
    if (!session) { setError('Run a validation first.'); showError('Run a validation first'); return; }
    setError('');
    setBusy(true);
    setAction('package');
    try {
      await generatePackageFor(session, frames);
      showSuccess('Frame package generated');
    } catch (e) {
      const msg = e?.message || String(e);
      setError(msg);
      addLog(`Package failed: ${msg}`, 'error');
      showError(msg, 'Frame Package');
    } finally {
      setBusy(false);
      setAction('');
    }
  }, [session, frames, generatePackageFor, addLog]);

  const runValidationAndPackage = useCallback(async () => {
    const res = await runValidation();
    if (res) {
      setBusy(true);
      setAction('package');
      try { await generatePackageFor(res.session, res.frames); } finally { setBusy(false); setAction(''); }
    }
  }, [runValidation, generatePackageFor]);

  const updateFrame = useCallback(async (id, data) => {
    try {
      const upd = await base44.entities.AttachmentValidationFrame.update(id, data);
      setFrames((fs) => fs.map((f) => (f.id === id ? upd : f)));
      return upd;
    } catch (e) { showError(e?.message || String(e), 'Update frame'); return null; }
  }, []);

  const downloadZip = useCallback(async () => {
    if (!session) return;
    try {
      const enc = new TextEncoder();
      const zipFiles = [
        { name: 'manifest.json', data: enc.encode(JSON.stringify(buildManifest(session, frames), null, 2)) },
        { name: 'frame_index.csv', data: enc.encode(buildCsv(frames)) },
        { name: 'summary.md', data: enc.encode(buildSummaryMd(session, frames)) },
      ];
      for (const f of frames) {
        if (f.image_url) { try { zipFiles.push({ name: `frames/${String(f.frame_index).padStart(4, '0')}.jpg`, data: await fetchBytes(f.image_url) }); } catch { /* skip */ } }
      }
      const blob = await makeZip(zipFiles);
      downloadBlob(`validation_package_${session.id}.zip`, blob);
      await persistExport(session.id, blob, `validation_package_${session.id}.zip`, 'zip', frames.length);
      await base44.entities.AttachmentValidationSession.update(session.id, { packaged: true });
      showSuccess('ZIP package downloaded');
    } catch (e) { showError(e?.message || String(e), 'ZIP export'); }
  }, [session, frames, persistExport]);

  const downloadJson = useCallback(async () => {
    if (!session) return;
    const blob = new Blob([JSON.stringify(buildManifest(session, frames), null, 2)], { type: 'application/json' });
    downloadBlob('manifest.json', blob);
    await persistExport(session.id, blob, 'manifest.json', 'json', frames.length);
  }, [session, frames, persistExport]);

  const downloadCsv = useCallback(async () => {
    if (!session) return;
    const blob = new Blob([buildCsv(frames)], { type: 'text/csv' });
    downloadBlob('frame_index.csv', blob);
    await persistExport(session.id, blob, 'frame_index.csv', 'csv', frames.length);
  }, [session, frames, persistExport]);

  const downloadSummary = useCallback(async () => {
    if (!session) return;
    const blob = new Blob([buildSummaryMd(session, frames)], { type: 'text/markdown' });
    downloadBlob('summary.md', blob);
    await persistExport(session.id, blob, 'summary.md', 'md', frames.length);
  }, [session, frames, persistExport]);

  const reopen = useCallback(async (id) => {
    setError('');
    setBusy(true);
    setAction('reopen');
    try {
      const list = await base44.entities.AttachmentValidationSession.filter({ id });
      const s = list[0];
      if (!s) throw new Error('Session not found');
      const fr = await base44.entities.AttachmentValidationFrame.filter({ validation_session_id: id });
      fr.sort((a, b) => a.frame_index - b.frame_index);
      const ex = await base44.entities.AttachmentValidationExport.filter({ validation_session_id: id });
      setSession(s);
      setFrames(fr);
      setExportsList(ex);
      setTitle(s.title || '');
      setCharacterModel(s.character_model || '');
      setRigProfile(s.rig_profile_name || 'Humanoid');
      setProp(s.weapon_or_prop_name || '');
      setAttachmentRule(s.attachment_rule_name || '');
      setAnimationClip(s.animation_clip_name || '');
      setOptions({
        ...DEFAULT_OPTIONS,
        frame_sampling_mode: s.frame_sampling_mode || 'interval',
        frame_interval_seconds: s.frame_interval_seconds || 0.25,
        max_frames: s.max_frames || 8,
        ai_issue_detection: s.ai_issue_detection !== false,
      });
      addLog(`Reopened session "${s.title || 'Untitled'}"`, 'success');
    } catch (e) {
      setError(e?.message || String(e));
      showError(e?.message || String(e), 'Reopen');
    } finally {
      setBusy(false);
      setAction('');
    }
  }, [addLog]);

  const reset = useCallback(() => {
    setTitle(''); setCharacterModel(''); setRigProfile('Humanoid'); setProp('Sword');
    setAttachmentRule('Right Hand'); setAnimationClip('');
    setOptions(DEFAULT_OPTIONS);
    setSession(null); setFrames([]); setExportsList([]);
    setLogs([]); setError('');
  }, []);

  return {
    title, setTitle,
    characterModel, setCharacterModel,
    rigProfile, setRigProfile,
    prop, setProp,
    attachmentRule, setAttachmentRule,
    animationClip, setAnimationClip,
    options, setOptions,
    modelOptions, clipOptions,
    session, frames, exports: exportsList, pastSessions,
    logs, busy, action, error,
    runValidation, generatePackage, runValidationAndPackage,
    updateFrame, reopen, reset,
    downloadZip, downloadJson, downloadCsv, downloadSummary,
  };
}