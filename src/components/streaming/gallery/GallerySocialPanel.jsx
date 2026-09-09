import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Flame, Heart, Laugh, MessageSquare, Scissors, Send } from 'lucide-react';
import useGallerySocial from './useGallerySocial';
import { CATEGORY_META } from './galleryClipData';

const REACTIONS = [{ type: 'like', label: 'Upvote', Icon: ArrowUp }, { type: 'fire', label: 'Fire', Icon: Flame }, { type: 'love', label: 'Love', Icon: Heart }, { type: 'funny', label: 'Funny', Icon: Laugh }];

export default function GallerySocialPanel({ clip, channelId, user }) {
  const { comments, reactions, addComment, react, canInteract } = useGallerySocial({ clip, channelId, user });
  const [draft, setDraft] = useState('');
  const [request, setRequest] = useState(false);
  const inputRef = useRef(null);
  const feedRef = useRef(null);
  const followingFeed = useRef(true);
  useEffect(() => {
    if (followingFeed.current && feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [comments.data]);
  const meta = CATEGORY_META[clip?.category] || CATEGORY_META.SAVED;
  const submit = async (event) => {
    event.preventDefault();
    if (!draft.trim() || addComment.isPending) return;
    try { await addComment.mutateAsync({ content: draft, request }); setDraft(''); setRequest(false); } catch { /* Retain the draft; show the error below. */ }
  };
  return <div className="gallery-social-content">
    <div className="gallery-clip-heading"><span className={`gallery-category ${meta.chip}`}>{meta.label}</span><h3>{clip?.title || 'Clip discussion'}</h3><p>{[clip?.game, clip?.date !== 'undated' && clip?.date, clip?.time].filter(Boolean).join(' · ')}</p>{clip?.contributor && <p className="gallery-contributor">Clipped by {clip.contributor}</p>}<p className="gallery-description">{clip?.description}</p></div>
    <div className="gallery-reactions" aria-label="Clip reactions">
      {REACTIONS.map(({ type, label, Icon }) => {
        const rows = (reactions.data || []).filter((row) => row.type === type);
        const selected = Boolean(user?.id && rows.some((row) => row.user_id === user.id));
        return <button key={type} type="button" aria-label={`${label} clip`} aria-pressed={selected} disabled={!canInteract || reactions.isPending || reactions.isError || react.isPending} className={selected ? 'is-active' : ''} onClick={() => react.mutate(type)}><Icon size={14} />{label === 'Upvote' && <span>{label}</span>}<span>{new Set(rows.map((row) => row.user_id)).size}</span></button>;
      })}
      <button type="button" className={`gallery-request-toggle ${request ? 'is-active' : ''}`} aria-pressed={request} disabled={!canInteract} onClick={() => { setRequest(!request); inputRef.current?.focus(); }}><Scissors size={14} /><span>Request clip</span></button>
    </div>
    <div className="gallery-discussion-label"><MessageSquare size={12} /><span>Discussion</span><span className="gallery-feed-status">{!channelId ? 'Sign in to connect' : comments.isError ? 'Unavailable' : comments.isPending ? 'Connecting…' : 'Auto-updating'}</span></div>
    <div ref={feedRef} className="gallery-comment-feed" role="log" aria-label="Clip discussion" aria-live="polite" aria-relevant="additions text" onScroll={(event) => { const feed = event.currentTarget; followingFeed.current = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 50; }}>
      {comments.isError ? <p className="gallery-inline-error">Discussion could not load. <button type="button" onClick={() => comments.refetch()}>Retry</button></p> : comments.isFetching && !comments.data ? <p className="gallery-empty-copy">Loading discussion…</p> : !comments.data?.length ? <p className="gallery-empty-copy">Every great moment starts a conversation.</p> : [...comments.data].reverse().map((comment) => <div key={comment.id} className="gallery-comment"><span className="gallery-comment-avatar">{(comment.author_name || 'V').charAt(0).toUpperCase()}</span><div><div className="gallery-comment-byline"><strong>{comment.author_name || 'Viewer'}</strong>{comment.target_type === 'clip_request' && <span>Clip request</span>}</div><p>{comment.content}</p></div></div>)}
    </div>
    <form onSubmit={submit} className="gallery-comment-form"><label className="sr-only" htmlFor="gallery-message">{request ? 'Describe your clip request' : 'Comment on this clip'}</label><input id="gallery-message" ref={inputRef} value={draft} maxLength={1000} onChange={(event) => setDraft(event.target.value)} disabled={!canInteract || addComment.isPending} placeholder={!canInteract ? 'Sign in to join the discussion' : request ? 'Which part should be clipped?' : 'Add to the moment…'} /><button type="submit" aria-label={request ? 'Send clip request' : 'Send comment'} disabled={!canInteract || !draft.trim() || addComment.isPending}>{addComment.isPending ? <span className="gallery-spinner" /> : <Send size={15} />}</button></form>
    {(addComment.isError || react.isError || reactions.isError) && <p className="gallery-inline-error" role="alert">{addComment.isError ? 'Message was not saved. Your draft is still here; try again.' : react.isError ? 'Reaction was not saved. Try again.' : 'Reactions could not load.'}{reactions.isError && <button type="button" onClick={() => reactions.refetch()}> Retry</button>}</p>}
  </div>;
}
