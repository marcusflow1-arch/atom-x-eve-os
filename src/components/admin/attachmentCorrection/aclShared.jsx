// Shared helpers for the Attachment Correction Lab admin subpage.
import {
  RIG_OPTIONS, PROP_OPTIONS, ATTACHMENT_RULES,
  makeZip, fetchBytes, formatTimestamp,
  ANALYSIS_SCHEMA, buildAnalysisPrompt,
} from '../attachmentValidator/avvShared';

export { RIG_OPTIONS, PROP_OPTIONS, ATTACHMENT_RULES, makeZip, fetchBytes, formatTimestamp, ANALYSIS_SCHEMA, buildAnalysisPrompt };

export const DEFAULT_OFFSETS = {
  posX: 0, posY: 0, posZ: 0,
  rotX: 0, rotY: 0, rotZ: 0,
  scaleX: 1, scaleY: 1, scaleZ: 1,
  offPosX: 0, offPosY: 0, offPosZ: 0,
  offRotX: 0, offRotY: 0, offRotZ: 0,
};

export const CORRECTION_TYPES = [
  { value: 'base_rule', label: 'Overwrite base rule' },
  { value: 'animation_override', label: 'Animation-specific override' },
  { value: 'model_override', label: 'Model-specific override' },
];

export function toEntityBase(o) {
  return {
    base_position_offset_x: o.posX, base_position_offset_y: o.posY, base_position_offset_z: o.posZ,
    base_rotation_offset_x: o.rotX, base_rotation_offset_y: o.rotY, base_rotation_offset_z: o.rotZ,
    base_scale_x: o.scaleX, base_scale_y: o.scaleY, base_scale_z: o.scaleZ,
    base_offhand_position_x: o.offPosX, base_offhand_position_y: o.offPosY, base_offhand_position_z: o.offPosZ,
    base_offhand_rotation_x: o.offRotX, base_offhand_rotation_y: o.offRotY, base_offhand_rotation_z: o.offRotZ,
  };
}

export function toEntityCorrected(o) {
  return {
    corrected_position_offset_x: o.posX, corrected_position_offset_y: o.posY, corrected_position_offset_z: o.posZ,
    corrected_rotation_offset_x: o.rotX, corrected_rotation_offset_y: o.rotY, corrected_rotation_offset_z: o.rotZ,
    corrected_scale_x: o.scaleX, corrected_scale_y: o.scaleY, corrected_scale_z: o.scaleZ,
    corrected_offhand_position_x: o.offPosX, corrected_offhand_position_y: o.offPosY, corrected_offhand_position_z: o.offPosZ,
    corrected_offhand_rotation_x: o.offRotX, corrected_offhand_rotation_y: o.offRotY, corrected_offhand_rotation_z: o.offRotZ,
  };
}

export function fromEntityBase(e) {
  return {
    posX: e.base_position_offset_x || 0, posY: e.base_position_offset_y || 0, posZ: e.base_position_offset_z || 0,
    rotX: e.base_rotation_offset_x || 0, rotY: e.base_rotation_offset_y || 0, rotZ: e.base_rotation_offset_z || 0,
    scaleX: e.base_scale_x || 1, scaleY: e.base_scale_y || 1, scaleZ: e.base_scale_z || 1,
    offPosX: e.base_offhand_position_x || 0, offPosY: e.base_offhand_position_y || 0, offPosZ: e.base_offhand_position_z || 0,
    offRotX: e.base_offhand_rotation_x || 0, offRotY: e.base_offhand_rotation_y || 0, offRotZ: e.base_offhand_rotation_z || 0,
  };
}

export function fromEntityCorrected(e) {
  return {
    posX: e.corrected_position_offset_x || 0, posY: e.corrected_position_offset_y || 0, posZ: e.corrected_position_offset_z || 0,
    rotX: e.corrected_rotation_offset_x || 0, rotY: e.corrected_rotation_offset_y || 0, rotZ: e.corrected_rotation_offset_z || 0,
    scaleX: e.corrected_scale_x || 1, scaleY: e.corrected_scale_y || 1, scaleZ: e.corrected_scale_z || 1,
    offPosX: e.corrected_offhand_position_x || 0, offPosY: e.corrected_offhand_position_y || 0, offPosZ: e.corrected_offhand_position_z || 0,
    offRotX: e.corrected_offhand_rotation_x || 0, offRotY: e.corrected_offhand_rotation_y || 0, offRotZ: e.corrected_offhand_rotation_z || 0,
  };
}

export function deltaOffsets(b, c) {
  const d = {};
  for (const k of Object.keys(DEFAULT_OFFSETS)) {
    d[k] = +((c[k] ?? 0) - (b[k] ?? 0)).toFixed(3);
  }
  return d;
}

export function buildPreviewPrompt(opts, offsets, tag) {
  const p = offsets;
  return `3D character attachment ${tag || 'preview'} render. Character model: ${opts.characterModel || 'a humanoid character'} (rig: ${opts.rigProfile || 'humanoid'}). Prop/weapon: ${opts.prop || 'a sword'} attached via the "${opts.attachmentRule || 'right hand'}" attachment rule. Animation clip: "${opts.animationClip || 'idle'}". Applied offsets — position [${p.posX}, ${p.posY}, ${p.posZ}], rotation [${p.rotX}°, ${p.rotY}°, ${p.rotZ}°], scale [${p.scaleX}, ${p.scaleY}, ${p.scaleZ}], off-hand support position [${p.offPosX}, ${p.offPosY}, ${p.offPosZ}] rotation [${p.offRotX}°, ${p.offRotY}°, ${p.offRotZ}°]. Full-body cinematic 3D render, neutral studio lighting, 16:9 composition, clear unobstructed view of the hands and prop. No text overlay, no watermark.`;
}

export function buildCorrectionManifest(session, base, corrected) {
  return {
    session: {
      id: session?.id,
      title: session?.title,
      character_model: session?.character_model,
      rig_profile_name: session?.rig_profile_name,
      prop_name: session?.prop_name,
      attachment_rule_name: session?.attachment_rule_name,
      animation_clip_name: session?.animation_clip_name,
      correction_type: session?.correction_type,
      approved: !!session?.approved,
      notes: session?.notes,
      issue_notes: session?.issue_notes,
    },
    base_offsets: base,
    corrected_offsets: corrected,
    delta: deltaOffsets(base, corrected),
    generated_at: new Date().toISOString(),
  };
}

export function buildNotesMd(title, base, corrected, issueNotes, notes) {
  const fmt = (o) => `pos[${o.posX}, ${o.posY}, ${o.posZ}] rot[${o.rotX}°, ${o.rotY}°, ${o.rotZ}°] scale[${o.scaleX}, ${o.scaleY}, ${o.scaleZ}] off-hand pos[${o.offPosX}, ${o.offPosY}, ${o.offPosZ}] rot[${o.offRotX}°, ${o.offRotY}°, ${o.offRotZ}°]`;
  const lines = [
    `# Attachment Correction — ${title || 'Session'}`,
    '',
    '## Issue notes',
    issueNotes || '—',
    '',
    '## Admin notes',
    notes || '—',
    '',
    '## Base offsets',
    fmt(base),
    '',
    '## Corrected offsets',
    fmt(corrected),
    '',
    '## Delta (corrected − base)',
    fmt(deltaOffsets(base, corrected)),
    '',
  ];
  return lines.join('\n');
}