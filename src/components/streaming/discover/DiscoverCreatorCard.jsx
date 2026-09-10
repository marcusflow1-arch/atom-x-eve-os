import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Gamepad2, ScanFace } from 'lucide-react';
import { Artwork } from '../hub/DirectoryCards';
import { channelHref, formatCount } from '../hub/discoveryModel';
import { creatorReason } from './creatorDiscoveryModel';

export default memo(function DiscoverCreatorCard({ creator, onMeet, now }) {
  return <article className="discover-creator-card" data-creator-id={creator.id}>
    <Link to={channelHref(creator)} className="discover-card-channel" aria-label={`Watch ${creator.name}: ${creator.title}`}>
      <div className="discover-card-art"><Artwork key={creator.thumbnail} src={creator.thumbnail} /><div /><span className="discover-live"><i />LIVE · {formatCount(creator.viewers)}</span><span className="discover-card-arrow"><ArrowUpRight size={18} /></span></div>
      <div className="discover-card-identity"><Artwork key={creator.avatar} src={creator.avatar} avatar className="console-avatar" /><div><h3>{creator.name}</h3><span className="discover-reason">{creatorReason(creator, now) || `${formatCount(creator.followers)} followers`}</span></div></div>
    </Link>
    <p className="discover-card-bio">{creator.bio || creator.tagline || creator.title}</p>
    <p className="discover-card-game"><Gamepad2 size={12} /><span>{creator.game}</span></p>
    <div className="discover-card-footer"><div className="discover-tag-list">{creator.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div><button type="button" onClick={() => onMeet(creator)} aria-label={`Quick look at ${creator.name}`}><ScanFace size={13} />Quick look</button></div>
  </article>;
});
