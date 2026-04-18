import React from 'react';
import { motion } from 'framer-motion';
import { Hammer, Calendar, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const statusColors = {
  'Pre-Production': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  'In Development': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Alpha': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Beta': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Polishing': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Shipped': 'bg-green-500/20 text-green-300 border-green-500/30',
};

export default function DevCurrentProject({ project }) {
  if (!project) return null;
  const { title, description, status, progress, image_url, expected_release } = project;
  const colorClass = statusColors[status] || statusColors['In Development'];

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
        <Hammer className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Current Project</h3>
        <span className="ml-auto">
          <Badge variant="outline" className={`text-xs ${colorClass}`}>{status}</Badge>
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-0">
        {/* Image */}
        {image_url && (
          <div className="sm:w-1/3 h-40 sm:h-auto flex-shrink-0 overflow-hidden">
            <img src={image_url} alt={title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-xl font-black text-white mb-1 tracking-tight">{title}</h4>
            <p className="text-white/50 text-sm leading-relaxed mb-4">{description}</p>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-white/40 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" /> Development Progress
              </span>
              <span className="text-white font-bold">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full relative"
              >
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              </motion.div>
            </div>
            {expected_release && (
              <p className="mt-2 text-xs text-white/30 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Expected: {expected_release}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}