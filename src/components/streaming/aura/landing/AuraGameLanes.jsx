import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Artwork, moveRailFocus } from '../../hub/DirectoryCards';
import { formatCount } from '../../hub/discoveryModel';
import { AURA_GAME_LANES } from './auraFrontPageModel';
import { formatEditionDate } from './auraDailyModel';

export default memo(function AuraGameLanes({ lanes, onGame, loading }) {
  const [choice, setSelected] = useState(null);
  const selected = choice || (lanes.releases.length ? 'releases' : lanes.anticipated.length ? 'anticipated' : lanes.missed.length ? 'missed' : 'all');
  const lane = AURA_GAME_LANES.find((item) => item.id === selected);
  const games = lanes[selected].slice(0, 12);
  const selectTab = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    moveRailFocus(event);
    const id = document.activeElement?.dataset.lane;
    if (id) setSelected(id);
  };
  return <><div className="aura-game-lane-tabs" role="tablist" aria-label="Game discovery lanes" onKeyDown={selectTab}>{AURA_GAME_LANES.map((item) => <button type="button" role="tab" key={item.id} id={`aura-lane-${item.id}`} data-lane={item.id} aria-selected={selected === item.id} tabIndex={selected === item.id ? 0 : -1} aria-controls="aura-game-lane-panel" onClick={() => setSelected(item.id)}>{item.label}</button>)}</div><div id="aura-game-lane-panel" role="tabpanel" aria-labelledby={`aura-lane-${selected}`} tabIndex={0} className="aura-game-lane-panel"><p className="aura-lane-description">{lane.description}</p><div className="aura-game-poster-grid">{games.map((game) => <button type="button" className="aura-game-poster" key={game.id} onClick={() => onGame(game)} aria-label={`Find streams for ${game.title}`}><div className="aura-game-poster-art"><Artwork key={game.image} src={game.image} /><span>{game.liveCount > 0 ? `${formatCount(game.liveCount)} live streams` : game.genre}</span></div><strong>{game.title}</strong><small>{selected === 'anticipated' ? `${game.votes} recent votes` : selected === 'releases' ? formatEditionDate(game.releasedAt) : `${formatCount(game.viewers)} watching`}</small></button>)}</div>{!games.length && <div className="aura-section-empty" role="status"><div><h3>{loading ? 'Loading the game directory…' : lane.empty}</h3><p>There’s still a whole directory to explore.</p>{selected !== 'all' && <button type="button" className="console-text-button" onClick={() => setSelected('all')}>Browse all games<ArrowRight size={14} /></button>}</div></div>}</div><div className="aura-section-footnote"><span>Choose a game to see its live channels.</span><Link to="/streaming" className="console-text-button">Full Streamers directory<ArrowRight size={14} /></Link></div></>;
});
