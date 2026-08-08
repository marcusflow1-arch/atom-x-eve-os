import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { showSuccess, showError } from '@/components/error/ErrorToast';
import {
  DEFAULT_OPTIONS, MAX_FRAME_IMAGES, extractYouTubeId, youtubeThumb, deriveFrames,
  buildManifest, buildTimeline, buildTranscript, buildSummaryMd, buildCsvIndex,
  makeZip, fetchBytes, buildAnalysisPrompt, ANALYSIS_SCHEMA, buildFrameImagePrompt,
} from './viShared';

function downloadBlob(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const modelFor = (depth) => (depth === 'deep' ? 'gemini_3_1_pro' : 'gemini_3_flash');

export function useVideoIntelligence() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [analysis, setAnalysis] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [frames, setFrames] = useState([]);
  const [exportsList, setExportsList] = useState([]);
  const [pastAnalyses, setPastAnalyses] = useState([]);
  const [logs, setLogs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState('');
  const [error, setError] = useState('');

  const addLog = useCallback((msg, level = 'info') => {
    setLogs((l) => [...l, { id: Date.now() + Math.random(), msg, level, time: new Date().toLocaleTimeString() }]);
  }, []);

  const loadPast = useCallback(async () => {
    try {
      const list = await base44.entities.VideoAnalysis.list('-created_date', 50);
      setPastAnalyses(list || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadPast(); }, [loadPast]);

  const persistExport = async (analysisId, blob, name, exportType, frameCount = 0) => {
    try {
      const file = new File([blob], name, { type: blob.type });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const rec = await base44.entities.VideoExport.create({
        video_analysis_id: analysisId, export_type: exportType, file_url, label: name, frame_count: frameCount,
      });
      setExportsList((e) => [...e, rec]);
      return file_url;
    } catch (e) { addLog(`Upload failed (${name}): ${e?.message || e}`, 'warning'); return null; }
  };

  // Core: generate representative frame images + text artifacts + ZIP fallback package.
  const generatePackageFor = useCallback(async (analysisRec, sceneRecs, frameRecs) => {
    const analysisId = analysisRec.id;
    addLog('Generating representative frame images…');
    const cap = Math.min(sceneRecs.length, MAX_FRAME_IMAGES, options.max_frames || MAX_FRAME_IMAGES);
    const updatedScenes = [...sceneRecs];
    const updatedFrames = [...frameRecs];
    for (let i = 0; i < cap; i++) {
      const sc = updatedScenes[i];
      try {
        addLog(`Rendering representative frame for scene ${sc.scene_index}…`);
        const { url: imgUrl } = await base44.integrations.Core.GenerateImage({ prompt: buildFrameImagePrompt(sc) });
        await base44.entities.VideoScene.update(sc.id, { representative_frame_url: imgUrl });
        sc.representative_frame_url = imgUrl;
        const repFrame = updatedFrames.find((f) => f.scene_id === sc.id && f.is_representative)
          || updatedFrames.find((f) => f.scene_id === sc.id);
        if (repFrame) {
          await base44.entities.VideoFrame.update(repFrame.id, { image_url: imgUrl, thumbnail_url: imgUrl, is_representative: true });
          repFrame.image_url = imgUrl; repFrame.thumbnail_url = imgUrl; repFrame.is_representative = true;
        }
      } catch (e) { addLog(`Frame image failed for scene ${sc.scene_index}: ${e?.message || e}`, 'warning'); }
    }
    setScenes(updatedScenes);
    setFrames(updatedFrames);

    addLog('Building fallback text artifacts…');
    const newExports = [];
    const persist = (blob, name, exportType) => persistExport(analysisId, blob, name, exportType).then((u) => { if (u) newExports.push(name); });
    await persist(new Blob([JSON.stringify(buildManifest(analysisRec, updatedScenes, updatedFrames), null, 2)], { type: 'application/json' }), 'manifest.json', 'json');
    await persist(new Blob([JSON.stringify(buildTimeline(analysisRec, updatedScenes, updatedFrames), null, 2)], { type: 'application/json' }), 'timeline.json', 'json');
    await persist(new Blob([buildTranscript(analysisRec, updatedScenes)], { type: 'text/plain' }), 'transcript.txt', 'txt');
    await persist(new Blob([buildSummaryMd(analysisRec, updatedScenes)], { type: 'text/markdown' }), 'summary.md', 'md');
    await persist(new Blob([buildCsvIndex(updatedFrames)], { type: 'text/csv' }), 'frame_index.csv', 'csv');

    try {
      addLog('Bundling ZIP fallback package…');
      const enc = new TextEncoder();
      const zipFiles = [
        { name: 'manifest.json', data: enc.encode(JSON.stringify(buildManifest(analysisRec, updatedScenes, updatedFrames), null, 2)) },
        { name: 'timeline.json', data: enc.encode(JSON.stringify(buildTimeline(analysisRec, updatedScenes, updatedFrames), null, 2)) },
        { name: 'transcript.txt', data: enc.encode(buildTranscript(analysisRec, updatedScenes)) },
        { name: 'summary.md', data: enc.encode(buildSummaryMd(analysisRec, updatedScenes)) },
        { name: 'frame_index.csv', data: enc.encode(buildCsvIndex(updatedFrames)) },
      ];
      for (const f of updatedFrames) {
        if (f.image_url) {
          try { zipFiles.push({ name: `frames/${String(f.frame_index).padStart(4, '0')}.jpg`, data: await fetchBytes(f.image_url) }); } catch { /* skip */ }
        }
      }
      const zipBlob = await makeZip(zipFiles);
      const zipUrl = await persistExport(analysisId, zipBlob, `fallback_package_${analysisId}.zip`, 'zip', updatedFrames.length);
      if (zipUrl) {
        await base44.entities.VideoAnalysis.update(analysisId, { fallback_package_generated: true, fallback_package_url: zipUrl, status: 'packaged' });
        setAnalysis((a) => (a && a.id === analysisId ? { ...a, fallback_package_generated: true, fallback_package_url: zipUrl, status: 'packaged' } : a));
      }
      addLog('Fallback package generated.', 'success');
    } catch (e) { addLog(`ZIP build failed: ${e?.message || e}`, 'warning'); }

    await loadPast();
    return { scenes: updatedScenes, frames: updatedFrames };
  }, [options.max_frames, addLog, loadPast, persistExport]);

  // Method 1 — native structured analysis.
  const analyze = useCallback(async (opts = {}) => {
    setError('');
    const ytId = extractYouTubeId(url);
    if (!ytId) { setError('Please paste a valid YouTube URL.'); showError('Invalid YouTube URL'); return null; }
    setBusy(true);
    setAction('full');
    setLogs([]);
    addLog(`Validated YouTube URL (id: ${ytId})`);
    let analysisId = null;
    try {
      addLog('Creating analysis record…');
      const created = await base44.entities.VideoAnalysis.create({
        video_url: url,
        analysis_result: '',
        title: title || 'Analyzing…',
        source_type: 'youtube',
        status: 'processing',
        duration_seconds: 0,
        transcript_available: false,
        transcript_text: '',
        total_frames: 0, total_scenes: 0, total_segments: 0,
        analysis_depth: options.analysis_depth,
        sampling_mode: options.sampling_mode,
        sample_interval_seconds: options.sample_interval_seconds,
        max_frames: options.max_frames,
        include_transcript: options.include_transcript,
        run_ocr: options.run_ocr,
        detect_objects: options.detect_objects,
        auto_fallback_package: options.auto_fallback_package,
        fallback_package_generated: false,
        fallback_package_url: '',
        summary_markdown: '',
        tags: tags.split(',').map((s) => s.trim()).filter(Boolean),
        notes,
        cover_image_url: youtubeThumb(url),
      });
      analysisId = created.id;
      setAnalysis(created);

      addLog(`Requesting structured timeline analysis (depth: ${options.analysis_depth})…`);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: buildAnalysisPrompt(url, options),
        add_context_from_internet: true,
        model: modelFor(options.analysis_depth),
        response_json_schema: ANALYSIS_SCHEMA,
      });

      const sceneData = (result.scenes || []).map((s, i) => ({
        video_analysis_id: analysisId,
        scene_index: s.scene_index ?? i,
        start_time_seconds: s.start_time_seconds ?? 0,
        end_time_seconds: s.end_time_seconds ?? 0,
        representative_frame_url: '',
        scene_summary: s.scene_summary || '',
        transcript_excerpt: s.transcript_excerpt || '',
        detected_entities_json: JSON.stringify(s.detected_entities || []),
        detected_objects_json: JSON.stringify(s.detected_objects || []),
        ocr_text: s.ocr_text || '',
        importance_score: s.importance_score ?? 0,
        actions_json: JSON.stringify(s.actions || []),
        visual_description: s.visual_description || '',
      }));
      addLog(`Detected ${sceneData.length} scenes. Persisting…`);
      const createdScenes = sceneData.length ? await base44.entities.VideoScene.bulkCreate(sceneData) : [];
      setScenes(createdScenes);

      const duration = result.duration_seconds || (createdScenes.length ? createdScenes[createdScenes.length - 1].end_time_seconds : 0);
      const frameData = deriveFrames(createdScenes, options, duration).map((f) => ({ video_analysis_id: analysisId, ...f }));
      addLog(`Sampling ${frameData.length} frames (${options.sampling_mode})…`);
      if (frameData[0]) frameData[0].image_url = youtubeThumb(url);
      const createdFrames = frameData.length ? await base44.entities.VideoFrame.bulkCreate(frameData) : [];
      setFrames(createdFrames);

      const summaryMd = result.summary_markdown || '';
      const updated = await base44.entities.VideoAnalysis.update(analysisId, {
        title: title || result.title || 'Untitled Video',
        status: 'completed',
        duration_seconds: duration,
        transcript_available: !!result.transcript_available,
        transcript_text: result.transcript_text || '',
        total_frames: createdFrames.length,
        total_scenes: createdScenes.length,
        total_segments: createdScenes.length,
        summary_markdown: summaryMd,
        analysis_result: summaryMd,
      });
      setAnalysis(updated);
      addLog('Native structured analysis complete.', 'success');

      const res = { analysis: updated, scenes: createdScenes, frames: createdFrames };
      if (options.auto_fallback_package && !opts.skipAutoPackage) {
        addLog('Auto-generating fallback package…');
        const pkg = await generatePackageFor(updated, createdScenes, createdFrames);
        res.scenes = pkg.scenes; res.frames = pkg.frames;
      }
      await loadPast();
      return res;
    } catch (e) {
      const msg = e?.message || String(e);
      setError(msg);
      addLog(`Analysis failed: ${msg}`, 'error');
      showError(msg, 'Video Intelligence');
      if (analysisId) { try { await base44.entities.VideoAnalysis.update(analysisId, { status: 'failed' }); } catch { /* ignore */ } }
      return null;
    } finally {
      setBusy(false);
      setAction('');
    }
  }, [url, title, tags, notes, options, addLog, loadPast, generatePackageFor]);

  // Method 2 — fallback frame package (standalone).
  const generatePackage = useCallback(async () => {
    if (!analysis) { setError('Run an analysis first.'); showError('Analyze a video before packaging.'); return; }
    setError('');
    setBusy(true);
    setAction('package');
    try {
      const res = await generatePackageFor(analysis, scenes, frames);
      setScenes(res.scenes);
      setFrames(res.frames);
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
  }, [analysis, scenes, frames, generatePackageFor, addLog]);

  // Full pipeline = native analysis + fallback package.
  const runFullPipeline = useCallback(async () => {
    const res = await analyze({ skipAutoPackage: true });
    if (res) {
      setAction('package');
      setBusy(true);
      try { await generatePackageFor(res.analysis, res.scenes, res.frames); } finally { setBusy(false); setAction(''); }
    }
  }, [analyze, generatePackageFor]);

  // Export actions.
  const downloadZip = useCallback(async () => {
    if (!analysis) return;
    try {
      const enc = new TextEncoder();
      const zipFiles = [
        { name: 'manifest.json', data: enc.encode(JSON.stringify(buildManifest(analysis, scenes, frames), null, 2)) },
        { name: 'timeline.json', data: enc.encode(JSON.stringify(buildTimeline(analysis, scenes, frames), null, 2)) },
        { name: 'transcript.txt', data: enc.encode(buildTranscript(analysis, scenes)) },
        { name: 'summary.md', data: enc.encode(buildSummaryMd(analysis, scenes)) },
        { name: 'frame_index.csv', data: enc.encode(buildCsvIndex(frames)) },
      ];
      for (const f of frames) {
        if (f.image_url) { try { zipFiles.push({ name: `frames/${String(f.frame_index).padStart(4, '0')}.jpg`, data: await fetchBytes(f.image_url) }); } catch { /* skip */ } }
      }
      const blob = await makeZip(zipFiles);
      downloadBlob(`video_package_${analysis.id}.zip`, blob);
      await persistExport(analysis.id, blob, `video_package_${analysis.id}.zip`, 'zip', frames.length);
      await base44.entities.VideoAnalysis.update(analysis.id, { fallback_package_generated: true, fallback_package_url: '' });
      showSuccess('ZIP package downloaded');
    } catch (e) { showError(e?.message || String(e), 'ZIP export'); }
  }, [analysis, scenes, frames, persistExport]);

  const downloadJson = useCallback(async () => {
    if (!analysis) return;
    const blob = new Blob([JSON.stringify(buildManifest(analysis, scenes, frames), null, 2)], { type: 'application/json' });
    downloadBlob('manifest.json', blob);
    await persistExport(analysis.id, blob, 'manifest.json', 'json');
  }, [analysis, scenes, frames, persistExport]);

  const downloadCsv = useCallback(async () => {
    if (!analysis) return;
    const blob = new Blob([buildCsvIndex(frames)], { type: 'text/csv' });
    downloadBlob('frame_index.csv', blob);
    await persistExport(analysis.id, blob, 'frame_index.csv', 'csv');
  }, [analysis, frames, persistExport]);

  const downloadFrames = useCallback(async () => {
    if (!analysis) return;
    try {
      const zipFiles = [];
      for (const f of frames) {
        if (f.image_url) { try { zipFiles.push({ name: `frames/${String(f.frame_index).padStart(4, '0')}.jpg`, data: await fetchBytes(f.image_url) }); } catch { /* skip */ } }
      }
      const blob = await makeZip(zipFiles);
      downloadBlob(`frames_only_${analysis.id}.zip`, blob);
      await persistExport(analysis.id, blob, `frames_only_${analysis.id}.zip`, 'frames', frames.length);
      showSuccess('Frames ZIP downloaded');
    } catch (e) { showError(e?.message || String(e), 'Frames export'); }
  }, [analysis, frames, persistExport]);

  const copySummary = useCallback(async () => {
    if (!analysis) return;
    const text = analysis.summary_markdown || buildSummaryMd(analysis, scenes);
    try { await navigator.clipboard.writeText(text); showSuccess('Summary copied to clipboard'); }
    catch { showError('Clipboard unavailable'); }
  }, [analysis, scenes]);

  const saveRecord = useCallback(async () => {
    if (!analysis) return;
    try {
      await base44.entities.VideoAnalysis.update(analysis.id, {
        summary_markdown: analysis.summary_markdown || buildSummaryMd(analysis, scenes),
        total_frames: frames.length,
        total_scenes: scenes.length,
        total_segments: scenes.length,
      });
      showSuccess('Analysis record saved to database');
      await loadPast();
    } catch (e) { showError(e?.message || String(e), 'Save record'); }
  }, [analysis, scenes, frames, loadPast]);

  const reopen = useCallback(async (id) => {
    setError('');
    setBusy(true);
    setAction('reopen');
    try {
      const list = await base44.entities.VideoAnalysis.filter({ id });
      const a = list[0];
      if (!a) throw new Error('Analysis not found');
      const sc = await base44.entities.VideoScene.filter({ video_analysis_id: id });
      sc.sort((x, y) => x.scene_index - y.scene_index);
      const fr = await base44.entities.VideoFrame.filter({ video_analysis_id: id });
      fr.sort((x, y) => x.frame_index - y.frame_index);
      const ex = await base44.entities.VideoExport.filter({ video_analysis_id: id });
      setAnalysis(a);
      setScenes(sc);
      setFrames(fr);
      setExportsList(ex);
      setUrl(a.video_url);
      setTitle(a.title || '');
      setNotes(a.notes || '');
      setTags((a.tags || []).join(', '));
      setOptions({
        ...DEFAULT_OPTIONS,
        sampling_mode: a.sampling_mode || 'hybrid',
        sample_interval_seconds: a.sample_interval_seconds || 5,
        max_frames: a.max_frames || 24,
        analysis_depth: a.analysis_depth || 'medium',
        include_transcript: !!a.include_transcript,
        run_ocr: !!a.run_ocr,
        detect_objects: !!a.detect_objects,
        auto_fallback_package: !!a.auto_fallback_package,
        save_to_database: true,
      });
      addLog(`Reopened analysis "${a.title || 'Untitled'}"`, 'success');
    } catch (e) {
      setError(e?.message || String(e));
      showError(e?.message || String(e), 'Reopen');
    } finally {
      setBusy(false);
      setAction('');
    }
  }, [addLog]);

  const reset = useCallback(() => {
    setUrl(''); setTitle(''); setTags(''); setNotes('');
    setOptions(DEFAULT_OPTIONS);
    setAnalysis(null); setScenes([]); setFrames([]); setExportsList([]);
    setLogs([]); setError('');
  }, []);

  return {
    url, setUrl, title, setTitle, tags, setTags, notes, setNotes,
    options, setOptions,
    analysis, scenes, frames, exports: exportsList, pastAnalyses,
    logs, busy, action, error,
    analyze, generatePackage, runFullPipeline,
    reopen, reset,
    downloadZip, downloadJson, downloadCsv, downloadFrames, copySummary, saveRecord,
  };
}