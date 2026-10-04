import {UserRound} from 'lucide-react';
import {COMPANION_MODELS} from './genesisAssets';
import {chooseCreatorBody} from './CharacterAppearanceEditor';
export default function GenesisCompanionFields({config,setConfig}) {
 return <section className="genesis-fields genesis-gender-step"><p className="genesis-kicker">01 / YOUR STARTING POINT</p><h1>Your avatar.<br/>Your identity.</h1><p className="genesis-description">Choose a starting body. Refine its appearance, layer your wardrobe and find a style that feels like you.</p>
 <div className="genesis-choices genesis-gender-choices">{Object.entries(COMPANION_MODELS).map(([gender])=><button type="button" key={gender} aria-pressed={config.gender===gender} onClick={()=>setConfig(c=>chooseCreatorBody(c,gender))}><span className="genesis-gender-icon"><UserRound size={22}/></span><strong>{gender==='male'?'Getsuga':'Artemis'}</strong><small>{gender==='male'?'Male body':'Female body'}</small></button>)}</div><p className="genesis-note">Both bodies keep their authored animations. Your wardrobe shows the layers fitted to the body you choose.</p></section>;
}
