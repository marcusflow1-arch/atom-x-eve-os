import { useEffect, useId, useRef } from 'react';

// Inline review stays inside the Character Hub's existing input boundary.
// No second fullscreen overlay or native browser confirmation is needed.
export default function ProgressionReview({ review, onCancel, onConfirm }) {
  const titleId = useId();
  const cancelRef = useRef(null);
  const committed = useRef(false);
  useEffect(() => {
    committed.current = false;
    if (review) cancelRef.current?.focus();
  }, [review]);
  if (!review) return null;
  return (
    <section aria-labelledby={titleId} className="my-4 rounded-xl border border-amber-200/30 bg-amber-200/[0.06] p-4 text-sm text-white">
      <h3 id={titleId} className="font-semibold text-amber-100">{review.title}</h3>
      <p className="mt-2 leading-relaxed text-white/70">{review.description}</p>
      <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Object.entries(review.cost || {}).map(([name, amount]) => (
          <div key={name} className="flex justify-between gap-3 rounded-lg bg-black/20 px-3 py-2">
            <dt className="capitalize text-white/60">{name.replaceAll('_', ' ')}</dt>
            <dd className="font-semibold tabular-nums">{Number(amount).toLocaleString()}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button ref={cancelRef} type="button" onClick={onCancel} className="rounded-lg border border-white/20 px-4 py-2 focus-visible:outline focus-visible:outline-amber-200">Cancel</button>
        <button type="button" onClick={() => {
          if (committed.current) return;
          committed.current = true;
          onConfirm(review);
        }} className="rounded-lg bg-amber-200 px-4 py-2 font-semibold text-slate-950 focus-visible:outline focus-visible:outline-white">
          {review.confirmLabel || 'Confirm upgrade'}
        </button>
      </div>
    </section>
  );
}
