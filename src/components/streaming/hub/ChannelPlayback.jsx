import { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Link } from 'react-router-dom';
import { ArrowUpRight, X } from 'lucide-react';
import StreamMedia from './StreamMedia';
import { Artwork } from './DirectoryCards';
import { channelHref, formatCount } from './discoveryModel';

export function ChannelPresentation({ stream }) {
  return <><div className="console-channel-player"><StreamMedia key={stream.id} url={stream.isLive === false ? null : stream.url} poster={stream.thumbnail} title={stream.title} offline={stream.isLive === false} /></div><div className="console-channel-details"><Artwork key={stream.avatar} src={stream.avatar} avatar className="console-avatar" /><div><div className="console-eyebrow">{stream.isLive === false ? 'OFFLINE' : `LIVE • ${formatCount(stream.viewers)} watching`}</div><h2>{stream.name}</h2><p>{stream.title}</p><small>{stream.game} · {formatCount(stream.followers)} followers</small><div className="console-card-tags">{stream.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></div>{stream.bio && <p className="console-channel-bio">{stream.bio}</p>}</>;
}

export default function ChannelPlayback({ stream, onClose }) {
  const returnFocus = useRef(document.activeElement);
  return <Dialog.Root open={Boolean(stream)} onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Overlay className="console-watch-backdrop" /><Dialog.Content className="console-watch-dialog" onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus.current?.focus?.({ preventScroll: true }); }}><Dialog.Title className="sr-only">{stream?.name} live stream</Dialog.Title><Dialog.Description className="sr-only">Watch this channel, or open its full profile.</Dialog.Description><header><Link to={channelHref(stream)} className="console-text-button">Channel profile<ArrowUpRight size={16} /></Link><Dialog.Close aria-label="Close stream" className="console-icon-button"><X size={21} /></Dialog.Close></header>{stream && <ChannelPresentation stream={stream} />}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}
