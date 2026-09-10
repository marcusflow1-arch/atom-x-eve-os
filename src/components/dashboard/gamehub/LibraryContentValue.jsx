import React from 'react';

export default function LibraryContentValue({ value }) {
  if (value == null) return null;
  if (Array.isArray(value)) return <ul className="space-y-2">{value.map((item, i) => <li key={i}><LibraryContentValue value={item} /></li>)}</ul>;
  if (typeof value !== 'object') return <span>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</span>;
  return <dl className="space-y-1">{Object.entries(value).map(([key, item]) => <div key={key}><dt className="inline font-semibold capitalize">{key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')}: </dt><dd className="inline"><LibraryContentValue value={item} /></dd></div>)}</dl>;
}