import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Loader2, RefreshCcw, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const POLL_MS = 4500;
const MAX_POLLS = 90;

export default function GenesisFaceScan({ config, setConfig }) {
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
    if (pollRef.current) clearTimeout(pollRef.current);
  }, [preview]);

  const choosePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      setError('Use a JPEG, PNG, or WebP photo.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Use an image smaller than 20 MB.');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setError('');
    setStatus('Photo ready');
  };

  const finish = (payload) => {
    const modelUrl = payload?.model_url || payload?.record?.model_url;
    const modelId = payload?.id || payload?.record?.id || '';
    if (!modelUrl) return false;
    setConfig((current) => ({
      ...current,
      model_url: modelUrl,
      face_scan_generated: true,
      tripo_model_id: modelId,
    }));
    setStatus('Avatar generated and rigged for animation');
    setBusy(false);
    return true;
  };

  const poll = async (pipelineId, attempt = 0) => {
    if (attempt >= MAX_POLLS) {
      setBusy(false);
      setStatus('Generation is still processing. You can retry status later.');
      return;
    }
    try {
      const response = await base44.functions.invoke('generateTripoModel', {
        action: 'avatarPipelineStatus',
        pipelineId,
      });
      const data = response.data || {};
      if (finish(data)) return;
      if (data.error || data.status === 'failed') throw new Error(data.error || data.error_message || 'Avatar generation failed.');
      const stage = data.stage || data.record?.metadata?.pipeline_stage || 'processing';
      const progress = Number(data.progress || data.record?.progress || 0);
      setStatus(`${stage === 'generation' ? 'Building likeness' : stage === 'rig' ? 'Rigging avatar' : 'Processing'}${progress ? ` · ${Math.round(progress)}%` : '…'}`);
      pollRef.current = setTimeout(() => poll(pipelineId, attempt + 1), POLL_MS);
    } catch (err) {
      setBusy(false);
      setError(err.response?.data?.error || err.message || 'Could not finish avatar generation.');
    }
  };

  const generate = async () => {
    if (!photo || !consent || busy) return;
    setBusy(true);
    setError('');
    setStatus('Uploading reference photo…');
    try {
      const upload = await base44.integrations.Core.UploadFile({ file: photo });
      if (!upload?.file_url) throw new Error('Photo upload did not return a file URL.');
      setStatus('Starting 3D likeness generation…');
      const response = await base44.functions.invoke('generateTripoModel', {
        action: 'avatarPipelineStart',
        sourceImageUrl: upload.file_url,
        name: `${config.name || 'Atom Eve'} Face Avatar`,
        stylePreset: config.style_preset || 'heroic_fantasy',
      });
      const data = response.data || {};
      if (finish(data)) return;
      if (!data.pipelineId) throw new Error(data.error || 'Avatar pipeline could not start.');
      setStatus('Building 3D likeness…');
      poll(data.pipelineId, 0);
    } catch (err) {
      setBusy(false);
      setError(err.response?.data?.error || err.message || 'Could not start avatar generation.');
    }
  };

  const restoreBase = () => {
    setConfig((current) => ({ ...current, model_url: '', face_scan_generated: false, tripo_model_id: '' }));
    setStatus('Using the standard companion model');
  };

  return (
    <div className="genesis-face-scan">
      <div className="genesis-face-scan-head">
        <span className="genesis-face-icon"><Camera size={17} /></span>
        <div><strong>Use my face</strong><small>Turn one clear selfie into a rigged 3D companion base.</small></div>
        {config.face_scan_generated && <span className="genesis-generated-badge"><CheckCircle2 size={12} /> Active</span>}
      </div>

      <div className="genesis-face-grid">
        <label className="genesis-photo-drop">
          <input type="file" accept="image/jpeg,image/png,image/webp" capture="user" onChange={choosePhoto} disabled={busy} />
          {preview ? <img src={preview} alt="Selected avatar reference" /> : <><Upload size={20} /><span>Take or choose a selfie</span><small>Front-facing, even light, no heavy filters</small></>}
        </label>
        <div className="genesis-face-copy">
          <p><ShieldCheck size={14} /> Your photo is used to create the model and is not displayed as your public profile picture.</p>
          <p>The generated character is rigged to a Mixamo-compatible biped so Atom × Eve can reuse your movement, bow and dashboard animations.</p>
          <label className="genesis-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I consent to processing this photo to generate my 3D avatar.</span></label>
        </div>
      </div>

      <div className="genesis-face-actions">
        <button type="button" className="genesis-secondary" disabled={!photo || !consent || busy} onClick={generate}>{busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}{busy ? 'Creating avatar…' : 'Generate face avatar'}</button>
        {config.face_scan_generated && <button type="button" className="genesis-link" disabled={busy} onClick={restoreBase}><RefreshCcw size={12} /> Restore base model</button>}
      </div>
      {status && <p className="genesis-scan-status" role="status">{status}</p>}
      {error && <p className="genesis-error" role="alert">{error}</p>}
    </div>
  );
}
