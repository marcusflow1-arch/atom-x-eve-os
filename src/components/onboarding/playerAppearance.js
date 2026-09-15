import {COMPANION_MODELS,companionModel,withAppearanceDefaults} from './genesisAssets';

export function playerAppearance(value) {
 const avatar=value||{};
 const gender=avatar.gender==='female'?'female':'male';
 const upgraded=Number(avatar.appearance_version)>=3
  ? {...avatar,gender}
  : {...avatar,appearance_version:3,gender,model_url:avatar.model_url||COMPANION_MODELS[gender].url};
 const normalized=withAppearanceDefaults(upgraded);
 return {...normalized,gender,model_url:companionModel(normalized)};
}
