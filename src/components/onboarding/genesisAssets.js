import * as THREE from 'three';

const root = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/';
const motionRoot = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/';

export const GLOBAL_AVATAR_MODEL_URL = '/models/luna-hi3d/warrior.glb';
export const GLOBAL_AVATAR_NAME = 'Luna AI';

export const COMPANION_MODELS = {
  male: { name: 'Luna AI Male', url: GLOBAL_AVATAR_MODEL_URL },
  female: { name: 'Erika Archer Female', url: root + '3f915913a_ErikaArcher.fbx' },
};

export const COMPANION_MOTIONS = [
  { name: 'Idle', url: root + '9922e6dd0_Idle.fbx', loop: true },
  { name: 'Look around', url: motionRoot + '3d7dec95f_standingidle02looking.fbx', loop: true },
  { name: 'Walk', url: motionRoot + '95ff06d1e_standingwalkforward.fbx', loop: true },
  { name: 'Run', url: root + '4edd51169_Running.fbx', loop: true },
  { name: 'Jump', url: root + 'b1e388a25_Jumping.fbx', loop: false },
];

export const AVATAR_STYLE_PRESETS = [
  { id: 'heroic_fantasy', name: 'Heroic Fantasy', short: 'Painterly cel', description: 'Clean heroic shapes, soft cel shading and luminous fantasy materials.', outline: 0.0022, exposure: 1.08, roughness: 0.72, metalness: 0.12 },
  { id: 'graphic_ink', name: 'Graphic Ink', short: 'Bold comic', description: 'Sharper contour lines, punchier contrast and graphic-novel material response.', outline: 0.0045, exposure: 1.02, roughness: 0.62, metalness: 0.1 },
  { id: 'grounded_rpg', name: 'Grounded RPG', short: 'Cinematic', description: 'More natural PBR response, restrained outlines and rugged realistic surface detail.', outline: 0.0008, exposure: 1.0, roughness: 0.52, metalness: 0.18 },
];

export const INTRO_VIDEO = root + 'e15ddf60a_Crafting_Premium_AI_Intro_Screen_Prompt.mp4';
export const PERSONALITIES = [
  { id: 'calm', name: 'Calm strategist', description: 'Thoughtful, patient, and measured.' },
  { id: 'warm', name: 'Warm guide', description: 'Supportive, empathetic, and encouraging.' },
  { id: 'curious', name: 'Curious explorer', description: 'Inquisitive, playful, and adventurous.' },
];

export const DEFAULT_AVATAR_APPEARANCE = {
  style_preset: 'heroic_fantasy',
  skin_tone: '#b97855',
  eye_color: '#5ca9c9',
  hair_color: '#2a1d18',
  eyelash_style: 'natural',
  hood_enabled: true,
  weapon_visible: true,
  height_scale: 1,
  body_proportions: { width: 1, depth: 1 },
  material_colors: {},
  morph_targets: {},
  face_scan_generated: false,
  face_model_url: '',
  face_capture_preview_url: '',
  base_body_gender: 'male',
  base_body_model_url: GLOBAL_AVATAR_MODEL_URL,
  tripo_model_id: '',
};

export function withAppearanceDefaults(value = {}) {
  return {
    ...DEFAULT_AVATAR_APPEARANCE,
    ...value,
    body_proportions: { ...DEFAULT_AVATAR_APPEARANCE.body_proportions, ...(value.body_proportions || {}) },
    material_colors: value.material_colors || {},
    morph_targets: value.morph_targets || {},
  };
}

export function getAvatarStylePreset(id) {
  return AVATAR_STYLE_PRESETS.find((preset) => preset.id === id) || AVATAR_STYLE_PRESETS[0];
}

export function companionModel(avatar) {
  const requested = String(avatar?.model_url || '').trim();
  const legacyDefault = /(?:608211a0f_YBot1\.fbx|Xbot\.glb|\/models\/(?:artemis\.gltf|ybot\.fbx|eve\.glb)|base_humanoid\.glb)/i.test(requested);
  if (requested && !legacyDefault && /^(https?:\/\/|\/)/i.test(requested)) return requested;
  return GLOBAL_AVATAR_MODEL_URL;
}

function rememberMaterialBase(material) {
  material.userData ||= {};
  if (!material.userData.genesisBase) {
    material.userData.genesisBase = {
      color: material.color?.clone?.() || null,
      roughness: typeof material.roughness === 'number' ? material.roughness : null,
      metalness: typeof material.metalness === 'number' ? material.metalness : null,
      opacity: typeof material.opacity === 'number' ? material.opacity : 1,
      transparent: Boolean(material.transparent),
      envMapIntensity: typeof material.envMapIntensity === 'number' ? material.envMapIntensity : null,
    };
  }
  return material.userData.genesisBase;
}

function hex(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : fallback;
}

function normalizedBone(value = '') {
  return String(value).replace(/^mixamorig\d*:/i, '').replace(/^mixamorig:/i, '').toLowerCase();
}

function influenceForBones(mesh, vertexIndex, wanted) {
  const indices = mesh.geometry?.getAttribute?.('skinIndex');
  const weights = mesh.geometry?.getAttribute?.('skinWeight');
  if (!indices || !weights) return 0;
  const slots = [
    [indices.getX(vertexIndex), weights.getX(vertexIndex)],
    [indices.getY(vertexIndex), weights.getY(vertexIndex)],
    [indices.getZ(vertexIndex), weights.getZ(vertexIndex)],
    [indices.getW(vertexIndex), weights.getW(vertexIndex)],
  ];
  return slots.reduce((sum, [boneIndex, weight]) => sum + (wanted.has(boneIndex) ? weight : 0), 0);
}

function vertexInBoneSpace(mesh, bone, vertexIndex, target) {
  target.fromBufferAttribute(mesh.geometry.getAttribute('position'), vertexIndex);
  if (typeof mesh.applyBoneTransform === 'function') mesh.applyBoneTransform(vertexIndex, target);
  else if (typeof mesh.boneTransform === 'function') mesh.boneTransform(vertexIndex, target);
  mesh.localToWorld(target);
  bone.worldToLocal(target);
  return target;
}

function ensureEmbeddedMasks(mesh) {
  const geometry = mesh.geometry;
  if (!mesh.isSkinnedMesh || !mesh.skeleton?.bones?.length || !geometry?.getAttribute?.('position')) return;
  if (geometry.getAttribute('genesisSkinMask') && geometry.getAttribute('genesisEyeMask')) return;

  const bones = mesh.skeleton.bones;
  const skinBones = new Set();
  const headBones = new Set();
  let headBone = null;
  bones.forEach((bone, index) => {
    const name = normalizedBone(bone.name);
    if (/^(head|neck|leftupperarm|leftforearm|lefthand|rightupperarm|rightforearm|righthand)$/.test(name)) skinBones.add(index);
    if (name === 'head') { headBones.add(index); headBone ||= bone; }
    if (name === 'neck') headBones.add(index);
  });
  if (!headBone) return;

  const count = geometry.getAttribute('position').count;
  const skinMask = new Float32Array(count);
  const headMask = new Float32Array(count);
  const eyeMask = new Float32Array(count);
  const headPoints = new Array(count);
  const bounds = new THREE.Box3();
  const point = new THREE.Vector3();

  mesh.updateMatrixWorld(true);
  mesh.skeleton.update();
  headBone.updateMatrixWorld(true);

  for (let i = 0; i < count; i += 1) {
    skinMask[i] = THREE.MathUtils.clamp(influenceForBones(mesh, i, skinBones), 0, 1);
    headMask[i] = THREE.MathUtils.clamp(influenceForBones(mesh, i, headBones), 0, 1);
    if (headMask[i] > .18) {
      vertexInBoneSpace(mesh, headBone, i, point);
      headPoints[i] = point.clone();
      bounds.expandByPoint(point);
    }
  }

  if (!bounds.isEmpty()) {
    const min = bounds.min, size = bounds.getSize(new THREE.Vector3());
    for (let i = 0; i < count; i += 1) {
      const p = headPoints[i];
      if (!p || headMask[i] < .18) continue;
      const nx = size.x ? (p.x - min.x) / size.x : .5;
      const ny = size.y ? (p.y - min.y) / size.y : .5;
      const nz = size.z ? (p.z - min.z) / size.z : .5;
      const xBand = ((nx > .12 && nx < .43) || (nx > .57 && nx < .88));
      const yBand = ny > .48 && ny < .74;
      const frontBand = nz > .42;
      eyeMask[i] = xBand && yBand && frontBand ? headMask[i] : 0;
    }
  }

  geometry.setAttribute('genesisSkinMask', new THREE.BufferAttribute(skinMask, 1));
  geometry.setAttribute('genesisEyeMask', new THREE.BufferAttribute(eyeMask, 1));
}

function ensureEmbeddedSurfaceTuning(mesh, material) {
  if (!mesh?.isSkinnedMesh || !material) return null;
  ensureEmbeddedMasks(mesh);
  if (!mesh.geometry.getAttribute('genesisSkinMask')) return null;

  material.userData ||= {};
  if (material.userData.genesisAvatarUniforms) return material.userData.genesisAvatarUniforms;

  const uniforms = {
    skinColor: { value: new THREE.Color('#b97855') },
    eyeColor: { value: new THREE.Color('#5ca9c9') },
    skinStrength: { value: .92 },
    eyeStrength: { value: .92 },
  };
  const previous = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    previous?.(shader, renderer);
    shader.uniforms.genesisSkinColor = uniforms.skinColor;
    shader.uniforms.genesisEyeColor = uniforms.eyeColor;
    shader.uniforms.genesisSkinStrength = uniforms.skinStrength;
    shader.uniforms.genesisEyeStrength = uniforms.eyeStrength;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nattribute float genesisSkinMask;\nattribute float genesisEyeMask;\nvarying float vGenesisSkinMask;\nvarying float vGenesisEyeMask;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvGenesisSkinMask = genesisSkinMask;\nvGenesisEyeMask = genesisEyeMask;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform vec3 genesisSkinColor;\nuniform vec3 genesisEyeColor;\nuniform float genesisSkinStrength;\nuniform float genesisEyeStrength;\nvarying float vGenesisSkinMask;\nvarying float vGenesisEyeMask;`)
      .replace('#include <map_fragment>', `#include <map_fragment>\n{
        vec3 originalGenesis = diffuseColor.rgb;
        float genesisMax = max(max(originalGenesis.r, originalGenesis.g), originalGenesis.b);
        float genesisMin = min(min(originalGenesis.r, originalGenesis.g), originalGenesis.b);
        float genesisLum = dot(originalGenesis, vec3(0.299, 0.587, 0.114));
        float genesisWarm = smoothstep(-0.025, 0.10, originalGenesis.r - originalGenesis.g) * smoothstep(-0.05, 0.11, originalGenesis.g - originalGenesis.b);
        float genesisMid = smoothstep(0.08, 0.24, genesisMax) * (1.0 - smoothstep(0.78, 0.97, genesisMin));
        float genesisSkinLike = clamp(genesisWarm * genesisMid, 0.0, 1.0);
        vec3 genesisSkin = genesisSkinColor * mix(0.58, 1.22, clamp(genesisLum, 0.0, 1.0));
        diffuseColor.rgb = mix(diffuseColor.rgb, genesisSkin, clamp(vGenesisSkinMask * genesisSkinLike * genesisSkinStrength, 0.0, 1.0));
        float genesisDarkIris = 1.0 - smoothstep(0.22, 0.58, genesisLum);
        vec3 genesisEye = genesisEyeColor * mix(0.45, 1.05, clamp(genesisLum + 0.22, 0.0, 1.0));
        diffuseColor.rgb = mix(diffuseColor.rgb, genesisEye, clamp(vGenesisEyeMask * genesisDarkIris * genesisEyeStrength, 0.0, 1.0));
      }`);
  };
  const oldCacheKey = material.customProgramCacheKey?.bind(material);
  material.customProgramCacheKey = () => `${oldCacheKey ? oldCacheKey() : ''}|atomxe-avatar-surface-v2`;
  material.userData.genesisAvatarUniforms = uniforms;
  material.needsUpdate = true;
  return uniforms;
}

function modelUsesEmbeddedAvatarRig(model) {
  let embedded = false;
  model.traverse?.((node) => { if (node.userData?.avatarRig === 'luna-hi3d-v1') embedded = true; });
  return embedded;
}

export function applyCompanionAppearance(model, rawAppearance = {}) {
  if (!model) return;
  const appearance = withAppearanceDefaults(rawAppearance);
  const style = getAvatarStylePreset(appearance.style_preset);
  const embeddedRig = modelUsesEmbeddedAvatarRig(model);

  if (!model.userData.genesisBaseScaleVector) model.userData.genesisBaseScaleVector = model.scale.clone();
  const baseScale = model.userData.genesisBaseScaleVector;
  const width = Number(appearance.body_proportions?.width || 1);
  const depth = Number(appearance.body_proportions?.depth || 1);
  model.scale.set(
    baseScale.x * Math.min(1.12, Math.max(0.88, width)),
    baseScale.y * Math.min(1.18, Math.max(0.84, Number(appearance.height_scale || 1))),
    baseScale.z * Math.min(1.1, Math.max(0.9, depth)),
  );

  model.traverse((node) => {
    const nodeKey = `${node.name || ''} ${node.type || ''}`.toLowerCase();
    if (/hood|cowl/.test(nodeKey)) node.visible = appearance.hood_enabled !== false;
    if (/bow|quiver|arrow/.test(nodeKey)) node.visible = appearance.weapon_visible !== false;
    if (!node.isMesh) return;

    node.castShadow = true;
    node.receiveShadow = true;
    const materials = (Array.isArray(node.material) ? node.material : [node.material]).filter(Boolean);
    materials.forEach((material, index) => {
      const base = rememberMaterialBase(material);
      const materialKey = `${node.name}:${index}`;
      const signature = `${node.name || ''} ${material.name || ''}`.toLowerCase();

      if (base.color && material.color) material.color.copy(base.color);
      if (base.roughness !== null && typeof material.roughness === 'number') material.roughness = base.roughness;
      if (base.metalness !== null && typeof material.metalness === 'number') material.metalness = base.metalness;
      material.opacity = base.opacity;
      material.transparent = base.transparent;

      const isEye = /eye(?!lash)|iris/.test(signature);
      const isLash = /lash/.test(signature);
      const isHair = /hair|brow/.test(signature);
      const isSkin = /body|skin|face|head|hand|arm|leg/.test(signature) && !/cloth|clothes|armor/.test(signature);

      if (embeddedRig) {
        const tuning = ensureEmbeddedSurfaceTuning(node, material);
        if (tuning) {
          tuning.skinColor.value.set(hex(appearance.skin_tone, '#b97855'));
          tuning.eyeColor.value.set(hex(appearance.eye_color, '#5ca9c9'));
        }
      } else {
        if (material.color && isSkin) material.color.set(hex(appearance.skin_tone, '#b97855'));
        if (material.color && isEye) material.color.set(hex(appearance.eye_color, '#5ca9c9'));
      }
      if (material.color && isHair) material.color.set(hex(appearance.hair_color, '#2a1d18'));
      if (isLash) {
        const lashOpacity = appearance.eyelash_style === 'soft' ? 0.72 : appearance.eyelash_style === 'bold' ? 1 : 0.88;
        material.opacity = lashOpacity;
        material.transparent = lashOpacity < 1 || base.transparent;
      }

      if (typeof material.roughness === 'number') material.roughness = style.roughness;
      if (typeof material.metalness === 'number' && !isSkin && !isEye && !isLash) material.metalness = Math.max(material.metalness, style.metalness);
      if (typeof material.envMapIntensity === 'number') material.envMapIntensity = style.id === 'grounded_rpg' ? 1.35 : 1.05;
      material.side = THREE.DoubleSide;

      if (material.color && /^#[0-9a-f]{6}$/i.test(appearance.material_colors?.[materialKey] || '')) material.color.set(appearance.material_colors[materialKey]);
      if (!embeddedRig) material.needsUpdate = true;
    });

    if (node.morphTargetDictionary) {
      Object.entries(node.morphTargetDictionary).forEach(([name, index]) => {
        node.morphTargetInfluences[index] = appearance.morph_targets?.[`${node.name}:${name}`] || 0;
      });
    }
  });
}
