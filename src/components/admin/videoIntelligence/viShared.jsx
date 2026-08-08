// Pure helpers + artifact builders for the Video Intelligence admin subpage.

export const SAMPLING_MODES = [
  { value: 'interval', label: 'Every X seconds' },
  { value: 'scene', label: 'Scene changes only' },
  { value: 'hybrid', label: 'Hybrid (scene + sample)' },
];

export const ANALYSIS_DEPTH = [
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'deep', label: 'Deep' },
];

export const DEFAULT_OPTIONS = {
  sampling_mode: 'hybrid',
  sample_interval_seconds: 5,
  max_frames: 24,
  analysis_depth: 'medium',
  include_transcript: true,
  run_ocr: true,
  detect_objects: true,
  auto_fallback_package: false,
  save_to_database: true,
};

export const MAX_FRAME_IMAGES = 8;

export const STATUS_STYLES = {
  pending: 'bg-slate-500/20 text-slate-300',
  processing: 'bg-blue-500/20 text-blue-300',
  completed: 'bg-green-500/20 text-green-300',
  packaged: 'bg-emerald-500/20 text-emerald-300',
  failed: 'bg-red-500/20 text-red-300',
};

export function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function youtubeThumb(url) {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : '';
}

export function formatTimestamp(s) {
  if (!isFinite(s) || s == null) return '00:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
}

export function parseJson(s) {
  try { return JSON.parse(s || '[]'); } catch { return []; }
}

// Derive frame records from scenes + sampling options.
export function deriveFrames(scenes, options, duration) {
  if (!scenes || scenes.length === 0) return [];
  const sceneAt = (t) => {
    const c = scenes.find((sc) => t >= sc.start_time_seconds && t <= sc.end_time_seconds);
    if (c) return c;
    let best = scenes[0];
    let bd = Infinity;
    for (const sc of scenes) {
      const d = Math.abs(((sc.start_time_seconds + sc.end_time_seconds) / 2) - t);
      if (d < bd) { bd = d; best = sc; }
    }
    return best;
  };
  const make = (t, rep) => {
    if (t < 0) return null;
    if (duration > 0 && t > duration + 0.5) return null;
    const sc = sceneAt(t);
    return {
      timestamp_seconds: +t.toFixed(2),
      scene_id: sc?.id || '',
      scene_index: sc?.scene_index,
      frame_summary: sc?.scene_summary || '',
      ocr_text: sc?.ocr_text || '',
      detected_objects_json: JSON.stringify(sc?.detected_objects || []),
      detected_entities_json: JSON.stringify(sc?.detected_entities || []),
      notes: rep ? 'Representative frame' : 'Sampled frame',
      is_representative: !!rep,
    };
  };
  const raw = [];
  if (options.sampling_mode === 'interval' || options.sampling_mode === 'hybrid') {
    const step = Math.max(1, options.sample_interval_seconds || 5);
    const max = duration > 0 ? duration : step * (options.max_frames || 24);
    for (let t = 0; t <= max; t += step) { const f = make(t, false); if (f) raw.push(f); }
  }
  if (options.sampling_mode === 'scene' || options.sampling_mode === 'hybrid') {
    scenes.forEach((sc) => {
      const a = make(sc.start_time_seconds, true); if (a) raw.push(a);
      const b = make((sc.start_time_seconds + sc.end_time_seconds) / 2, true); if (b) raw.push(b);
    });
  }
  const seen = new Set();
  const unique = raw
    .filter((f) => { const k = Math.round(f.timestamp_seconds * 2); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => a.timestamp_seconds - b.timestamp_seconds)
    .map((f, i) => ({ ...f, frame_index: i }));
  return unique.slice(0, options.max_frames || unique.length);
}

export function buildManifest(analysis, scenes, frames) {
  return {
    video: {
      id: analysis?.id,
      title: analysis?.title,
      source_url: analysis?.video_url,
      source_type: analysis?.source_type,
      duration_seconds: analysis?.duration_seconds,
      analysis_depth: analysis?.analysis_depth,
      sampling_mode: analysis?.sampling_mode,
      sample_interval_seconds: analysis?.sample_interval_seconds,
      transcript_available: !!analysis?.transcript_available,
    },
    generated_at: new Date().toISOString(),
    total_scenes: scenes.length,
    total_frames: frames.length,
    frames: frames.map((f) => ({
      frame_id: `frame_${String(f.frame_index).padStart(4, '0')}`,
      timestamp: f.timestamp_seconds,
      timestamp_label: formatTimestamp(f.timestamp_seconds),
      scene_id: f.scene_id || null,
      image_path: f.image_url ? `frames/${String(f.frame_index).padStart(4, '0')}.jpg` : null,
      summary: f.frame_summary,
      ocr_text: f.ocr_text || '',
      detected_objects: parseJson(f.detected_objects_json),
      detected_entities: parseJson(f.detected_entities_json),
    })),
  };
}

export function buildTimeline(analysis, scenes, frames) {
  return {
    video: { id: analysis?.id, title: analysis?.title, source_url: analysis?.video_url, duration_seconds: analysis?.duration_seconds },
    scenes: scenes.map((sc) => ({
      scene_index: sc.scene_index,
      start_time_seconds: sc.start_time_seconds,
      end_time_seconds: sc.end_time_seconds,
      range: `${formatTimestamp(sc.start_time_seconds)} - ${formatTimestamp(sc.end_time_seconds)}`,
      summary: sc.scene_summary,
      transcript_excerpt: sc.transcript_excerpt,
      detected_entities: parseJson(sc.detected_entities_json),
      detected_objects: parseJson(sc.detected_objects_json),
      ocr_text: sc.ocr_text,
      importance_score: sc.importance_score,
      actions: parseJson(sc.actions_json),
      representative_frame_url: sc.representative_frame_url,
      frames: frames.filter((f) => f.scene_id === sc.id).map((f) => ({ frame_index: f.frame_index, timestamp: f.timestamp_seconds, image_url: f.image_url })),
    })),
  };
}

export function buildTranscript(analysis, scenes) {
  const lines = [];
  lines.push(`# Transcript — ${analysis?.title || analysis?.video_url}`);
  lines.push(`Source: ${analysis?.video_url}`);
  lines.push('');
  if (analysis?.transcript_text) { lines.push(analysis.transcript_text); lines.push(''); }
  lines.push('--- Per-scene excerpts ---');
  scenes.forEach((sc) => {
    lines.push(`[${formatTimestamp(sc.start_time_seconds)} - ${formatTimestamp(sc.end_time_seconds)}] ${sc.transcript_excerpt || '(no dialogue)'}`);
  });
  return lines.join('\n');
}

export function buildSummaryMd(analysis, scenes) {
  const lines = [];
  lines.push(`# ${analysis?.title || 'Video Analysis'}`);
  lines.push('');
  lines.push(`- **Source:** ${analysis?.video_url}`);
  lines.push(`- **Duration:** ${formatTimestamp(analysis?.duration_seconds || 0)}`);
  lines.push(`- **Scenes:** ${scenes.length}`);
  lines.push(`- **Depth:** ${analysis?.analysis_depth} · **Sampling:** ${analysis?.sampling_mode}`);
  lines.push('');
  if (analysis?.summary_markdown) { lines.push(analysis.summary_markdown); lines.push(''); }
  lines.push('## Scene Timeline');
  scenes.forEach((sc) => {
    lines.push(`### Scene ${sc.scene_index} — ${formatTimestamp(sc.start_time_seconds)} to ${formatTimestamp(sc.end_time_seconds)}`);
    lines.push(sc.scene_summary || '');
    if (sc.transcript_excerpt) lines.push(`> ${sc.transcript_excerpt}`);
    const objs = parseJson(sc.detected_objects_json); if (objs.length) lines.push(`- Objects: ${objs.join(', ')}`);
    const ents = parseJson(sc.detected_entities_json); if (ents.length) lines.push(`- Entities: ${ents.join(', ')}`);
    if (sc.ocr_text) lines.push(`- OCR: ${sc.ocr_text}`);
    lines.push('');
  });
  return lines.join('\n');
}

export function buildCsvIndex(frames) {
  const header = ['frame_index', 'timestamp_seconds', 'timestamp_label', 'scene_id', 'is_representative', 'image_url', 'summary', 'ocr_text', 'detected_objects', 'detected_entities'];
  const rows = frames.map((f) => [
    f.frame_index, f.timestamp_seconds, formatTimestamp(f.timestamp_seconds), f.scene_id, f.is_representative ? '1' : '0',
    f.image_url, (f.frame_summary || '').replace(/"/g, '""'), (f.ocr_text || '').replace(/"/g, '""'),
    parseJson(f.detected_objects_json).join('; ').replace(/"/g, '""'), parseJson(f.detected_entities_json).join('; ').replace(/"/g, '""'),
  ].map((v) => `"${String(v ?? '')}"`).join(','));
  return [header.join(','), ...rows].join('\n');
}

// ---- store-only ZIP builder (no external dependency) ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) { c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); }
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) { c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8); }
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function u16(dv, o, v) { dv.setUint16(o, v, true); }
function u32(dv, o, v) { dv.setUint32(o, v, true); }

export async function makeZip(files) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const data = f.data instanceof Uint8Array ? f.data : new Uint8Array(await f.data);
    const crc = crc32(data);
    const size = data.length;
    const lh = new Uint8Array(30 + nameBytes.length);
    const dv = new DataView(lh.buffer);
    u32(dv, 0, 0x04034b50); u16(dv, 4, 20); u16(dv, 6, 0); u16(dv, 8, 0); u16(dv, 10, 0); u16(dv, 12, 0);
    u32(dv, 14, crc); u32(dv, 18, size); u32(dv, 22, size); u16(dv, 26, nameBytes.length); u16(dv, 28, 0);
    lh.set(nameBytes, 30);
    const ch = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(ch.buffer);
    u32(cv, 0, 0x02014b50); u16(cv, 4, 20); u16(cv, 6, 20); u16(cv, 8, 0); u16(cv, 10, 0); u16(cv, 12, 0); u16(cv, 14, 0);
    u32(cv, 16, crc); u32(cv, 20, size); u32(cv, 24, size); u16(cv, 28, nameBytes.length); u16(cv, 30, 0); u16(cv, 32, 0);
    u16(cv, 34, 0); u16(cv, 36, 0); u32(cv, 38, 0); u32(cv, 42, offset); ch.set(nameBytes, 46);
    parts.push(lh, data);
    central.push(ch);
    offset += lh.length + size;
  }
  const centralSize = central.reduce((a, p) => a + p.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  u32(ev, 0, 0x06054b50); u16(ev, 4, 0); u16(ev, 6, 0); u16(ev, 8, files.length); u16(ev, 10, files.length);
  u32(ev, 12, centralSize); u32(ev, 16, offset); u16(ev, 20, 0);
  return new Blob([...parts, ...central, eocd], { type: 'application/zip' });
}

export async function fetchBytes(url) {
  const res = await fetch(url);
  const ab = await res.arrayBuffer();
  return new Uint8Array(ab);
}

export function buildAnalysisPrompt(url, options) {
  const depthScenes = options.analysis_depth === 'deep' ? '12 to 24 detailed scenes'
    : options.analysis_depth === 'medium' ? '8 to 14 scenes' : '4 to 8 scenes';
  const segHint = options.sampling_mode === 'scene'
    ? 'Segment at distinct visual/scene boundaries.'
    : options.sampling_mode === 'interval'
      ? 'Segment into roughly even timed segments.'
      : 'Segment at scene boundaries, then add representative sub-segments inside long scenes.';
  return `You are a video intelligence engine. Analyze the YouTube video at this URL: ${url}

Goal: convert the video into a structured visual timeline using scene segmentation, transcript alignment, OCR, and object/entity detection.

Instructions:
- ${segHint}
- Aim for ${depthScenes}.
- For each scene give precise start_time_seconds and end_time_seconds, a 2-3 sentence scene_summary, the transcript_excerpt spoken in that window, detected_entities (people/brands/concepts), detected_objects (visible items), ocr_text (on-screen text), importance_score (0-1), actions (key events), and a one-sentence visual_description describing the frame composition (for image rendering).
${options.include_transcript ? '- Provide the full transcript_text and set transcript_available true.' : '- Set transcript_available false and transcript_text empty if captions are unavailable.'}
${options.run_ocr ? '- Extract visible on-screen text into ocr_text per scene.' : '- Skip OCR; leave ocr_text empty.'}
${options.detect_objects ? '- Detect visible objects and entities per scene.' : '- Skip detection; leave detected_objects and detected_entities empty.'}
- Provide an overall summary_markdown describing the video as a timeline of meaningful segments.
- Provide total_scenes and a best-estimate duration_seconds.

Return strict JSON matching the schema.`;
}

export const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    duration_seconds: { type: 'number' },
    transcript_available: { type: 'boolean' },
    transcript_text: { type: 'string' },
    summary_markdown: { type: 'string' },
    total_scenes: { type: 'number' },
    scenes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          scene_index: { type: 'number' },
          start_time_seconds: { type: 'number' },
          end_time_seconds: { type: 'number' },
          scene_summary: { type: 'string' },
          transcript_excerpt: { type: 'string' },
          detected_entities: { type: 'array', items: { type: 'string' } },
          detected_objects: { type: 'array', items: { type: 'string' } },
          ocr_text: { type: 'string' },
          importance_score: { type: 'number' },
          actions: { type: 'array', items: { type: 'string' } },
          visual_description: { type: 'string' },
        },
      },
    },
  },
};

export function buildFrameImagePrompt(scene) {
  return `A single cinematic still frame representing a video scene: ${scene.visual_description || scene.scene_summary || 'a moment from a video'}. Photorealistic, 16:9 widescreen composition, no text overlay, no watermark.`;
}