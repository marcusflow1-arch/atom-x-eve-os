// QuestNotification.jsx — Toast-style quest event notifications

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dismissNotification } from './npcQuestStore';
import { getQuestById } from './questData';

const CONFIG = {
  accept:   { color: '#6ec3ff', bg: 'rgba(110,195,255,0.10)', border: 'rgba(110,195,255,0.30)', icon: '📋', label: 'Quest Accepted' },
  ready:    { color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.30)',  icon: '✅', label: 'Objective Complete' },
  complete: { color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.30)',  icon: '⭐', label: 'Quest Complete!' },
};

function QuestToast({ notification }) {
  const quest = getQuestById(notification.questId);
  const cfg = CONFIG[notification.type] || CONFIG.accept;

  useEffect(() => {
    const id = setTimeout(() => dismissNotification(notification.id), 4000);
    return () => clearTimeout(id);
  }, [notification.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        backdropFilter: 'blur(12px)',
        minWidth: 240,
        boxShadow: `0 4px 20px ${cfg.color}18`,
      }}
      onClick={() => dismissNotification(notification.id)}
    >
      <span className="text-xl">{cfg.icon}</span>
      <div>
        <div className="text-[10px] tracking-[0.25em] uppercase font-semibold" style={{ color: cfg.color }}>
          {cfg.label}
        </div>
        <div className="text-[12px] text-white/70 mt-0.5">{quest?.name || notification.questId}</div>
      </div>
    </motion.div>
  );
}

export default function QuestNotifications({ notifications }) {
  return (
    <div className="fixed top-20 right-4 z-[300] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => (
          <div key={n.id} className="pointer-events-auto">
            <QuestToast notification={n} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}