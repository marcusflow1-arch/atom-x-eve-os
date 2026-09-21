import React, { useEffect, useState } from 'react';
import { MessageSquare, Star, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

export default function GameReviews({ game }) {
  const { user, isAuthenticated, login } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [rating, setRating] = useState(5);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [visible, setVisible] = useState(6);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    base44.entities.Post.filter({ type: 'game_review', game_title: game.title }, '-created_date', 100)
      .then(rows => { if (!cancelled) setReviews(rows.filter(row => !['removed', 'archived'].includes(row.status))); })
      .catch(() => { if (!cancelled) setError('Reviews could not be loaded.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [game.title, retry]);

  const submit = async event => {
    event.preventDefault();
    if (!isAuthenticated) { login(); return; }
    if (!draft.trim() || saving) return;
    setSaving(true); setSaveError('');
    try {
      const review = await base44.entities.Post.create({
        title: 'Review: ' + game.title, content: draft.trim(), type: 'game_review',
        game_title: game.title, genre: game.genre, rating, community: 'reviews',
        user_id: user.id, author_name: user.full_name || user.username || 'Player', status: 'published'
      });
      setReviews(rows => [review, ...rows]); setDraft(''); setComposing(false);
    } catch { setSaveError('Your review was not saved. Please try again.'); }
    finally { setSaving(false); }
  };
  const rated = reviews.filter(row => Number(row.rating) >= 1 && Number(row.rating) <= 5);
  const average = rated.length ? (rated.reduce((sum, row) => sum + Number(row.rating), 0) / rated.length).toFixed(1) : null;

  return <section className="gd-reviews">
    <div className="gd-section-heading">
      <div><span className="gd-eyebrow">From the community</span><h2>Player reviews</h2>
        {!loading && !error && <p>{average ? average + ' / 5 · ' + rated.length + (rated.length === 1 ? ' rated review' : ' rated reviews') : 'Share your experience with other players.'}</p>}
      </div>
      <button className="gd-secondary-button gd-button-fit" onClick={() => isAuthenticated ? setComposing(value => !value) : login()}><MessageSquare size={16} />Write a review</button>
    </div>
    {composing && <form className="gd-review-form" onSubmit={submit}>
      <label htmlFor="game-review-rating">Your rating</label>
      <select id="game-review-rating" value={rating} onChange={event => setRating(Number(event.target.value))} disabled={saving}>
        {[5, 4, 3, 2, 1].map(value => <option value={value} key={value}>{value} {value === 1 ? 'star' : 'stars'}</option>)}
      </select>
      <label htmlFor="game-review-body">Your review</label>
      <textarea id="game-review-body" value={draft} onChange={event => setDraft(event.target.value)} rows={4} required maxLength={5000} disabled={saving} placeholder="What should other players know?" />
      {saveError && <p role="alert" className="gd-error">{saveError}</p>}
      <div className="gd-form-actions"><button type="button" className="gd-text-button" disabled={saving} onClick={() => setComposing(false)}>Cancel</button><button className="gd-primary-button gd-button-fit" disabled={saving || !draft.trim()}>{saving && <Loader2 size={16} className="gd-spin" />}{saving ? 'Saving…' : 'Publish review'}</button></div>
    </form>}
    {loading ? <p className="gd-empty" role="status">Loading reviews…</p>
      : error ? <div className="gd-empty" role="alert"><p>{error}</p><button className="gd-text-button" onClick={() => setRetry(value => value + 1)}>Try again</button></div>
      : !reviews.length ? <div className="gd-empty"><MessageSquare size={26} /><h3>Be the first to share your thoughts.</h3><p>No player reviews for this game yet.</p></div>
      : <div className="gd-review-grid">{reviews.slice(0, visible).map(review => <article key={review.id} className="gd-review">
          <div className="gd-review-author"><span className="gd-avatar-letter">{(review.author_name || 'P').slice(0, 1).toUpperCase()}</span><div><strong>{review.author_name || 'Player'}</strong>{review.created_date && <time dateTime={review.created_date}>{new Date(review.created_date).toLocaleDateString()}</time>}</div>{Number(review.rating) >= 1 && Number(review.rating) <= 5 && <span className="gd-review-rating"><Star size={14} fill="currentColor" />{review.rating}/5</span>}</div>
          <p>{review.content}</p>
        </article>)}</div>}
    {visible < reviews.length && <button className="gd-secondary-button gd-button-fit" onClick={() => setVisible(value => value + 6)}>Show more reviews</button>}
  </section>;
}
