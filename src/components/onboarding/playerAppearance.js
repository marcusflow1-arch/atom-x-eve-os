import {withAppearanceDefaults} from './genesisAssets';
import {HI3D_MODEL_URL} from './embeddedAvatarController';
export function playerAppearance(value) {
 const avatar=value||{};
 return withAppearanceDefaults(Number(avatar.appearance_version)>=3?avatar:{...avatar,gender:'male',model_url:HI3D_MODEL_URL});
}
