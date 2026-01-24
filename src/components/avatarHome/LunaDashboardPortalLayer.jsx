import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const portals = [
  { id: 'games', label: 'Games', page: 'Library' },
  { id: 'farm', label: 'Farm', page: 'Farm' },
  { id: 'clan', label: 'Clan', page: 'Clan' },
  { id: 'inventory', label: 'Inventory', page: 'Blacksmith' },
];

export default function LunaDashboardPortalLayer({ enabled }) {
  const navigate = useNavigate();
  if (!enabled) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {portals.map(p => (
        <motion.button
          key={p.id}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(createPageUrl(p.page))}
          className="rounded-xl border border-white/10 bg-white/5 p-3 text-left"
        >
          <div className="text-white/80 font-semibold">{p.label}</div>
          <div className="text-white/30 text-xs">Step through</div>
        </motion.button>
      ))}
    </div>
  );
}