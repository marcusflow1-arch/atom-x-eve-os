// Shared helpers for the Attachment Visual Validator admin subpage.
import { makeZip, fetchBytes, formatTimestamp, parseJson } from '../videoIntelligence/viShared';

export { makeZip, fetchBytes, formatTimestamp, parseJson };

export const RIG_OPTIONS = ['Humanoid', 'Y-Bot', 'Biped', 'Mixamo', 'Custom'];
export const PROP_OPTIONS = ['Sword', 'Greatsword', 'Dagger', 'Spear', 'Bow', 'Shield', 'Gun (Pistol)', 'Rifle', 'Staff', 'Axe', 'Twin Blades', 'None'];
export const ATTACHMENT_RULES = ['Right Hand', 'Left Hand', 'Two-Hand', 'Back Sheath', 'Hip Sheath', 'Off-Hand Support', 'Shoulder Mount', 'Custom'];
export const FRAME_SAMPLING_MODES = [
  { value: 'interval', label: 'Even interval' },
  { value: 'keyframes', label: 'Keyframes only' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const DEFAULT_OPTIONS = {
  frame_sampling_mode: 'interval',
  frame_interval_seconds: 0.25,
  max_frames: 8,
  ai_issue_detection: true,
};

export const ISSUE_STYLES = {
  clipping: 'bg-red-500/20 text-red-300',
  drift: 'bg-amber-500/20 text-amber-300',
  occlusion: 'bg-orange-500/20 text-orange-300',
};

export const STATUS_STYLES = {
  pending: 'bg-slate-500/20 text-slate-300',
  processing: 'bg-blue-500/20 text-blue-300',
  completed: 'bg-green-500/20 text-green-300',
  packaged: 'bg-emerald-500/20 text-emerald-300',
  failed: 'bg-red-500/20 text-red-300',
};

export function deriveTimestamps(options) {
  const n = Math.max(1, Math.min(options.max_frames || 1, 60));
  const step = Math.max(0.05, options.frame_interval_seconds || 0.25);
  return Array.from({ length: n }, (_, i) => +(i * step).toFixed(3));
}

export function buildFramePrompt(opts, t) {
  return `3D character animation QA validation still frame. Character model: ${opts.characterModel || 'a humanoid character'} (rig profile: ${opts.rigProfile || 'humanoid'}). Prop/weapon: ${opts.prop || 'a sword'} attached via the "${opts.attachmentRule || 'right hand'}" attachment rule. Animation clip: "${opts.animationClip || 'idle'}", sampled at timestamp ${t}s. Full-body cinematic 3D render, neutral studio lighting, 16:9 composition, clear unobstructed view of the hands and prop for attachment review. No text overlay, no watermark.`;
}

export const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    visual_summary: { type: 'string' },
    alignment_notes: { type: 'string' },
    clipping_detected: { type: 'boolean' },
    drift_detected: { type: 'boolean' },
    occlusion_detected: { type: 'boolean' },
  },
};

export function buildAnalysisPrompt() {
  return `You are a 3D character attachment QA reviewer. Examine this rendered frame of a character holding a prop/weapon. Detect visible attachment issues such as: sword floating next to the hand, weapon not aligned to the palm, hand not gripping the handle correctly, prop clipping through the body, gun muzzle pointing the wrong way, off-hand support missing, visible drift, seeing inside the model, prop intersecting mesh during movement. Return a one-sentence visual_summary, specific alignment_notes (list issues found, or "alignment OK" if none), and boolean flags for clipping_detected, drift_detected, occlusion_detected.`;
}

export function buildManifest(session, frames) {
  return {
    session: {
      id: session?.id,
      title: session?.title,
      character_model: session?.character_model,
      rig_profile_name: session?.rig_profile_name,
      weapon_or_prop_name: session?.weapon_or_prop_name,
      attachment_rule_name: session?.attachment_rule_name,
      animation_clip_name: session?.animation_clip_name,
      frame_sampling_mode: session?.frame_sampling_mode,
      frame_interval_seconds: session?.frame_interval_seconds,
      total_frames: session?.total_frames,
      summary: session?.summary,
    },
    generated_at: new Date().toISOString(),
    frames: frames.map((f) => ({
      frame_index: f.frame_index,
      timestamp_seconds: f.timestamp_seconds,
      timestamp_label: formatTimestamp(f.timestamp_seconds),
      image_path: f.image_url ? `frames/${String(f.frame_index).padStart(4, '0')}.jpg` : null,
      visual_summary: f.visual_summary,
      alignment_notes: f.alignment_notes,
      clipping_detected: !!f.clipping_detected,
      drift_detected: !!f.drift_detected,
      occlusion_detected: !!f.occlusion_detected,
      admin_notes: f.admin_notes,
    })),
  };
}

export function buildCsv(frames) {
  const header = ['frame_index', 'timestamp_seconds', 'timestamp_label', 'clipping_detected', 'drift_detected', 'occlusion_detected', 'image_url', 'visual_summary', 'alignment_notes', 'admin_notes'];
  const rows = frames.map((f) => [
    f.frame_index, f.timestamp_seconds, formatTimestamp(f.timestamp_seconds),
    f.clipping_detected ? '1' : '0', f.drift_detected ? '1' : '0', f.occlusion_detected ? '1' : '0',
    f.image_url, (f.visual_summary || '').replace(/"/g, '""'), (f.alignment_notes || '').replace(/"/g, '""'), (f.admin_notes || '').replace(/"/g, '""'),
  ].map((v) => `"${String(v ?? '')}"`).join(','));
  return [header.join(','), ...rows].join('\n');
}

export function buildSummaryMd(session, frames) {
  const lines = [];
  lines.push(`# Attachment Validation — ${session?.title || 'Session'}`);
  lines.push('');
  lines.push(`- **Character model:** ${session?.character_model || '—'}`);
  lines.push(`- **Rig profile:** ${session?.rig_profile_name || '—'}`);
  lines.push(`- **Prop/weapon:** ${session?.weapon_or_prop_name || '—'}`);
  lines.push(`- **Attachment rule:** ${session?.attachment_rule_name || '—'}`);
  lines.push(`- **Animation clip:** ${session?.animation_clip_name || '—'}`);
  lines.push(`- **Sampling:** ${session?.frame_sampling_mode} · interval ${session?.frame_interval_seconds}s · ${frames.length} frames`);
  lines.push('');
  const clip = frames.filter((f) => f.clipping_detected).length;
  const drift = frames.filter((f) => f.drift_detected).length;
  const occl = frames.filter((f) => f.occlusion_detected).length;
  lines.push('## Issue summary');
  lines.push(`- Clipping flagged: ${clip} frame(s)`);
  lines.push(`- Drift flagged: ${drift} frame(s)`);
  lines.push(`- Occlusion flagged: ${occl} frame(s)`);
  lines.push('');
  if (session?.summary) { lines.push(session.summary); lines.push(''); }
  lines.push('## Frame timeline');
  frames.forEach((f) => {
    const flags = [];
    if (f.clipping_detected) flags.push('clipping');
    if (f.drift_detected) flags.push('drift');
    if (f.occlusion_detected) flags.push('occlusion');
    lines.push(`### Frame ${f.frame_index} — ${formatTimestamp(f.timestamp_seconds)}${flags.length ? ` [${flags.join(', ')}]` : ''}`);
    if (f.visual_summary) lines.push(f.visual_summary);
    if (f.alignment_notes) lines.push(`- Notes: ${f.alignment_notes}`);
    if (f.admin_notes) lines.push(`- Admin: ${f.admin_notes}`);
    lines.push('');
  });
  return lines.join('\n');
}