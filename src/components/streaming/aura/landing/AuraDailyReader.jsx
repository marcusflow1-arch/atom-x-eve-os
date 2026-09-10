import { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import ReactMarkdown from 'react-markdown';
import { X } from 'lucide-react';
import StreamMedia from '../../hub/StreamMedia';
import { Artwork } from '../../hub/DirectoryCards';
import { formatEditionDate } from './auraDailyModel';

export default function AuraDailyReader({ story, onClose }) {
  const returnFocus = useRef(document.activeElement);
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Overlay className="aura-reader-backdrop" /><Dialog.Content className={`aura-daily-reader console-hub ${story.kind === 'video' ? 'is-recording' : ''}`} onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus.current?.focus?.({ preventScroll: true }); }}><header><span className="console-eyebrow">{story.source}</span><Dialog.Close aria-label="Close Aura story" className="console-icon-button"><X size={20} /></Dialog.Close></header>{story.kind === 'video' ? <div className="aura-reader-player"><StreamMedia url={story.url} poster={story.image} title={story.title} /></div> : story.image && <div className="aura-reader-image"><Artwork src={story.image} /></div>}<span className="aura-daily-label">{story.label}{story.publishedAt ? ` · ${formatEditionDate(story.publishedAt)}` : ''}</span><Dialog.Title>{story.title}</Dialog.Title><Dialog.Description className={story.description ? 'aura-reader-description' : 'sr-only'}>{story.description || `Read ${story.title} from ${story.source}.`}</Dialog.Description>{story.content && <div className="aura-reader-body"><ReactMarkdown skipHtml>{story.content}</ReactMarkdown></div>}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}
