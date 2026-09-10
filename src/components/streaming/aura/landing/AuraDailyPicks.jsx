import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { Artwork } from '../../hub/DirectoryCards';
import { formatCount } from '../../hub/discoveryModel';
import { creatorReason } from '../../discover/creatorDiscoveryModel';

export default memo(function AuraDailyPicks({ creators, now, loading, onWatch }) {
  return <><div className="aura-picks-grid">{creators.map((creator, index) => <article className="aura-daily-pick" key={creator.id} style={{ '--pick-accent': ['#75a9b7', '#ac99bc', '#90b3a9'][index] }}><div className="aura-pick-art"><Artwork key={creator.thumbnail} src={creator.thumbnail} /><span className="console-live-badge">LIVE <span>• {formatCount(creator.viewers)} watching</span></span><span className="aura-pick-number">0{index + 1}</span></div><div className="aura-pick-copy"><div className="aura-pick-identity"><Artwork key={creator.avatar} src={creator.avatar} avatar className="console-avatar" /><div><h3>{creator.name}</h3><span>{creator.game}</span></div></div><p>{creator.tagline || creator.bio || creator.title}</p><div className="aura-pick-footer"><small><Sparkles size={12} />{creatorReason(creator, now)}</small><button type="button" className="console-text-button" aria-label={`Jump in with ${creator.name}`} onClick={() => onWatch(creator)}>Jump In<Play size={12} fill="currentColor" /></button></div></div></article>)}</div>{!creators.length && <div className="aura-section-empty" role="status"><Sparkles size={20} /><div><h3>{loading ? 'Putting today’s picks together…' : 'Fresh voices, on their way.'}</h3><p>New creators and smaller live communities rotate here each day.</p></div></div>}<div className="aura-section-footnote"><span>Daily rotation · New creators & smaller communities · Refreshes at 00:00 UTC</span><Link to="/discover" className="console-text-button">Find your people<ArrowRight size={14} /></Link></div></>;
});
