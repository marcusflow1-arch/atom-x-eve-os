// Loads companion idle + walk clips from the admin AnimationFBX library
// (folder = "companion"). Used by GameWorld3D when the companion's mesh GLB
// has no embedded animation clips of its own.
//
// Picks one entry whose animation_type is "idle" (or name contains "idle"),
// one whose type is "walk" (or name contains "walk"), then loads each file
// and returns the matching clip from inside it.

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { base44 } from '@/api/base44Client';

/**
 * @param {THREE.FBXLoader} fbxLoader  shared FBX loader instance from the caller
 * @returns {Promise<THREE.AnimationClip[]>}  idle then walk (clips that loaded)
 */
export async function loadCompanionFolderClips(fbxLoader) {
  const entries = await base44.entities.AnimationFBX.filter({ folder: 'companion' });
  if (!entries || entries.length === 0) {
    console.warn('Companion: no AnimationFBX entries found in "companion" folder');
    return [];
  }

  const pickEntry = (preferredType, fallbackKeyword) =>
    entries.find((e) => e.animation_type === preferredType) ||
    entries.find((e) => (e.name || '').toLowerCase().includes(fallbackKeyword));

  const idleEntry = pickEntry('idle', 'idle');
  const walkEntry = pickEntry('walk', 'walk');
  const runEntry  = pickEntry('run',  'run');

  const loadClipsFromUrl = (url) => new Promise((resolve) => {
    const ext = (url.split('.').pop() || '').toLowerCase();
    if (ext === 'fbx') {
      fbxLoader.load(url, (af) => resolve(af.animations || []), undefined, () => resolve([]));
    } else {
      const gl = new GLTFLoader();
      gl.load(url, (g) => resolve(g.animations || []), undefined, () => resolve([]));
    }
  });

  // Group by URL so we only fetch each source file once
  const urlsNeeded = [idleEntry, walkEntry, runEntry].filter(Boolean).map((e) => e.file_url);
  const uniqueUrls = [...new Set(urlsNeeded)];
  const urlToClips = {};
  await Promise.all(uniqueUrls.map(async (u) => {
    urlToClips[u] = await loadClipsFromUrl(u);
  }));

  const pickClipByName = (entry) => {
    if (!entry) return null;
    const clips = urlToClips[entry.file_url] || [];
    if (clips.length === 0) return null;
    const lc = (entry.name || '').toLowerCase();
    return clips.find((c) => (c.name || '').toLowerCase() === lc)
        || clips.find((c) => (c.name || '').toLowerCase().includes(lc))
        || clips[0];
  };

  const idleClip = pickClipByName(idleEntry);
  const walkClip = pickClipByName(walkEntry);
  const runClip  = pickClipByName(runEntry);
  const out = [];
  if (idleClip) { idleClip.name = 'idle'; out.push(idleClip); }
  if (walkClip && walkClip !== idleClip) { walkClip.name = 'walk'; out.push(walkClip); }
  if (runClip && runClip !== idleClip && runClip !== walkClip) { runClip.name = 'run'; out.push(runClip); }
  return out;
}