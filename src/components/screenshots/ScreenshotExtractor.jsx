import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  CircleStop,
  Clock3,
  Download,
  FolderOpen,
  Gauge,
  Image as ImageIcon,
  Loader2,
  Play,
  RotateCcw,
  ShieldCheck,
  TimerReset,
  Upload,
  X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const MIME = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
const EXT = { jpeg: 'jpg', png: 'png', webp: 'webp' };
const MAX_FRAMES = 50000;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

function formatClock(seconds = 0) {
  const safe = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const ms = Math.floor((safe - Math.floor(safe)) * 1000);
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

function frameStamp(seconds = 0) {
  const safe = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const ms = Math.floor((safe - Math.floor(safe)) * 1000);
  return `${String(hours).padStart(2, '0')}-${String(minutes).padStart(2, '0')}-${String(secs).padStart(2, '0')}-${String(ms).padStart(3, '0')}`;
}

function cleanBaseName(name = 'video') {
  return String(name).replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') || 'video';
}

async function invokeJob(action, data = {}) {
  const response = await base44.functions.invoke('screenshotExtractionJob', { action, data });
  const body = response?.data ?? response ?? {};
  if (body?.error) throw new Error(body.error);
  return body;
}

async function waitUntilLoaded(video) {
  if (video.readyState >= 2) return;
  await new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('The browser could not decode this video.')), 15000);
    const done = () => { window.clearTimeout(timer); resolve(); };
    const fail = () => { window.clearTimeout(timer); reject(new Error('The video could not be decoded.')); };
    video.addEventListener('loadeddata', done, { once: true });
    video.addEventListener('error', fail, { once: true });
  });
}

async function seekToFrame(video, target) {
  const duration = Number(video.duration || 0);
  const safeTarget = clamp(Number(target) || 0, 0, Math.max(0, duration - 0.001));

  await new Promise((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => finish(new Error(`Timed out seeking to ${formatClock(safeTarget)}.`)), 12000);

    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };
    const finish = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const paint = () => {
      if (typeof video.requestVideoFrameCallback === 'function') {
        video.requestVideoFrameCallback(() => finish());
      } else {
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => finish()));
      }
    };
    const onSeeked = () => paint();
    const onError = () => finish(new Error('The browser could not decode a frame from this video.'));

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError, { once: true });

    if (Math.abs(Number(video.currentTime || 0) - safeTarget) < 0.0005) {
      const nudge = Math.min(Math.max(0.0001, safeTarget + 0.0001), Math.max(0.0001, duration - 0.001));
      video.currentTime = nudge;
    } else {
      video.currentTime = safeTarget;
    }
  });
}

function JobHistory({ jobs = [], loading }) {
  return (
    <section className="min-h-0 rounded-2xl border border-white/[0.065] bg-black/20 p-4 backdrop-blur-2xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.2em] text-white/42">Recent Jobs</div>
          <p className="mt-1 text-[9px] text-white/24">Metadata only · videos and frames stay local</p>
        </div>
        <ShieldCheck className="h-4 w-4 text-cyan-100/40" />
      </div>
      <div className="mt-4 space-y-2">
        {loading && <div className="py-8 text-center text-[9px] text-white/28">Loading history…</div>}
        {!loading && !jobs.length && <div className="py-8 text-center text-[9px] text-white/24">Completed extraction jobs will appear here.</div>}
        {jobs.slice(0, 8).map((job) => {
          const percent = Math.round((Number(job.completed_frames || 0) / Math.max(1, Number(job.expected_frames || 1))) * 100);
          return (
            <div key={job.id} className="rounded-xl border border-white/[0.055] bg-white/[0.018] px-3 py-2.5">
              <div className="flex items-start gap-2">
                <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/28" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[9px] font-semibold text-white/65">{job.file_name}</div>
                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[7px] uppercase tracking-[.1em] text-white/25">
                    <span>{job.interval_seconds}s</span><span>·</span><span>{job.completed_frames}/{job.expected_frames}</span><span>·</span><span>{job.format}</span>
                  </div>
                </div>
                <span className={`text-[7px] font-black uppercase tracking-[.11em] ${job.status === 'completed' ? 'text-emerald-300/65' : job.status === 'failed' ? 'text-red-300/65' : job.status === 'cancelled' ? 'text-amber-200/60' : 'text-cyan-200/60'}`}>{job.status}</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.04]"><div className="h-full rounded-full bg-cyan-200/35" style={{ width: `${clamp(percent, 0, 100)}%` }} /></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function ScreenshotExtractor() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cancelRef = useRef(false);
  const jobIdRef = useRef('');
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [interval, setIntervalSeconds] = useState(1);
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(0);
  const [format, setFormat] = useState('jpeg');
  const [quality, setQuality] = useState(0.92);
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [folderState, setFolderState] = useState('idle'); // idle | opening | verifying | ready | error
  const [outputMode, setOutputMode] = useState('downloads');
  const [status, setStatus] = useState('idle');
  const [completed, setCompleted] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState('');
  const [lastWritten, setLastWritten] = useState('');
  const supportsDirectoryPicker = typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
  const isSecurePage = typeof window !== 'undefined' ? window.isSecureContext : false;
  const isEmbeddedFrame = typeof window !== 'undefined' ? window.self !== window.top : false;
  const directFolderAccessAvailable = supportsDirectoryPicker && isSecurePage && !isEmbeddedFrame;

  const { data: recentJobs = [], isLoading: historyLoading } = useQuery({
    queryKey: ['screenshot-extraction-jobs'],
    queryFn: async () => (await invokeJob('list')).jobs || [],
    staleTime: 15000,
  });

  const normalizedInterval = clamp(Number(interval) || 1, 0.05, 3600);
  const safeEnd = duration ? clamp(Number(rangeEnd) || duration, 0, duration) : 0;
  const safeStart = duration ? clamp(Number(rangeStart) || 0, 0, safeEnd) : 0;
  const estimatedFrames = duration
    ? Math.min(MAX_FRAMES, Math.floor(Math.max(0, safeEnd - safeStart) / normalizedInterval + 1e-8) + 1)
    : 0;
  const progress = estimatedFrames ? clamp((completed / estimatedFrames) * 100, 0, 100) : 0;

  useEffect(() => {
    if (!file) {
      setVideoUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (status !== 'running') return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [status]);

  const reset = useCallback(() => {
    if (status === 'running') return;
    setFile(null);
    setDuration(0);
    setVideoSize({ width: 0, height: 0 });
    setIntervalSeconds(1);
    setRangeStart(0);
    setRangeEnd(0);
    setFormat('jpeg');
    setQuality(0.92);
    setCompleted(0);
    setCurrentTime(0);
    setError('');
    setLastWritten('');
    jobIdRef.current = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [status]);

  const onVideoFile = (nextFile) => {
    if (!nextFile) return;
    if (!nextFile.type?.startsWith('video/')) {
      setError('Choose a video file.');
      return;
    }
    if (status === 'running') return;
    setFile(nextFile);
    setDuration(0);
    setRangeStart(0);
    setRangeEnd(0);
    setCompleted(0);
    setCurrentTime(0);
    setError('');
    setLastWritten('');
  };

  const openStandaloneScreenshots = () => {
    try {
      const url = new URL('/Screenshots?folderAccess=1', window.location.origin).toString();
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        setError('Your browser blocked the new window. Allow pop-ups for Atom X Eve, then press Open Folder-Enabled Page again.');
        return false;
      }
      setError('Folder access opened in a new tab. Use the Screenshots page there to choose your video and output folder.');
      return true;
    } catch {
      setError('Could not open the folder-enabled Screenshots page. Open Atom X Eve in its own browser tab and try again.');
      return false;
    }
  };

  const ensureDirectoryPermission = async (handle) => {
    if (!handle) throw new Error('No folder is selected.');
    const descriptor = { mode: 'readwrite' };
    let permission = await handle.queryPermission?.(descriptor);
    if (permission !== 'granted') permission = await handle.requestPermission?.(descriptor);
    if (permission !== 'granted') throw new Error('Folder write permission was not granted.');
    return true;
  };

  const verifyDirectoryWrite = async (handle) => {
    await ensureDirectoryPermission(handle);
    const testName = `.atomxe-write-test-${Date.now()}.tmp`;
    const testHandle = await handle.getFileHandle(testName, { create: true });
    const writable = await testHandle.createWritable();
    await writable.write(new Blob(['Atom X Eve screenshot folder write test'], { type: 'text/plain' }));
    await writable.close();
    try { await handle.removeEntry?.(testName); } catch { /* harmless if the browser cannot remove it */ }
    return true;
  };

  const chooseFolder = async () => {
    setError('');

    if (isEmbeddedFrame) {
      openStandaloneScreenshots();
      return;
    }
    if (!isSecurePage) {
      setDirectoryHandle(null);
      setFolderState('error');
      setOutputMode('downloads');
      setError('Direct folder access requires the secure HTTPS version of Atom X Eve. Open this page from the published HTTPS app.');
      return;
    }
    if (!supportsDirectoryPicker) {
      setDirectoryHandle(null);
      setFolderState('error');
      setOutputMode('downloads');
      setError('This browser does not support selecting a writable folder. Use desktop Chrome, Edge, or another Chromium browser, or use Browser Downloads.');
      return;
    }

    setFolderState('opening');
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setFolderState('verifying');
      await verifyDirectoryWrite(handle);
      setDirectoryHandle(handle);
      setOutputMode('folder');
      setFolderState('ready');
      setError('');
    } catch (folderError) {
      if (folderError?.name === 'AbortError') {
        setFolderState(directoryHandle ? 'ready' : 'idle');
        return;
      }
      setDirectoryHandle(null);
      setOutputMode('downloads');
      setFolderState('error');
      const message = folderError?.name === 'SecurityError'
        ? 'The browser blocked folder access from this embedded page. Open the Screenshots tool in its own tab, then choose the folder there.'
        : (folderError?.message || 'Could not open or write to that folder.');
      setError(message);
    }
  };

  const writeBlob = async (blob, filename) => {
    if (outputMode === 'folder' && directoryHandle) {
      await ensureDirectoryPermission(directoryHandle);
      const handle = await directoryHandle.getFileHandle(filename, { create: true });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);
    await sleep(35);
  };

  const stop = () => {
    cancelRef.current = true;
  };

  const startExtraction = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!file || !video || !canvas || !duration) return;
    if (status === 'running') return;

    const start = safeStart;
    const end = Math.min(safeEnd, Math.max(0, duration - 0.001));
    const step = normalizedInterval;
    const count = Math.floor(Math.max(0, end - start) / step + 1e-8) + 1;
    if (count > MAX_FRAMES) {
      setError(`This request would create more than ${MAX_FRAMES.toLocaleString()} frames. Increase the interval or shorten the range.`);
      return;
    }
    if (outputMode === 'folder' && !directoryHandle) {
      setError('Choose an output folder, or switch to browser downloads.');
      return;
    }
    if (outputMode === 'folder' && directoryHandle) {
      try {
        await ensureDirectoryPermission(directoryHandle);
      } catch (permissionError) {
        setFolderState('error');
        setError(permissionError?.message || 'The selected folder is no longer writable. Choose it again.');
        return;
      }
    }

    cancelRef.current = false;
    setStatus('running');
    setCompleted(0);
    setCurrentTime(start);
    setError('');
    setLastWritten('');

    let jobId = '';
    let writtenCount = 0;
    try {
      await waitUntilLoaded(video);
      const width = Number(video.videoWidth || videoSize.width || 0);
      const height = Number(video.videoHeight || videoSize.height || 0);
      if (!width || !height) throw new Error('The browser could not determine this video’s frame size.');

      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
      if (!context) throw new Error('Canvas rendering is not available in this browser.');

      const started = await invokeJob('start', {
        file_name: file.name,
        file_size: file.size,
        video_duration: duration,
        interval_seconds: step,
        start_seconds: start,
        end_seconds: end,
        format,
        quality,
        expected_frames: count,
        output_mode: outputMode,
        output_folder_name: directoryHandle?.name || '',
      });
      jobId = started.job?.id || '';
      jobIdRef.current = jobId;

      const base = cleanBaseName(file.name);
      for (let index = 0; index < count; index += 1) {
        if (cancelRef.current) break;
        const target = Math.min(end, start + index * step);
        setCurrentTime(target);
        await seekToFrame(video, target);
        context.drawImage(video, 0, 0, width, height);

        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob((value) => value ? resolve(value) : reject(new Error('The browser could not encode this frame.')), MIME[format], format === 'png' ? undefined : quality);
        });

        const filename = `${base}_frame_${String(index + 1).padStart(6, '0')}_${frameStamp(target)}.${EXT[format]}`;
        await writeBlob(blob, filename);
        const done = index + 1;
        writtenCount = done;
        setCompleted(done);
        setLastWritten(filename);

        if (jobId && (done === count || done % 25 === 0)) {
          invokeJob('progress', { job_id: jobId, completed_frames: done }).catch(() => {});
        }
        await sleep(0);
      }

      if (cancelRef.current) {
        setStatus('cancelled');
        if (jobId) await invokeJob('cancel', { job_id: jobId, completed_frames: writtenCount, output_folder_name: directoryHandle?.name || '' }).catch(() => {});
      } else {
        setStatus('completed');
        if (jobId) await invokeJob('complete', { job_id: jobId, completed_frames: count, output_folder_name: directoryHandle?.name || '' }).catch(() => {});
      }
    } catch (runError) {
      setStatus('failed');
      setError(runError?.message || 'Screenshot extraction failed.');
      if (jobId) {
        await invokeJob('fail', {
          job_id: jobId,
          completed_frames: writtenCount,
          error_message: runError?.message || 'Screenshot extraction failed.',
        }).catch(() => {});
      }
    } finally {
      queryClient.invalidateQueries({ queryKey: ['screenshot-extraction-jobs'] });
    }
  };

  const statusLabel = status === 'running' ? 'Extracting frames' : status === 'completed' ? 'Complete' : status === 'cancelled' ? 'Stopped' : status === 'failed' ? 'Failed' : 'Ready';

  return (
    <div className="h-screen w-full overflow-hidden pb-12 pt-16 text-white">
      <div className="mx-auto grid h-full max-w-[1680px] grid-cols-1 gap-4 overflow-y-auto px-5 py-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:overflow-hidden">
        <main className="min-h-0 overflow-y-auto rounded-[22px] border border-white/[0.065] bg-[linear-gradient(145deg,rgba(10,18,29,.62),rgba(5,11,19,.38))] p-5 shadow-[0_28px_80px_rgba(0,0,0,.22)] backdrop-blur-2xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.24em] text-cyan-100/42"><ImageIcon className="h-3.5 w-3.5" />Local Media Utility</div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white/92">Video → Screenshots</h1>
              <p className="mt-1 max-w-2xl text-[10px] leading-5 text-white/32">Extract frames locally and write each image to disk before the next frame is created. The video and screenshots are never converted to base64 or uploaded to Atom X Eve.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-200/[0.10] bg-emerald-200/[0.035] px-3 py-2 text-[8px] font-bold uppercase tracking-[.13em] text-emerald-200/60"><ShieldCheck className="h-3.5 w-3.5" />Local processing</div>
          </header>

          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
            <section className="min-h-[390px] overflow-hidden rounded-2xl border border-white/[0.06] bg-black/28">
              {videoUrl ? (
                <div className="flex h-full min-h-[390px] flex-col">
                  <div className="relative min-h-0 flex-1 bg-black/35">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      controls
                      preload="auto"
                      className="h-full max-h-[520px] min-h-[300px] w-full object-contain"
                      onLoadedMetadata={(event) => {
                        const nextDuration = Number(event.currentTarget.duration || 0);
                        setDuration(nextDuration);
                        setRangeStart(0);
                        setRangeEnd(nextDuration);
                        setVideoSize({ width: event.currentTarget.videoWidth || 0, height: event.currentTarget.videoHeight || 0 });
                      }}
                      onError={() => setError('This browser could not decode the selected video.')}
                    />
                    {status === 'running' && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.055] px-4 py-3">
                    <div className="min-w-0"><div className="max-w-[420px] truncate text-[10px] font-semibold text-white/68">{file?.name}</div><div className="mt-1 text-[8px] text-white/27">{formatClock(duration)} · {videoSize.width || '—'}×{videoSize.height || '—'} · {(Number(file?.size || 0) / 1024 / 1024).toFixed(1)} MB</div></div>
                    <button type="button" disabled={status === 'running'} onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[8px] font-bold uppercase tracking-[.11em] text-white/48 hover:bg-white/[0.055] disabled:opacity-35">Replace video</button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }}
                  onDrop={(event) => { event.preventDefault(); onVideoFile(event.dataTransfer.files?.[0]); }}
                  className="grid h-full min-h-[390px] w-full place-items-center p-10 text-center transition hover:bg-white/[0.018]"
                >
                  <div>
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-cyan-200/[0.10] bg-cyan-200/[0.035] shadow-[0_0_34px_rgba(103,232,249,.05)]"><Upload className="h-6 w-6 text-cyan-100/48" /></div>
                    <div className="mt-4 text-sm font-bold text-white/72">Choose or drop a video</div>
                    <div className="mt-2 text-[9px] leading-5 text-white/28">The file stays on this device. Nothing is uploaded.</div>
                  </div>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={(event) => onVideoFile(event.target.files?.[0])} />
              <canvas ref={canvasRef} className="hidden" />
            </section>

            <section className="rounded-2xl border border-white/[0.06] bg-black/18 p-4">
              <div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-cyan-100/45" /><div><div className="text-[9px] font-black uppercase tracking-[.18em] text-white/55">Extraction Settings</div><div className="mt-0.5 text-[8px] text-white/24">Configure when each frame is captured.</div></div></div>

              <div className="mt-5">
                <label className="text-[8px] font-bold uppercase tracking-[.14em] text-white/32">Capture every</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[0.5, 1, 2, 5, 10].map((value) => <button key={value} type="button" disabled={status === 'running'} onClick={() => setIntervalSeconds(value)} className={`rounded-lg px-3 py-2 text-[9px] font-bold transition ${Number(interval) === value ? 'bg-cyan-200 text-slate-950' : 'border border-white/[0.07] bg-white/[0.025] text-white/48 hover:bg-white/[0.055]'} disabled:opacity-35`}>{value}s</button>)}
                  <div className="flex items-center gap-1 rounded-lg border border-white/[0.07] bg-black/20 px-2"><input aria-label="Custom screenshot interval in seconds" type="number" min="0.05" max="3600" step="0.05" disabled={status === 'running'} value={interval} onChange={(event) => setIntervalSeconds(event.target.value)} className="w-16 bg-transparent py-2 text-right text-[9px] font-bold text-white/65 outline-none" /><span className="text-[8px] text-white/25">sec</span></div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <label className="text-[8px] font-bold uppercase tracking-[.12em] text-white/30">Start seconds<input type="number" min="0" max={duration || undefined} step="0.1" disabled={!duration || status === 'running'} value={rangeStart} onChange={(event) => setRangeStart(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-white/[0.07] bg-black/22 px-3 text-[10px] text-white/65 outline-none focus:border-cyan-200/25" /></label>
                <label className="text-[8px] font-bold uppercase tracking-[.12em] text-white/30">End seconds<input type="number" min="0" max={duration || undefined} step="0.1" disabled={!duration || status === 'running'} value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-white/[0.07] bg-black/22 px-3 text-[10px] text-white/65 outline-none focus:border-cyan-200/25" /></label>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <label className="text-[8px] font-bold uppercase tracking-[.12em] text-white/30">Image format<select disabled={status === 'running'} value={format} onChange={(event) => setFormat(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-white/[0.07] bg-[#09121e] px-3 text-[10px] text-white/65 outline-none"><option value="jpeg">JPEG</option><option value="png">PNG</option><option value="webp">WebP</option></select></label>
                <label className="text-[8px] font-bold uppercase tracking-[.12em] text-white/30">Quality <span className="text-white/18">{format === 'png' ? 'lossless' : Math.round(quality * 100) + '%'}</span><input type="range" min="0.5" max="1" step="0.01" disabled={status === 'running' || format === 'png'} value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="mt-3 w-full accent-cyan-200 disabled:opacity-25" /></label>
              </div>

              <div className="mt-5 border-t border-white/[0.055] pt-4">
                <div className="flex items-center justify-between gap-3"><div><div className="text-[8px] font-bold uppercase tracking-[.14em] text-white/32">Output destination</div><div className="mt-1 max-w-[250px] truncate text-[9px] text-white/52">{outputMode === 'folder' && directoryHandle ? directoryHandle.name : 'Browser Downloads · one file at a time'}</div></div><FolderOpen className="h-4 w-4 text-white/25" /></div>
                <div className="mt-3 flex gap-2">
                  <button type="button" disabled={status === 'running'} onClick={chooseFolder} className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-cyan-200/[0.10] bg-cyan-200/[0.035] text-[8px] font-bold uppercase tracking-[.1em] text-cyan-100/58 hover:bg-cyan-200/[0.07] disabled:opacity-35"><FolderOpen className="h-3.5 w-3.5" />Choose folder</button>
                  <button type="button" disabled={status === 'running'} onClick={() => { setDirectoryHandle(null); setOutputMode('downloads'); setError(''); }} className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] text-[8px] font-bold uppercase tracking-[.1em] text-white/42 hover:bg-white/[0.055] disabled:opacity-35"><Download className="h-3.5 w-3.5" />Downloads</button>
                </div>
                {!supportsDirectoryPicker && <p className="mt-2 text-[8px] leading-4 text-amber-100/38">This browser does not expose direct folder access. Use a Chromium desktop browser for “Choose folder,” or allow multiple downloads in your browser.</p>}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.055] pt-4">
                <div><div className="text-[7px] uppercase tracking-[.13em] text-white/23">Frames</div><div className="mt-1 text-base font-black text-white/76">{estimatedFrames.toLocaleString()}</div></div>
                <div><div className="text-[7px] uppercase tracking-[.13em] text-white/23">Interval</div><div className="mt-1 text-base font-black text-white/76">{normalizedInterval}s</div></div>
                <div><div className="text-[7px] uppercase tracking-[.13em] text-white/23">Range</div><div className="mt-1 truncate text-[10px] font-black text-white/76">{formatClock(Math.max(0, safeEnd - safeStart))}</div></div>
              </div>
            </section>
          </div>

          <section className="mt-4 rounded-2xl border border-white/[0.06] bg-black/16 px-4 py-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-[150px]">
                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.14em] text-white/38">
                  {status === 'running' ? <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-100/60" /> : status === 'completed' ? <Check className="h-3.5 w-3.5 text-emerald-200/65" /> : <Clock3 className="h-3.5 w-3.5" />}
                  {statusLabel}
                </div>
                <div className="mt-1 text-[9px] text-white/25">{status === 'running' ? `Frame ${completed + 1} · ${formatClock(currentTime)}` : lastWritten ? lastWritten : 'Configure the job, then start extraction.'}</div>
              </div>
              <div className="min-w-[220px] flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.045]"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500/70 to-cyan-200/70 transition-[width] duration-200" style={{ width: `${progress}%` }} /></div>
                <div className="mt-1.5 flex justify-between text-[7px] text-white/22"><span>{completed.toLocaleString()} written</span><span>{estimatedFrames.toLocaleString()} total</span></div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {status === 'running' ? <button type="button" onClick={stop} className="flex h-10 items-center gap-2 rounded-xl border border-red-200/[0.12] bg-red-200/[0.04] px-4 text-[8px] font-black uppercase tracking-[.12em] text-red-100/60 hover:bg-red-200/[0.08]"><CircleStop className="h-3.5 w-3.5" />Stop</button> : <button type="button" onClick={reset} className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 text-[8px] font-bold uppercase tracking-[.12em] text-white/42 hover:bg-white/[0.055]"><RotateCcw className="h-3.5 w-3.5" />Reset</button>}
                <button type="button" disabled={!file || !duration || status === 'running' || estimatedFrames < 1} onClick={startExtraction} className="flex h-10 items-center gap-2 rounded-xl bg-cyan-200 px-5 text-[8px] font-black uppercase tracking-[.12em] text-slate-950 shadow-[0_0_24px_rgba(165,243,252,.08)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-25"><Play className="h-3.5 w-3.5 fill-current" />Start extraction</button>
              </div>
            </div>
            {error && <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200/[0.08] bg-amber-200/[0.025] px-3 py-2 text-[9px] leading-4 text-amber-100/52"><X className="mt-0.5 h-3 w-3 shrink-0" />{error}</div>}
          </section>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[7px] uppercase tracking-[.11em] text-white/18">
            <span>Original video resolution</span><span>Sequential disk writes</span><span>No base64 pipeline</span><span>Maximum {MAX_FRAMES.toLocaleString()} frames per job</span>
          </div>
        </main>

        <aside className="min-h-0">
          <JobHistory jobs={recentJobs} loading={historyLoading} />
          <section className="mt-4 rounded-2xl border border-white/[0.055] bg-black/16 p-4">
            <div className="flex items-center gap-2"><TimerReset className="h-4 w-4 text-white/28" /><div className="text-[9px] font-black uppercase tracking-[.17em] text-white/42">How it runs</div></div>
            <div className="mt-3 space-y-3 text-[9px] leading-4 text-white/28">
              <p><span className="mr-2 font-black text-cyan-100/55">01</span>The browser seeks to one timestamp and decodes that frame.</p>
              <p><span className="mr-2 font-black text-cyan-100/55">02</span>That single frame is encoded directly to JPEG, PNG, or WebP.</p>
              <p><span className="mr-2 font-black text-cyan-100/55">03</span>The image is written to the selected folder before the next frame starts.</p>
              <p><span className="mr-2 font-black text-cyan-100/55">04</span>Only lightweight job progress is sent to the backend.</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
