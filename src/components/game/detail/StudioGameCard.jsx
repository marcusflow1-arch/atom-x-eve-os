import GameImage from './GameImage';
import {gameArtwork} from './gameDetailData';
import {comingSoon,label,priceLabel} from '@/components/store/redesign/discovery';

export default function StudioGameCard({game,onSelect}){
 return <article className="gd-catalog-card"><button onClick={()=>onSelect(game.id)}>
  <div className="gd-catalog-art"><GameImage src={gameArtwork(game)} fallback={game.cover_image} alt=""/>{comingSoon(game)&&<span>Coming soon</span>}</div>
  <h3>{game.title}</h3><p>{label(game.genre)}</p><strong>{priceLabel(game)}</strong>
 </button></article>;
}
