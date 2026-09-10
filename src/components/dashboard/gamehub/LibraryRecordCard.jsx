import React from 'react';
import ReactMarkdown from 'react-markdown';
import LibraryContentValue from '@/components/dashboard/gamehub/LibraryContentValue';

export default function LibraryRecordCard({ item }) {
  return <article className="rounded-xl border border-current/15 p-4 space-y-3">
    {item.image && <img src={item.image} alt={item.title} className="max-h-48 w-full rounded-lg object-cover" />}
    <h3 className="font-semibold text-sm">{item.title}</h3>
    {item.meta && <p className="text-xs opacity-70">{item.meta}</p>}
    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words"><ReactMarkdown>{item.body || ''}</ReactMarkdown></div>
    {item.details?.length > 0 && <details><summary className="cursor-pointer text-xs">View included content</summary><ul className="mt-3 space-y-2 text-sm">{item.details.map((detail, i) => <li key={i}><LibraryContentValue value={detail} /></li>)}</ul></details>}
  </article>;
}