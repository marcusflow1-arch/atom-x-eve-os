// Toast announcing a milestone quest unlock (new ability or class change).
import React, { useEffect, useState } from 'react';

export default function QuestRewardToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let timer;
    const handler = (e) => {
      setToast(e.detail);
      clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 6000);
    };
    window.addEventListener('questRewardUnlock', handler);
    return () => { window.removeEventListener('questRewardUnlock', handler); clearTimeout(timer); };
  }, []);

  if (!toast) return null;

  const isClass = toast.type === 'class';
  return (
    <div
      className="fixed left-1/2 top-24 -translate-x-1/2 z-[10000] px-6 py-4 rounded-2xl pointer-events-none"
      style={{
        background: 'rgba(10, 14, 22, 0.85)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid rgba(250, 204, 21, 0.5)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 40px rgba(250, 204, 21, 0.2)',
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{toast.icon || '✨'}</span>
        <div>
          <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-yellow-300/80">
            {isClass ? (toast.activated ? 'Class Change' : 'Class Unlocked') : 'New Ability Learned'}
          </div>
          <div className="text-lg font-bold text-white">{toast.name}</div>
          <div className="text-xs text-white/60">
            {isClass
              ? (toast.activated ? 'Your class has changed. New powers course through you.' : 'Select it in the Talents menu when out of combat.')
              : (toast.equippedSlot ? `Equipped to hotbar slot ${toast.equippedSlot}.` : 'Equip it from your Skills Book.')}
          </div>
        </div>
      </div>
    </div>
  );
}