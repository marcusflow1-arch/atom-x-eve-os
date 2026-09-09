import { Scissors } from 'lucide-react';
import ClipCard from './ClipCard';

export default function CommunityClipsRail({ clips, requests = [], selectedId, onSelectClip, onSelectRequest }) {
  return <>{clips.map((clip) => <ClipCard key={clip.id} clip={clip} selected={selectedId === clip.id} onSelect={onSelectClip} />)}{requests.map((request) => <button type="button" key={request.id} className="gallery-request-card" onClick={() => onSelectRequest(request)}><span className="gallery-eyebrow"><Scissors size={13} /> Community request</span><strong>{request.clip_title || 'Requested moment'}</strong><p>{request.content}</p><small>{request.author_name || 'Viewer'}</small></button>)}</>;
}
