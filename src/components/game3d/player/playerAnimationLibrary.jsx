import { base44 } from '@/api/base44Client';

const norm = (value = '') => value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

const REQUESTED_ANIMATION_KEYS = [
  { key: 'idle', names: ['unarmed idle 01', 'unarmed idle zero one'] },
  { key: 'run', names: ['run forward', 'running forward', 'standing running'] },
  { key: 'runStop', names: ['standing run stop', 'standing run'] },
  { key: 'runBack', names: ['running backward', 'running backwards', 'standing run back'] },
  { key: 'drawArrow', names: ['standing draw arrow'] },
  { key: 'dodgeRight', names: ['standing dodge right'] },
  { key: 'dodgeLeft', names: ['standing dodge left'] },
  { key: 'dodgeForward', names: ['standing dodge forward'] },
  { key: 'dodgeBackward', names: ['standing dodge backward'] },
  { key: 'diveForward', names: ['standing dive forward'] },
  { key: 'aimWalkRight', names: ['standing aim walk right'] },
  { key: 'aimWalkLeft', names: ['standing aim walk left'] },
  { key: 'aimWalkForward', names: ['standing aim walk forward'] },
  { key: 'aimWalkBackward', names: ['standing aim backwards', 'standing aim walk backward'] },
];

const pickRequestedKey = (name = '') => {
  const normalizedName = norm(name);
  const match = REQUESTED_ANIMATION_KEYS.find(({ names }) => names.some((candidate) => normalizedName === norm(candidate)));
  return match?.key || null;
};

const makeRunClipInPlace = (key, clip) => {
  if (!['run', 'runBack'].includes(key)) return clip;

  const inPlaceClip = clip.clone();
  inPlaceClip.tracks = inPlaceClip.tracks.filter((track) => {
    const trackName = track.name.toLowerCase();
    const isRootPosition = trackName.endsWith('.position') && /(hips|pelvis|root|armature)/i.test(track.name);
    return !isRootPosition;
  });
  inPlaceClip.resetDuration();
  return inPlaceClip;
};

export async function loadPlayerAnimationClips(loader) {
  const rows = await base44.entities.AnimationFBX.filter({ folder: 'player character' }, '-created_date', 100);
  const clipsByKey = {};

  const loadOne = (row) => new Promise((resolve) => {
    const key = pickRequestedKey(row.name);
    if (!key || !row.file_url || clipsByKey[key]) return resolve(null);

    loader.load(
      row.file_url,
      (fbx) => {
        // If this FBX ships with multiple embedded clips (Sketchfab-style),
        // pick the one whose name best matches the requested key rather than
        // blindly using animations[0].
        const clip = fbx.animations?.length > 1
          ? fbx.animations.find((c) => pickRequestedKey(c.name) === key) ?? fbx.animations[0]
          : fbx.animations?.[0];

        if (clip) {
          const finalClip = makeRunClipInPlace(key, clip);
          finalClip.name = key;
          clipsByKey[key] = finalClip;
        }
        resolve(clip || null);
      },
      undefined,
      () => resolve(null),
    );
  });

  await Promise.all(rows.map(loadOne));
  return clipsByKey;
}

/**
 * When the player model FBX already contains all animations (idle, walk, run
 * baked in), use this instead of loadPlayerAnimationClips.
 * Returns null if the fbx has no animations.
 *
 * Usage in GameWorld3D (after loader.load of the player FBX):
 *   if (fbx.animations?.length > 1) {
 *     playerAnim.bindEmbeddedClips(fbx);
 *   } else {
 *     loadPlayerAnimationClips(loader).then(clips => playerAnim.bindClips(clips));
 *   }
 */
export function tryBindEmbeddedClips(playerAnim, fbx) {
  if (!fbx?.animations?.length) return false;
  // Only treat as embedded when there are multiple clips — a single external
  // idle file still goes through the normal library path.
  if (fbx.animations.length < 2) return false;
  return playerAnim.bindEmbeddedClips(fbx);
}