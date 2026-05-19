import { base44 } from '@/api/base44Client';

const norm = (value = '') => value.toLowerCase().replace(/[_-]+/g, ' ').trim();

const pickKey = (name, type) => {
  const n = norm(name);
  const t = norm(type);

  if (n.includes('crouch') && n.includes('idle')) return 'crouchIdle';
  if (n.includes('crouch') && n.includes('walk')) return 'crouchWalk';
  if (n.includes('crouch') && (n.includes('run') || n.includes('sprint'))) return 'crouchRun';
  if (n.includes('crouch')) return 'crouchEnter';

  if (n.includes('jump') && (n.includes('start') || n.includes('up'))) return 'jumpStart';
  if (n.includes('jump') && (n.includes('loop') || n.includes('air'))) return 'jumpLoop';
  if (n.includes('jump') && (n.includes('land') || n.includes('end'))) return 'jumpLand';
  if (n.includes('fall')) return 'fall';

  if ((n.includes('bow') || n.includes('aim')) && (n.includes('walk') || n.includes('move'))) return 'combatWalk';
  if ((n.includes('bow') || n.includes('aim')) && n.includes('run')) return 'combatRun';
  if (n.includes('draw') && (n.includes('bow') || n.includes('arrow'))) return 'drawBow';
  if ((n.includes('hold') || n.includes('idle')) && (n.includes('bow') || n.includes('aim'))) return 'holdBow';
  if ((n.includes('fire') || n.includes('shoot')) && (n.includes('bow') || n.includes('arrow'))) return 'fireArrow';
  if (n.includes('reload') && (n.includes('bow') || n.includes('arrow'))) return 'reloadArrow';
  if (n.includes('aim') && (n.includes('walk') || n.includes('run') || n.includes('move'))) return 'combatWalk';
  if (n.includes('aim') && n.includes('idle')) return 'holdBow';
  if (n.includes('aim')) return 'holdBow';

  if (n.includes('roll')) return 'roll';
  if (n.includes('dodge')) return 'dodge';
  if (n.includes('kick')) return 'kick';
  if (n.includes('block') && (n.includes('idle') || n.includes('hold') || n.includes('loop'))) return 'blockHold';
  if (n.includes('multi') || n.includes('combo')) return 'multiShot';
  if (n.includes('shoot') || n.includes('fire') || n.includes('arrow') || n.includes('attack')) return 'attack';
  if (n.includes('knock')) return 'knockback';
  if (n.includes('react') || n.includes('hurt') || n.includes('hit')) return 'hurt';
  if (n.includes('death') || n.includes('dying')) return 'death';
  if (n.includes('celebrate') || n.includes('victory')) return 'celebrate';

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