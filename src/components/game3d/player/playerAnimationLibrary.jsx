import { base44 } from '@/api/base44Client';

const norm = (value = '') => value.toLowerCase().replace(/[_-]+/g, ' ').trim();

const pickKey = (name, type) => {
  const n = norm(name);
  const t = norm(type);

  if (n.includes('crouch') && n.includes('idle')) return 'crouchIdle';
  if (n.includes('crouch') && n.includes('walk')) return 'crouchWalk';
  if (n.includes('crouch') && (n.includes('run') || n.includes('sprint'))) return 'crouchRun';
  if (n.includes('crouch')) return 'crouchEnter';

  if (n.includes('aim') && (n.includes('walk') || n.includes('run') || n.includes('move'))) return 'aimMove';
  if (n.includes('aim') && n.includes('idle')) return 'aimIdle';
  if (n.includes('aim')) return 'aimIdle';

  if (n.includes('roll') || n.includes('dodge')) return 'roll';
  if (n.includes('kick')) return 'kick';
  if (n.includes('block') && (n.includes('idle') || n.includes('hold') || n.includes('loop'))) return 'blockHold';
  if (n.includes('block') && n.includes('exit')) return 'blockExit';
  if (n.includes('block')) return 'blockEnter';
  if (n.includes('multi') || n.includes('combo')) return 'multiShot';
  if (n.includes('shoot') || n.includes('fire') || n.includes('arrow') || n.includes('attack')) return 'attack';
  if (n.includes('react') || n.includes('hit')) return 'hitReact';
  if (n.includes('death') || n.includes('dying')) return 'death';

  if (n.includes('sprint')) return 'sprint';
  if (n.includes('run') && n.includes('forward')) return 'run';
  if (n.includes('run')) return 'run';
  if (n.includes('walk') && n.includes('forward')) return 'walk';
  if (n.includes('walk')) return 'walk';
  if (n.includes('idle') || t === 'idle') return 'idle';

  return null;
};

export async function loadPlayerAnimationClips(loader) {
  const rows = await base44.entities.AnimationFBX.filter({ folder: 'player character' }, '-created_date', 100);
  const clipsByKey = {};
  const loadOne = (row) => new Promise((resolve) => {
    const key = pickKey(row.name, row.animation_type);
    if (!key || !row.file_url) return resolve(null);

    loader.load(
      row.file_url,
      (fbx) => {
        const clip = fbx.animations?.[0];
        if (clip && !clipsByKey[key]) {
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