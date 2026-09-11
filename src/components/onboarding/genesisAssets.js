const root = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/';
const motionRoot = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/';
export const COMPANION_MODELS = { female: { name: 'Erika Archer', url: root + '3f915913a_ErikaArcher.fbx' }, male: { name: 'White Y-Bot', url: root + '608211a0f_YBot1.fbx' } };
export const COMPANION_MOTIONS = [ { name: 'Idle', url: root + '9922e6dd0_Idle.fbx' }, { name: 'Look around', url: motionRoot + '3d7dec95f_standingidle02looking.fbx' }, { name: 'Walk', url: motionRoot + '95ff06d1e_standingwalkforward.fbx' } ];
export const INTRO_VIDEO = root + 'e15ddf60a_Crafting_Premium_AI_Intro_Screen_Prompt.mp4';
export const PERSONALITIES = [ { id: 'calm', name: 'Calm strategist', description: 'Thoughtful, patient, and measured.' }, { id: 'warm', name: 'Warm guide', description: 'Supportive, empathetic, and encouraging.' }, { id: 'curious', name: 'Curious explorer', description: 'Inquisitive, playful, and adventurous.' } ];
export function companionModel(avatar) { return /^https:\/\//.test(avatar?.model_url || '') ? avatar.model_url : COMPANION_MODELS[avatar?.gender || 'male'].url; }
export function applyCompanionAppearance(model, appearance = {}) {
  if (!model.userData.genesisBaseScale) model.userData.genesisBaseScale = model.scale.y;
  model.scale.y = model.userData.genesisBaseScale * (appearance.height_scale || 1);
  model.traverse(node => {
    if (!node.isMesh) return;
    (Array.isArray(node.material) ? node.material : [node.material]).filter(Boolean).forEach((material, index) => {
      const key = `${node.name}:${index}`;
      if (!material.userData.genesisColor && material.color) material.userData.genesisColor = material.color.clone();
      if (material.color) material.color.copy(material.userData.genesisColor);
      if (/^#[0-9a-f]{6}$/i.test(appearance.material_colors?.[key] || '')) material.color.set(appearance.material_colors[key]);
    });
    if (node.morphTargetDictionary) Object.entries(node.morphTargetDictionary).forEach(([name, index]) => { node.morphTargetInfluences[index] = appearance.morph_targets?.[`${node.name}:${name}`] || 0; });
  });
}