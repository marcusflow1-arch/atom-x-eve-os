import React from 'react';

export default function AvatarCatchphraseDisplay({ catchphrase }) {
  return (
    <div className="inline-flex px-4 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl" style={{ fontFamily: 'ui-rounded, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' }}>
      <span className="text-white/80 text-sm">“{catchphrase}”</span>
    </div>
  );
}