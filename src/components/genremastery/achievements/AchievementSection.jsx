import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import AchievementRow from './AchievementRow';

export default function AchievementSection({ title, subtitle, icon: Icon, accent = '#67e8f9', items, onSelect }) {
  const [open, setOpen] = useState(true);

  return (
    <section
      className="rounded-3xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors"
      >
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}1f`, border: `1px solid ${accent}44`, boxShadow: `0 0 14px ${accent}22` }}
        >
          {Icon && <Icon className="w-4 h-4" style={{ color: accent }} />}
        </span>
        <span className="flex-1 text-left min-w-0">
          <span className="block text-white font-bold text-sm tracking-wide">{title}</span>
          <span className="block text-white/35 text-xs truncate">{subtitle}</span>
        </span>
        <span className="text-white/40 text-xs font-semibold">{items.length}</span>
        <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-3 pb-3 space-y-2"
        >
          {items.length === 0 ? (
            <p className="text-white/25 text-xs px-2 py-4 text-center">Nothing here yet.</p>
          ) : (
            items.map((item, i) => (
              <AchievementRow key={item.id} item={item} index={i} onClick={onSelect} />
            ))
          )}
        </motion.div>
      )}
    </section>
  );
}