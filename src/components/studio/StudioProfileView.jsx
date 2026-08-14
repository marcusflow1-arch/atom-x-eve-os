import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, Building2, Globe, Gamepad2, Loader2, Layers } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useStudioProfile from './useStudioProfile';
import StudioLogo from './StudioLogo';

const Stat = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2.5 min-w-0">
    <Icon className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">{label}</p>
      <p className="text-xs text-white/85 font-semibold truncate">{value || '—'}</p>
    </div>
  </div>
);

/** Studio information for the developer of THIS specific game — real data, per studio. */
export default function StudioProfileView({ game }) {
  const { profile, loading, error } = useStudioProfile(game);
  const [catalogCount, setCatalogCount] = useState(null);

  useEffect(() => {
    const developer = profile?.developer_name;
    if (!developer) {
      setCatalogCount(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const all = await base44.entities.Game.list();
        const rows = Array.isArray(all) ? all : (all?.data || []);
        const count = rows.filter(g =>
          g?.developer && g.developer.trim().toLowerCase() === developer.trim().toLowerCase()
        ).length;
        if (!cancelled) setCatalogCount(count);
      } catch {
        if (!cancelled) setCatalogCount(null);
      }
    })();

    return () => { cancelled = true; };
  }, [profile?.developer_name]);

  if (loading || (!profile && !error)) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
        <p className="text-white/40 text-xs uppercase tracking-widest font-bold">
          Looking up the studio behind {game?.title || 'this game'}
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-white/40 text-sm">Studio information unavailable right now.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-10">
        {/* Identity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-6"
        >
          <StudioLogo
            name={profile.developer_name}
            logoUrl={profile.logo_url}
            className="w-24 h-24 text-3xl"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 font-bold mb-1">
              Developer of {game?.title}
            </p>
            <h2 className="text-3xl font-black text-white tracking-tight leading-none">
              {profile.developer_name}
            </h2>
            {profile.tagline && <p className="text-white/50 text-sm mt-2">{profile.tagline}</p>}
            {profile.studio_type && (
              <div className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white/65" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Layers className="w-3 h-3 text-white/40" />
                {profile.studio_type}
              </div>
            )}
            {profile.website && (
              <div>
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-bold uppercase tracking-wider text-cyan-300/80 hover:text-cyan-200 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Official site
                </a>
              </div>
            )}
          </div>
        </motion.div>

        {/* Facts */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-5 py-5 border-y border-white/10"
        >
          <Stat icon={Calendar} label="Founded" value={profile.founded_year} />
          <Stat icon={MapPin} label="Headquarters" value={profile.headquarters} />
          <Stat icon={Users} label="Team / Staff" value={profile.employees} />
          <Stat icon={Building2} label="Parent company" value={profile.parent_company || 'Independent'} />
          <Stat icon={Gamepad2} label="Games in Atom XE" value={catalogCount == null ? 'Loading…' : catalogCount} />
        </motion.div>

        {/* About */}
        {profile.description && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <h3 className="text-[10px] uppercase tracking-[0.25em] text-white/30 font-bold">About the studio</h3>
            <p className="text-white/70 text-sm leading-relaxed max-w-3xl">{profile.description}</p>
            {profile.known_for?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {profile.known_for.map((k, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white/60 border border-white/10 bg-white/[0.04]">
                    {k}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Their games */}
        {profile.notable_games?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            <h3 className="text-[10px] uppercase tracking-[0.25em] text-white/30 font-bold">
              Notable games by {profile.developer_name}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {profile.notable_games.map((g, i) => (
                <div key={`${g.title}-${i}`} className="p-3 rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                  <Gamepad2 className="w-3.5 h-3.5 text-white/25 mb-2" />
                  <p className="text-white text-xs font-bold leading-snug">{g.title}</p>
                  <p className="text-white/35 text-[10px] mt-1">{[g.genre, g.year].filter(Boolean).join(' · ')}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
