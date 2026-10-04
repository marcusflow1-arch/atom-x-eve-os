import * as THREE from 'three';

// The user's current character bodies. Both GLBs keep the same skeletons as
// the originals, so every older card animation still plays on them, and they
// add the authored Chidori clips:
//   male   (Getsuga_Tensho_Character_v3.glb, Oct 2026): Idle (48 s living loop
//          with facial animation; the stretch, neck roll, yawn and look-around
//          are part of the loop), Combat_Idle, Dodge_Left/Right, GetsugaTensho,
//          Chidori_Attack_01, Chidori_Ultimate, Chidori_Hit_Stun_Fall. Adds eye,
//          mouth and jaw rigs plus 31 facial shape keys on SK_Character.
//   female (Artemis_Character_v3.glb, Oct 2026): Idle (24 s living loop with
//          facial animation), Combat_Idle, Bow_Draw/Sheathe, Call_Of_The_Husky,
//          Rain_Of_Arrows, Lunar_Beam (full-body flow animation: hips, spine,
//          legs and neck follow the arms), Chidori_Ultimate, Chidori_Hit_Stun_Fall.
//          Adds eye, mouth and jaw rigs plus 30 facial shape keys on Artemis_Body.
// They ship with the app (public/models/characters) so a GitHub sync is enough
// to update them — no re-upload through the Base44 editor.
// Versioned file name: a new body must never be served from a cached copy of
// the previous one.
export const MALE_CHARACTER_MODEL_URL = '/models/characters/Getsuga_Tensho_Character_v3.glb';
export const FEMALE_CHARACTER_MODEL_URL = '/models/characters/Artemis_Character_v3.glb';

// Avatar records, Skill Book cards and backend defaults still store the old
// hosted URLs (they are validated identifiers on the server). Every load of
// one of those files is redirected to the new body instead.
const LEGACY_MODEL_FILES = [
  { pattern: /d646be928_Getsuga_Tensho_Character\.glb(?:[?#].*)?$/i, url: MALE_CHARACTER_MODEL_URL },
  { pattern: /96bb872db_Artemis_Character(?:_v2)?\.glb(?:[?#].*)?$/i, url: FEMALE_CHARACTER_MODEL_URL },
  { pattern: /^(?:https?:\/\/[^/]+)?\/getsuga\/Getsuga_Character\.glb(?:[?#].*)?$/i, url: MALE_CHARACTER_MODEL_URL },
  // Previous in-app female body (Sep / early Oct 2026).
  { pattern: /^(?:https?:\/\/[^/]+)?\/models\/characters\/Artemis_Character(?:_v2)?\.glb(?:[?#].*)?$/i, url: FEMALE_CHARACTER_MODEL_URL },
  // Previous in-app male bodies (Sep / early Oct 2026).
  { pattern: /^(?:https?:\/\/[^/]+)?\/models\/characters\/Getsuga_Tensho_Character(?:_v2)?\.glb(?:[?#].*)?$/i, url: MALE_CHARACTER_MODEL_URL },
];

export function resolveCharacterModelUrl(url) {
  const value = String(url || '');
  if (!value) return value;
  const match = LEGACY_MODEL_FILES.find((entry) => entry.pattern.test(value));
  return match ? match.url : value;
}

export function isCharacterModelUrl(url) {
  const resolved = resolveCharacterModelUrl(url);
  return resolved === MALE_CHARACTER_MODEL_URL || resolved === FEMALE_CHARACTER_MODEL_URL;
}

let installed = false;

/**
 * Route every three.js loader that uses the default LoadingManager (GLTFLoader,
 * FBXLoader, TextureLoader… created without a custom manager) through the
 * redirect above. Loaders built with their own manager keep their own
 * modifier; the avatar, dashboard and PvP loaders all use the default one.
 */
export function installCharacterModelOverrides() {
  if (installed) return;
  installed = true;
  const manager = THREE.DefaultLoadingManager;
  const previous = manager.urlModifier;
  manager.setURLModifier((url) => {
    const next = resolveCharacterModelUrl(url);
    return typeof previous === 'function' ? previous(next) : next;
  });
}

installCharacterModelOverrides();

/**
 * Bounds of the character body only. The character GLBs also carry their
 * ability VFX meshes (Artemis' husky, arrows and lunar beam sit metres in front
 * of her at rest, scaled to ~0), which must not affect scaling or centring.
 * Falls back to the whole object when there is no skinned mesh.
 */
export function characterBodyBounds(root) {
  const box = new THREE.Box3();
  if (!root) return box;
  root.updateMatrixWorld(true);
  let skinned = 0;
  root.traverse((node) => {
    if (!node.isSkinnedMesh) return;
    box.expandByObject(node);
    skinned += 1;
  });
  return skinned && !box.isEmpty() ? box : box.setFromObject(root);
}
