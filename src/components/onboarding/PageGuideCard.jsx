import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function PageGuideCard({ icon: Icon, title, summary, bullets = [], onClick, color = 'from-cyan-500 to-blue-600', actionLabel = 'Open' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="relative group rounded-2xl border border-white/10 p-6"
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)' }}
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
        {Icon && <Icon className="w-6 h-6 text-white" />}
      </div>
      <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
      <p className="text-white/60 text-sm mb-4">{summary}</p>
      {bullets?.length > 0 && (
        <ul className="space-y-1.5 mb-5">
          {bullets.map((b, i) => (
            <li key={i} className="text-white/70 text-sm flex gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-400/70 flex-shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end">
        <Button onClick={onClick} className="bg-white text-black hover:bg-white/90 rounded-full px-4 py-2 text-sm font-semibold">
          {actionLabel}
        </Button>
      </div>
    </motion.div>
  );
}