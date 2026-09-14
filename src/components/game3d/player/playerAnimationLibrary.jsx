import {retargetAvatarClip} from '@/components/onboarding/retargetAvatarClip';
import {isHi3DAvatar} from '@/components/onboarding/modelAppearance';
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

export async function loadPlayerAnimationClips(loader, target) {
  const rows = await base44.entities.AnimationFBX.filter({ folder: 'player character' }, '-created_date', 100).catch(()=>[]);
  const clipsByKey = {}, sourceClips = {};

  const loadOne = (row) => new Promise((resolve) => {
    const key = pickRequestedKey(row.name);
    if (!key || !row.file_url || clipsByKey[key]) return resolve(null);

    loader.load(
      row.file_url,
      (fbx) => {
        const clip = fbx.animations?.[0];
        if (clip) {
          sourceClips[key]=clip;
          const finalClip=target&&isHi3DAvatar(target)?retargetAvatarClip(fbx,target,clip):makeRunClipInPlace(key,clip);
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
  for(const [key,name] of [['idle','Idle'],['walk','Walk']]){const clip=target?.animations?.find(c=>c.name===name);if(clip)clipsByKey[key]=clip;}
  clipsByKey.run ||= clipsByKey.walk;
  return {clipsByKey,sourceClips};
}