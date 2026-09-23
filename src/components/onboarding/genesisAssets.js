import * as THREE from 'three';
import {FIT_DEFAULTS,normalizeFaceShape} from './avatarAppearanceData';
import {isHi3DAvatar,applyFaceGeometry,applyAvatarSurface} from './modelAppearance';

const root = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/';
const motionRoot = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/';

// Canonical male Luna body supplied through Admin > 3D Models > "male".
// Model3D id: 6ab3bf0728d93c06fcff4c05. This is the user's Getsuga_Tensho_Character.glb
// and contains the Idle + GetsugaTensho animation/effect package used by card casts.
export const GLOBAL_AVATAR_MODEL_ID = '6ab3bf0728d93c06fcff4c05';
export const GLOBAL_AVATAR_MODEL_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/d646be928_Getsuga_Tensho_Character.glb';
// Admin > 3D Models > "artemis" (Model3D id: 6aa956f030a57c7e90bbc7e6).
// This is the only female base body used by Genesis.
export const FEMALE_ARTEMIS_MODEL_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/9c8e45258_Hi3D_Cel-ShadedGreekMythicArcherArtemis3DModel_allparts_20260915_100610.glb';
export const GLOBAL_AVATAR_NAME = 'Luna AI';

// Female creation intentionally exposes one canonical body only.
export const FEMALE_MODEL_VARIANTS = {
  artemis_archer: { id: 'artemis_archer', name: 'Artemis', url: FEMALE_ARTEMIS_MODEL_URL, idleOnly: true, isDefault: true },
};

export const COMPANION_MODELS = {
  male: { name: 'Luna AI Male', url: GLOBAL_AVATAR_MODEL_URL },
  female: FEMALE_MODEL_VARIANTS.artemis_archer,
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
  {id:'anime',name:'Anime',short:'Clean cel',description:'Clean color bands and fine lines.',outline:.003,exposure:1.12,roughness:.8,metalness:.04},
  {id:'watercolor',name:'Watercolor',short:'Soft wash',description:'Warm pastel light and muted contrast.',outline:.0005,exposure:1.12,roughness:.9,metalness:0},
  {id:'noir',name:'Noir',short:'Monochrome',description:'Black and white with graphic shadows.',outline:.0035,exposure:1,roughness:.65,metalness:.1},
  {id:'neon',name:'Neon',short:'Cool glow',description:'Saturated color and cool highlights.',outline:.0018,exposure:1.15,roughness:.4,metalness:.24},
];

export const INTRO_VIDEO = root + 'e15ddf60a_Crafting_Premium_AI_Intro_Screen_Prompt.mp4';
export const PERSONALITIES = [
  { id: 'calm', name: 'Calm strategist', description: 'Thoughtful, patient, and measured.' },
  { id: 'warm', name: 'Warm guide', description: 'Supportive, empathetic, and encouraging.' },
  { id: 'curious', name: 'Curious explorer', description: 'Inquisitive, playful, and adventurous.' },
];

export const DEFAULT_AVATAR_APPEARANCE = {
  ...FIT_DEFAULTS,
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

};

export function withAppearanceDefaults(value = {}) {
  return {
    ...DEFAULT_AVATAR_APPEARANCE,
    ...value,
    face_shape: normalizeFaceShape(value.face_shape),
    body_proportions: { ...DEFAULT_AVATAR_APPEARANCE.body_proportions, ...(value.body_proportions || {}) },
    material_colors: value.material_colors || {},
    morph_targets: value.morph_targets || {},
  };
}

export function getAvatarStylePreset(id) {
  return AVATAR_STYLE_PRESETS.find((preset) => preset.id === id) || AVATAR_STYLE_PRESETS[0];
}

export function femaleModelVariant() {
  return FEMALE_MODEL_VARIANTS.artemis_archer;
}

export function companionModel(avatar) {
  const gender = avatar?.gender === 'female' ? 'female' : 'male';
  if (gender === 'female') return FEMALE_ARTEMIS_MODEL_URL;

  // Male Luna is intentionally pinned to the Admin "male" GLB so card-bound
  // animation effects always target the same controllable rig that owns the
  // embedded effect clips. This avoids a card cast being sent to an unrelated
  // dashboard body that cannot play the effect package.
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

export function applyCompanionAppearance(model, rawAppearance = {}) {
  if (!model) return;
  const appearance = withAppearanceDefaults(rawAppearance);
  const style = getAvatarStylePreset(appearance.style_preset);
  const embeddedRig = isHi3DAvatar(model);

  if (!model.userData.genesisBaseScaleVector) model.userData.genesisBaseScaleVector = model.scale.clone();
  const baseScale = model.userData.genesisBaseScaleVector;
  const width = Number(appearance.body_proportions?.width || 1);
  const depth = Number(appearance.body_proportions?.depth || 1);
  model.scale.set(
    baseScale.x * Math.min(1.12, Math.max(0.88, width)),
    baseScale.y * Math.min(1.18, Math.max(0.84, Number(appearance.height_scale || 1))),
    baseScale.z * Math.min(1.1, Math.max(0.9, depth)),
  );

  applyFaceGeometry(model, appearance, embeddedRig);
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
      const signature = (material.name || node.name || '').toLowerCase();

      if (base.color && material.color) material.color.copy(base.color);
      if (base.roughness !== null && typeof material.roughness === 'number') material.roughness = base.roughness;
      if (base.metalness !== null && typeof material.metalness === 'number') material.metalness = base.metalness;
      material.opacity = base.opacity;
      material.transparent = base.transparent;

      const isEye = /eye(?!lash)|iris/.test(signature);
      const isLash = /lash/.test(signature);
      const isHair = /hair|brow/.test(signature);
      const isSkin = /body|skin|face|head|hand|arm|leg/.test(signature) && !/cloth|clothes|armor/.test(signature);

      if (!embeddedRig && material.color) {
        if (isSkin && appearance.skin_tint_enabled) material.color.set(hex(appearance.skin_tone, '#bb927c'));
        if (isEye && appearance.eye_tint_enabled) material.color.set(hex(appearance.eye_color, '#5ca9c9'));
        if (isHair && appearance.hair_tint_enabled) material.color.set(hex(appearance.hair_color, '#323030'));
      }
      applyAvatarSurface(node, material, appearance, embeddedRig);
      if (isLash) {
        const lashOpacity = appearance.eyelash_style === 'soft' ? 0.72 : appearance.eyelash_style === 'bold' ? 1 : 0.88;
        material.opacity = lashOpacity;
        material.transparent = lashOpacity < 1 || base.transparent;
      }

      if (typeof material.roughness === 'number') material.roughness = style.roughness;
      if (typeof material.metalness === 'number' && !isSkin && !isEye && !isLash) material.metalness = Math.max(material.metalness, style.metalness);
      if (typeof material.envMapIntensity === 'number') material.envMapIntensity = style.id === 'grounded_rpg' ? 1.35 : 1.05;
      material.side = THREE.DoubleSide;

      if (!embeddedRig && material.color && /^#[0-9a-f]{6}$/i.test(appearance.material_colors?.[materialKey] || '')) material.color.set(appearance.material_colors[materialKey]);

    });

    if (node.morphTargetDictionary) {
      Object.entries(node.morphTargetDictionary).forEach(([name, index]) => {
        node.morphTargetInfluences[index] = appearance.morph_targets?.[`${node.name}:${name}`] || 0;
      });
    }
  });
}
