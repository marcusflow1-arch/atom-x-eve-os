import { base44 } from '@/api/base44Client';

let stream = null;
let video = null;
let timer = null;
let busy = false;
let lastSignature = null;
let state = { active: false, analyzing: false, error: '', coachTip: '', sampleSeconds: 15 };
const listeners = new Set();

function emit(patch = {}) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => {
    try { listener(state); } catch {}
  });
}

export function getAvatarScreenObserverState() {
  return state;
}

export function subscribeAvatarScreenObserver(listener) {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

async function updateSettings(patch) {
  try {
    const response = await base44.functions.invoke('avatarMindCore', { action: 'updateSettings', payload: patch });
    return response?.data || response || {};
  } catch {
    return {};
  }
}

function makeSignature(canvas) {
  const tiny = document.createElement('canvas');
  tiny.width = 16; tiny.height = 9;
  const ctx = tiny.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, 16, 9);
  const pixels = ctx.getImageData(0, 0, 16, 9).data;
  const values = [];
  for (let i = 0; i < pixels.length; i += 16) values.push(Math.round((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3));
  return values;
}

function frameChanged(next) {
  const previous = lastSignature;
  lastSignature = next;
  if (!previous || previous.length !== next.length) return true;
  const diff = next.reduce((sum, value, index) => sum + Math.abs(value - previous[index]), 0) / next.length;
  return diff >= 5;
}

async function captureFrame() {
  if (!video || video.readyState < 2 || busy || !state.active) return;
  busy = true;
  emit({ analyzing: true });
  try {
    const maxWidth = 768;
    const ratio = video.videoWidth > 0 ? Math.min(1, maxWidth / video.videoWidth) : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(320, Math.round((video.videoWidth || 1280) * ratio));
    canvas.height = Math.max(180, Math.round((video.videoHeight || 720) * ratio));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (!frameChanged(makeSignature(canvas))) return;

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.68));
    if (!blob) return;
    const file = new File([blob], `avatar-observation-${Date.now()}.jpg`, { type: 'image/jpeg' });
    const uploaded = await base44.integrations.Core.UploadFile({ file });
    if (!uploaded?.file_url) return;
    const response = await base44.functions.invoke('avatarMindCore', {
      action: 'observeFrame',
      payload: {
        frame_url: uploaded.file_url,
        game_name: document.title || 'Shared game window',
        context: 'Opt-in sampled screen observation initiated by the player.',
        observed_at: new Date().toISOString(),
      },
    });
    const data = response?.data || response || {};
    if (data?.error) throw new Error(data.error);
    emit({ coachTip: data?.coach?.tip || state.coachTip, error: '' });
    window.dispatchEvent(new CustomEvent('atom:mind-updated', { detail: data }));
  } catch (error) {
    console.warn('Screen observation frame failed:', error);
    emit({ error: error?.message || 'A sampled frame could not be analyzed.' });
  } finally {
    busy = false;
    emit({ analyzing: false });
  }
}

export async function startAvatarScreenObserver({ sampleSeconds = 15 } = {}) {
  if (state.active) return state;
  if (!navigator.mediaDevices?.getDisplayMedia) {
    emit({ error: 'Screen observation is not supported by this browser.' });
    return state;
  }
  try {
    const nextStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 1, max: 2 } }, audio: false });
    const nextVideo = document.createElement('video');
    nextVideo.muted = true;
    nextVideo.playsInline = true;
    nextVideo.srcObject = nextStream;
    await nextVideo.play();
    stream = nextStream;
    video = nextVideo;
    lastSignature = null;
    const seconds = Math.max(8, Math.min(120, Number(sampleSeconds || 15)));
    emit({ active: true, error: '', sampleSeconds: seconds });
    await updateSettings({ screen_observation_enabled: true, screen_sample_seconds: seconds });
    window.setTimeout(captureFrame, 2500);
    timer = window.setInterval(captureFrame, seconds * 1000);
    const [track] = nextStream.getVideoTracks();
    if (track) track.addEventListener('ended', () => stopAvatarScreenObserver({ browserEnded: true }), { once: true });
    return state;
  } catch (error) {
    emit({ active: false, error: error?.name === 'NotAllowedError' ? 'Screen sharing was cancelled. Nothing was captured.' : (error?.message || 'Could not start screen observation.') });
    await updateSettings({ screen_observation_enabled: false });
    return state;
  }
}

export async function stopAvatarScreenObserver({ browserEnded = false } = {}) {
  window.clearInterval(timer);
  timer = null;
  const oldStream = stream;
  stream = null;
  if (!browserEnded) oldStream?.getTracks?.().forEach((track) => track.stop());
  if (video) {
    video.pause?.();
    video.srcObject = null;
  }
  video = null;
  lastSignature = null;
  busy = false;
  emit({ active: false, analyzing: false });
  await updateSettings({ screen_observation_enabled: false });
  return state;
}
