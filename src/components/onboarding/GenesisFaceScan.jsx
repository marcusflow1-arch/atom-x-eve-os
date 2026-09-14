import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, ExternalLink, Loader2, RefreshCcw, ScanFace, ShieldCheck, Upload, Video, VideoOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { COMPANION_MODELS } from '@/components/onboarding/genesisAssets';

const POLL_MS = 4500;
const MAX_POLLS = 90;
const CAPTURE_SIZE = 512;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the captured face image.'));
    reader.readAsDataURL(file);
  });
}

export default function GenesisFaceScan({ config, setConfig }) {
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(config.face_capture_preview_url || '');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [cameraBlockedByFrame, setCameraBlockedByFrame] = useState(false);
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
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
    if (pollRef.current) clearTimeout(pollRef.current);
  }, []);

  const startCamera = async () => {
    setError('');
    setCameraBlockedByFrame(false);
    setStatus('Requesting camera access…');
    try {
      if (!window.isSecureContext) throw new Error('Camera access requires the HTTPS version of Atom × Eve or localhost.');
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser does not expose camera capture. Try the latest Chrome or Edge.');
      const policy = document.permissionsPolicy || document.featurePolicy;
      if (policy?.allowsFeature && policy.allowsFeature('camera') === false) {
        setCameraBlockedByFrame(true);
        throw new Error('This embedded preview is blocking camera permission. Open the creator in its own tab and try again.');
      }

      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error('Camera preview is not mounted. Reload the creator and try again.');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await new Promise((resolve, reject) => {
        if (video.readyState >= 2 && video.videoWidth) return resolve();
        const timeout = window.setTimeout(() => reject(new Error('The camera opened but did not return a video frame.')), 6000);
        video.onloadedmetadata = () => { window.clearTimeout(timeout); resolve(); };
      });
      await video.play();
      setCameraOn(true);
      setStatus('Camera ready · center your face inside the guide, then capture it');
    } catch (err) {
      stopCamera();
      setStatus('');
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') setError('Camera permission was denied. Allow camera access for this site in your browser, then press Start PC camera again.');
      else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') setError('No PC camera was found. Connect or enable a webcam, then try again.');
      else if (name === 'NotReadableError' || name === 'TrackStartError') setError('The camera is already in use by another app or browser tab. Close it there and retry.');
      else setError(err?.message || 'Could not open the PC camera.');
    }
  };

  const applyInstantPreview = async (file) => {
    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);
    setConfig((current) => ({
      ...current,
      model_url: COMPANION_MODELS[current.gender || 'male']?.url || COMPANION_MODELS.male.url,
      base_body_gender: current.gender || 'male',
      base_body_model_url: COMPANION_MODELS[current.gender || 'male']?.url || COMPANION_MODELS.male.url,
      face_capture_preview_url: dataUrl,
      face_scan_generated: false,
      face_model_url: '',
      tripo_model_id: '',
    }));
    return dataUrl;
  };

  const usePhoto = async (file) => {
    setPhoto(file);
    setError('');
    await applyInstantPreview(file);
    setStatus('Camera likeness applied to the selected 3D avatar immediately · building the full 3D head is the next step');
  };

  const choosePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) return setError('Use a JPEG, PNG, or WebP photo.');
    if (file.size > 20 * 1024 * 1024) return setError('Use an image smaller than 20 MB.');
    try { await usePhoto(file); } catch (err) { setError(err?.message || 'Could not read that image.'); }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current || !video.videoWidth) return setError('The camera is not ready yet. Wait for the live video, then try again.');

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const crop = Math.min(vw * .62, vh * .86);
    const sx = (vw - crop) / 2;
    const sy = Math.max(0, (vh - crop) / 2 - crop * .03);
    canvas.width = CAPTURE_SIZE;
    canvas.height = CAPTURE_SIZE;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, CAPTURE_SIZE, CAPTURE_SIZE);
    context.save();
    context.translate(CAPTURE_SIZE, 0);
    context.scale(-1, 1);
    context.drawImage(video, sx, sy, crop, crop, 0, 0, CAPTURE_SIZE, CAPTURE_SIZE);
    context.restore();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.94));
    if (!blob) return setError('Could not capture a camera frame.');
    const file = new File([blob], `atom-eve-face-${Date.now()}.jpg`, { type: 'image/jpeg' });
    stopCamera();
    try {
      await usePhoto(file);
      if (consent) await generate(file);
    } catch (err) {
      setError(err?.message || 'Could not apply the camera capture.');
    }
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
    setStatus('3D head finished · your generated head is now attached to the selected AI avatar body');
    setBusy(false);
    return true;
  };

  const poll = async (pipelineId, attempt = 0) => {
    if (attempt >= MAX_POLLS) {
      setBusy(false);
      setStatus('Your instant camera likeness is still active. The higher-quality 3D head is still processing and can be retried later.');
      return;
    }
    try {
      const response = await base44.functions.invoke('generateTripoModel', { action: 'avatarPipelineStatus', pipelineId });
      const data = response.data || {};
      if (finish(data)) return;
      if (data.error || data.status === 'failed') throw new Error(data.error || data.error_message || '3D face generation failed.');
      const stage = data.stage || data.record?.metadata?.pipeline_stage || 'processing';
      const progress = Number(data.progress || data.record?.progress || 0);
      setStatus(`${stage === 'generation' ? 'Building 3D facial likeness' : stage === 'rig' ? 'Rigging the generated head to your avatar' : 'Processing 3D head'}${progress ? ` · ${Math.round(progress)}%` : '…'} · instant camera likeness remains visible`);
      pollRef.current = setTimeout(() => poll(pipelineId, attempt + 1), POLL_MS);
    } catch (err) {
      setBusy(false);
      setError(err.response?.data?.error || err.message || 'Could not finish the 3D face.');
      setStatus('The instant camera likeness is still applied to the avatar.');
    }
  };

  const generate = async (source = photo) => {
    if (!source || !consent || busy) return;
    setBusy(true);
    setError('');
    setStatus('Instant likeness applied · uploading the capture for the full 3D head…');
    try {
      const upload = await base44.integrations.Core.UploadFile({ file: source });
      if (!upload?.file_url) throw new Error('Face image upload did not return a file URL.');
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
      if (!data.pipelineId) throw new Error(data.error || 'The 3D face pipeline could not start.');
      setStatus('Building your 3D facial likeness… · the instant camera likeness stays on the avatar while this finishes');
      poll(data.pipelineId, 0);
    } catch (err) {
      setBusy(false);
      setError(err.response?.data?.error || err.message || 'Could not start the full 3D face generation.');
      setStatus('The instant camera likeness is still applied to the avatar.');
    }
  };

  const restoreBase = () => {
    stopCamera();
    setPhoto(null);
    setPreview('');
    setConfig((current) => ({
      ...current,
      model_url: COMPANION_MODELS[current.gender || 'male']?.url || COMPANION_MODELS.male.url,
      face_scan_generated: false,
      face_model_url: '',
      face_capture_preview_url: '',
      tripo_model_id: '',
      base_body_gender: current.gender || 'male',
      base_body_model_url: COMPANION_MODELS[current.gender || 'male']?.url || COMPANION_MODELS.male.url,
    }));
    setStatus(`Restored the standard ${config.gender || 'male'} character face`);
    setError('');
  };

  return (
    <div className="genesis-face-scan genesis-camera-scan">
      <div className="genesis-face-scan-head">
        <span className="genesis-face-icon"><ScanFace size={18} /></span>
        <div><strong>Face Recognition</strong><small>Use your PC camera. The capture appears on the selected 3D avatar immediately, then the full 3D head replaces it when generation finishes.</small></div>
        {(config.face_scan_generated || config.face_capture_preview_url) && <span className="genesis-generated-badge"><CheckCircle2 size={12} /> {config.face_scan_generated ? '3D head applied' : 'Camera face applied'}</span>}
      </div>

      <div className="genesis-camera-stage">
        <div className="genesis-camera-view">
          <video ref={videoRef} muted playsInline autoPlay className={cameraOn ? 'is-live' : 'is-hidden'} />
          {!cameraOn && preview && <img src={preview} alt="Captured face reference" />}
          {!cameraOn && !preview && <div className="genesis-camera-placeholder"><Camera size={28}/><strong>PC camera preview</strong><small>Your face appears here before it is applied to the 3D avatar.</small></div>}
          <div className="genesis-face-guide" aria-hidden="true"><span /><i /><b /></div>
        </div>
        <canvas ref={canvasRef} hidden />
        <div className="genesis-camera-copy">
          <p><ShieldCheck size={14}/> Camera access starts only after you press <strong>Start PC camera</strong> and approve the browser permission.</p>
          <p>Capture uses the face area inside the guide. The preview is applied to the currently selected Male/Female model immediately.</p>
          <label className="genesis-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I consent to processing this camera image to build and attach my 3D facial likeness.</span></label>
          {cameraBlockedByFrame && <button type="button" className="genesis-link genesis-open-camera-tab" onClick={() => window.open(window.location.href, '_blank', 'noopener,noreferrer')}><ExternalLink size={12}/> Open creator in its own tab for camera access</button>}
        </div>
      </div>

      <div className="genesis-face-actions genesis-camera-actions">
        {!cameraOn ? <button type="button" className="genesis-secondary" disabled={busy} onClick={startCamera}><Video size={14}/> Start PC camera</button> : <button type="button" className="genesis-secondary" disabled={busy} onClick={stopCamera}><VideoOff size={14}/> Stop camera</button>}
        {cameraOn && <button type="button" className="genesis-primary" disabled={!consent || busy} onClick={capturePhoto}>{busy ? <Loader2 size={14} className="animate-spin"/> : <ScanFace size={14}/>} Capture + build 3D head</button>}
        {!cameraOn && photo && !busy && !config.face_scan_generated && <button type="button" className="genesis-primary" disabled={!consent} onClick={() => generate()}><ScanFace size={14}/> Build full 3D head</button>}
        <label className="genesis-camera-upload"><Upload size={13}/><span>Upload face photo</span><input type="file" accept="image/jpeg,image/png,image/webp" capture="user" onChange={choosePhoto} disabled={busy}/></label>
        {(config.face_scan_generated || config.face_capture_preview_url) && <button type="button" className="genesis-link" disabled={busy} onClick={restoreBase}><RefreshCcw size={12}/> Restore default face</button>}
      </div>
      {status && <p className="genesis-scan-status" role="status">{status}</p>}
      {error && <p className="genesis-error" role="alert">{error}</p>}
    </div>
  );
}
