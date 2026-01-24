import React from 'react';

export default function AvatarMemoryBoard({ activities = [] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="font-bold mb-3 text-white/90">Memory Board</div>
      {activities.length === 0 ? (
        <ul className="text-white/60 text-sm space-y-1">
          <li>• Unlocked a rare badge yesterday</li>
          <li>• Played Neon Racer with friends</li>
          <li>• Exploring Galactic Empire campaign</li>
        </ul>
      ) : (
        <ul className="text-white/70 text-sm space-y-2">
          {activities.map(a => (
            <li key={a.id} className="flex items-start gap-2">
              <span className="text-white/40 text-xs">{new Date(a.timestamp).toLocaleDateString()}</span>
              <span className="flex-1">{a.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}