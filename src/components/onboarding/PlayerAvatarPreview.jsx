import {useCompanionIdentity} from './CompanionIdentityContext';
import {playerAppearance} from './playerAppearance';
import GenesisModelPreview from './GenesisModelPreview';

export default function PlayerAvatarPreview({config,...props}){
 const saved=useCompanionIdentity();
 const source=config
  ? {
      ...(saved||{}),
      ...config,
      body_proportions:{...(saved?.body_proportions||{}),...(config.body_proportions||{})},
      material_colors:config.material_colors??saved?.material_colors,
      morph_targets:config.morph_targets??saved?.morph_targets,
    }
  : saved;
 return <GenesisModelPreview config={playerAppearance(source)} compact {...props}/>;
}