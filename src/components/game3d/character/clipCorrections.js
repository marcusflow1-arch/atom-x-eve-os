// ─── Clip Correction / Metadata Table ──────────────────────────────────
// Clips are never treated as interchangeable strings. Each one declares how
// it loops, whether it is locomotion or an upper-body overlay, and any yaw
// offset needed because the clip was authored on a different facing basis
// than our canonical forward (−Z).
//
// A clip that imports facing the wrong way gets ONE entry here instead of a
// workaround inside the movement, aim or combo code.

export const DEFAULT_CLIP_META = {
  loop: false,
  locomotion: false,
  upperBodyOnly: false,
  aimAligned: false,
  yawOffset: 0,
  speed: 1.0,
};

export const CLIP_META = {
  Idle:        { loop: true,  locomotion: true },
  Walk:        { loop: true,  locomotion: true },
  Run:         { loop: true,  locomotion: true },
  Strafe_Left: { loop: true,  locomotion: true },
  Strafe_Right:{ loop: true,  locomotion: true },
  Jump:        { loop: false, locomotion: true },
  Dodge:       { loop: false },
  Dodge_Left:  { loop: false },
  Dodge_Right: { loop: false },
  Stagger:     { loop: false },
  Death:       { loop: false },

  // Mixamo rifle set imports facing +Z, so it needs a half-turn to sit on
  // our canonical −Z forward.
  Rifle_Idle:  { loop: true,  upperBodyOnly: true, aimAligned: true, yawOffset: Math.PI },
  Rifle_Aim:   { loop: true,  upperBodyOnly: true, aimAligned: true, yawOffset: Math.PI },
  Rifle_Fire:  { loop: false, upperBodyOnly: true, aimAligned: true, yawOffset: Math.PI },

  Sword_Hit_1: { loop: false },
  Sword_Hit_2: { loop: false },
  Sword_Slam_3:{ loop: false },
};

export function getClipMeta(clipName) {
  return { ...DEFAULT_CLIP_META, ...(CLIP_META[clipName] || {}) };
}

export const isLocomotionClip = (c) => getClipMeta(c).locomotion;
export const isUpperBodyClip = (c) => getClipMeta(c).upperBodyOnly;
export const clipYawOffset = (c) => getClipMeta(c).yawOffset;