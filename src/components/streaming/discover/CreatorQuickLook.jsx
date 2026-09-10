import { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Gamepad2, Radio, Trophy, X } from 'lucide-react';
import { Artwork } from '../hub/DirectoryCards';
import { channelHref, formatCount } from '../hub/discoveryModel';
import StreamMedia from '../hub/StreamMedia';
import useCreatorGoals from './useCreatorGoals';

export default function CreatorQuickLook({ creator, onClose }) {
  const returnFocus = useRef(document.activeElement);
  const goals = useCreatorGoals(creator.streamerId);
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Overlay className="discover-quick-backdrop" /><Dialog.Content className="discover-quick-drawer console-hub" onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus.current?.focus?.({ preventScroll: true }); }}>
    <header><span className="console-eyebrow">Behind the stream</span><Dialog.Close className="console-icon-button" aria-label="Close creator quick look"><X size={20} /></Dialog.Close></header>
    <div className="discover-quick-identity"><Artwork key={creator.avatar} src={creator.avatar} avatar className="console-avatar" /><div><Dialog.Title>{creator.name}</Dialog.Title><span className="discover-quick-status"><Radio size={12} />{creator.isLive === false ? 'Currently offline' : `Live · ${formatCount(creator.viewers)} watching`}</span></div></div>
    <Dialog.Description className="discover-quick-bio">{creator.bio || creator.tagline || 'Get to know this creator through their current stream and achievement goals.'}</Dialog.Description>
    <div className="discover-quick-game"><Gamepad2 size={14} /><div><small>{creator.isLive === false ? 'Last playing' : 'Playing now'}</small><strong>{creator.game}</strong></div><span>{formatCount(creator.followers)} followers</span></div>
    <div className="discover-tag-list">{creator.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
    <div className="discover-quick-player"><StreamMedia key={creator.id} url={creator.isLive === false ? null : creator.url} poster={creator.thumbnail} title={creator.title} offline={creator.isLive === false} /></div><p className="discover-quick-stream-title">{creator.title}</p>
    <section className="discover-goals" aria-labelledby="discover-goals-heading"><div><Trophy size={15} /><h3 id="discover-goals-heading">On the achievement hunt</h3></div><p>Cards and achievements they are working toward.</p>
      {goals.isPending ? <p role="status">Loading public goals…</p> : goals.isError ? <p role="status">Achievement goals could not load. <button type="button" onClick={() => goals.refetch()}>Retry</button></p> : <>{goals.data?.goals.map((goal) => <article key={goal.id}><div><strong>{goal.title}</strong>{goal.rarity && <span>{goal.rarity}</span>}</div><small>{goal.game}</small>{goal.percent !== null && <div className="discover-goal-progress"><progress aria-label={`${goal.title} progress`} max="100" value={goal.percent} /><span>{goal.percent}%</span></div>}</article>)}{!goals.data?.goals.length && <p>No public goals available yet.</p>}{goals.data?.incomplete && <p>Some goals could not load. <button type="button" onClick={() => goals.refetch()}>Retry</button></p>}</>}
    </section>
    <footer><Link to={channelHref(creator)} className="discover-primary">{creator.isLive === false ? 'Visit channel' : 'Watch on their channel'}<ArrowUpRight size={16} /></Link></footer>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
