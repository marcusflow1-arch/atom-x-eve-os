import { base44 } from '@/api/base44Client';

const norm = (value = '') => value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

const REQUESTED_ANIMATION_KEYS = [
  { key: 'idle', names: ['unarmed idle 01', 'unarmed idle zero one'] },
  { key: 'run', names: ['standing running'] },
  { key: 'runStop', names: ['standing run stop', 'standing run'] },
  { key: 'runBack', names: ['standing run back'] },
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

export async function loadPlayerAnimationClips(loader) {
  const rows = await base44.entities.AnimationFBX.filter({ folder: 'player character' }, '-created_date', 100);
  const clipsByKey = {};

  const loadOne = (row) => new Promise((resolve) => {
    const key = pickRequestedKey(row.name);
    if (!key || !row.file_url || clipsByKey[key]) return resolve(null);

    loader.load(
      row.file_url,
      (fbx) => {
        const clip = fbx.animations?.[0];
        if (clip) {
          clip.name = key;
          clipsByKey[key] = clip;
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