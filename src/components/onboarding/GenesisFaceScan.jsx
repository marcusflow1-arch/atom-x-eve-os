import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Loader2, RefreshCcw, ScanFace, ShieldCheck, Upload, Video, VideoOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { COMPANION_MODELS } from '@/components/onboarding/genesisAssets';

const POLL_MS = 4500;
const MAX_POLLS = 90;

export default function GenesisFaceScan({ config, setConfig }) {
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const pollRef = useRef(null);

  const stopCamera = () => {
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  useEffect(() => () => {
    stopCamera();
    if (preview) URL.revokeObjectURL(preview);
    if (pollRef.current) clearTimeout(pollRef.current);
  }, [preview]);

  const startCamera = async () => {
    setError('');
    setStatus('Requesting camera access…');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser does not support camera capture.');
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('Camera ready · center your face and look at the lens');
    } catch (err) {
      setCameraOn(false);
      setStatus('');
      setError(err?.name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access in your browser, then try again.' : (err.message || 'Could not open the camera.'));
    }
  };

  const usePhoto = (file) => {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setError('');
    setStatus('Face image captured and ready');
  };

  const choosePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) return setError('Use a JPEG, PNG, or WebP photo.');
    if (file.size > 20 * 1024 * 1024) return setError('Use an image smaller than 20 MB.');
    usePhoto(file);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraOn || !video.videoWidth) return setError('The camera is not ready yet.');
    const width = Math.min(video.videoWidth, 1280);
    const height = Math.round((video.videoHeight / video.videoWidth) * width);
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.save();
    context.translate(width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, width, height);
    context.restore();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) return setError('Could not capture a camera frame.');
    const file = new File([blob], `atom-eve-face-${Date.now()}.jpg`, { type: 'image/jpeg' });
    usePhoto(file);
    stopCamera();
    if (consent) await generate(file);
  };

  const finish = (payload) => {
    const modelUrl = payload?.model_url || payload?.record?.model_url;
    const modelId = payload?.id || payload?.record?.id || '';
    if (!modelUrl) return false;
    setConfig((current) => ({
      ...current,
      model_url: COMPANION_MODELS[current.gender || 'male']?.url || COMPANION_MODELS.male.url,
      face_model_url: modelUrl,
      face_scan_generated: true,
      tripo_model_id: modelId,
      base_body_gender: current.gender || 'male',
      base_body_model_url: COMPANION_MODELS[current.gender || 'male']?.url || COMPANION_MODELS.male.url,
    }));
    setStatus('Face scan applied while keeping your selected body');
    setBusy(false);
    return true;
  };

  const poll = async (pipelineId, attempt = 0) => {
    if (attempt >= MAX_POLLS) {
      setBusy(false);
      setStatus('Face processing is still running. You can leave this screen and retry later.');
      return;
    }
    try {
      const response = await base44.functions.invoke('generateTripoModel', { action: 'avatarPipelineStatus', pipelineId });
      const data = response.data || {};
      if (finish(data)) return;
      if (data.error || data.status === 'failed') throw new Error(data.error || data.error_message || 'Face generation failed.');
      const stage = data.stage || data.record?.metadata?.pipeline_stage || 'processing';
      const progress = Number(data.progress || data.record?.progress || 0);
      setStatus(`${stage === 'generation' ? 'Building facial likeness' : stage === 'rig' ? 'Preparing animated face avatar' : 'Processing face'}${progress ? ` · ${Math.round(progress)}%` : '…'}`);
      pollRef.current = setTimeout(() => poll(pipelineId, attempt + 1), POLL_MS);
    } catch (err) {
      setBusy(false);
      setError(err.response?.data?.error || err.message || 'Could not finish face generation.');
    }
  };

  const generate = async (source = photo) => {
    if (!source || !consent || busy) return;
    setBusy(true);
    setError('');
    setStatus('Uploading camera capture…');
    try {
      const upload = await base44.integrations.Core.UploadFile({ file: source });
      if (!upload?.file_url) throw new Error('Face image upload did not return a file URL.');
      setStatus('Reading facial likeness and building the 3D face…');
      const response = await base44.functions.invoke('generateTripoModel', {
        action: 'avatarPipelineStart',
        sourceImageUrl: upload.file_url,
        name: `${config.name || 'Atom Eve'} Face Avatar`,
        stylePreset: config.style_preset || 'heroic_fantasy',
        gender: config.gender || 'male',
        baseBodyModelUrl: COMPANION_MODELS[config.gender || 'male']?.url || COMPANION_MODELS.male.url,
        faceOnlyIntent: true,
      });
      const data = response.data || {};
      if (finish(data)) return;
      if (!data.pipelineId) throw new Error(data.error || 'Face pipeline could not start.');
      setStatus('Building your facial likeness…');
      poll(data.pipelineId, 0);
    } catch (err) {
      setBusy(false);
      setError(err.response?.data?.error || err.message || 'Could not start face generation.');
    }
  };

  const restoreBase = () => {
    stopCamera();
    setConfig((current) => ({
      ...current,
      model_url: COMPANION_MODELS[current.gender || 'male']?.url || COMPANION_MODELS.male.url,
      face_scan_generated: false,
      face_model_url: '',
      tripo_model_id: '',
      base_body_gender: current.gender || 'male',
      base_body_model_url: COMPANION_MODELS[current.gender || 'male']?.url || COMPANION_MODELS.male.url,
    }));
    setStatus(`Restored the standard ${config.gender || 'male'} character face`);
  };

  return (
    <div className="genesis-face-scan genesis-camera-scan">
      <div className="genesis-face-scan-head">
        <span className="genesis-face-icon"><ScanFace size={18} /></span>
        <div><strong>Face Recognition</strong><small>Use your PC camera to capture your face and apply your likeness to the selected 3D character.</small></div>
        {config.face_scan_generated && <span className="genesis-generated-badge"><CheckCircle2 size={12} /> Applied</span>}
      </div>

      <div className="genesis-camera-stage">
        <div className="genesis-camera-view">
          {cameraOn ? <video ref={videoRef} muted playsInline autoPlay /> : preview ? <img src={preview} alt="Captured face reference" /> : <div className="genesis-camera-placeholder"><Camera size={28}/><strong>PC camera preview</strong><small>Your face stays centered here before capture.</small></div>}
          <div className="genesis-face-guide" aria-hidden="true"><span /><i /><b /></div>
        </div>
        <canvas ref={canvasRef} hidden />
        <div className="genesis-camera-copy">
          <p><ShieldCheck size={14}/> Camera access only starts when you press <strong>Start camera</strong>.</p>
          <p>Use even lighting, remove heavy filters, face the camera directly, and keep your full face inside the guide.</p>
          <label className="genesis-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I consent to processing this camera image to create my 3D facial likeness.</span></label>
        </div>
      </div>

      <div className="genesis-face-actions genesis-camera-actions">
        {!cameraOn ? <button type="button" className="genesis-secondary" disabled={busy} onClick={startCamera}><Video size={14}/> Start PC camera</button> : <button type="button" className="genesis-secondary" disabled={busy} onClick={stopCamera}><VideoOff size={14}/> Stop camera</button>}
        {cameraOn && <button type="button" className="genesis-primary" disabled={!consent || busy} onClick={capturePhoto}>{busy ? <Loader2 size={14} className="animate-spin"/> : <ScanFace size={14}/>} Capture & apply face</button>}
        {!cameraOn && photo && <button type="button" className="genesis-primary" disabled={!consent || busy} onClick={() => generate()}>{busy ? <Loader2 size={14} className="animate-spin"/> : <ScanFace size={14}/>} Apply captured face</button>}
        <label className="genesis-camera-upload"><Upload size={13}/><span>Upload photo instead</span><input type="file" accept="image/jpeg,image/png,image/webp" capture="user" onChange={choosePhoto} disabled={busy}/></label>
        {config.face_scan_generated && <button type="button" className="genesis-link" disabled={busy} onClick={restoreBase}><RefreshCcw size={12}/> Restore default face</button>}
      </div>
      {status && <p className="genesis-scan-status" role="status">{status}</p>}
      {error && <p className="genesis-error" role="alert">{error}</p>}
    </div>
  );
}
