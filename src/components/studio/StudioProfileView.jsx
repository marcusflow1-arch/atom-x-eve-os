import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Users, Building2, Globe, Gamepad2, Loader2, Layers, Briefcase, Sparkles, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useStudioProfile from './useStudioProfile';
import StudioLogo from './StudioLogo';

const glass = 'bg-white/[0.025] border border-white/10 backdrop-blur-xl';

const Stat = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2.5 min-w-0">
    <Icon className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">{label}</p>
      <p className="text-xs text-white/85 font-semibold truncate">{value || '—'}</p>
    </div>
  </div>
);

function SectionDivider() {
  return <div className="flex items-center justify-center py-1"><div className="w-1/2 h-px bg-white/10" /></div>;
}

function TeamScroller({ team, selected, onSelect }) {
  if (!team?.length) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-white/30 font-bold">Current Team</h3>
          <p className="text-xs text-white/35 mt-1">People publicly associated with the studio and their documented game credits.</p>
        </div>
        <span className="text-[9px] text-white/25">{team.length} profiles</span>
      </div>
      <div
        className="overflow-x-auto pb-2"
        onWheel={(e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY;
        }}
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="flex gap-3 min-w-max">
          {team.map((person, i) => (
            <button
              key={`${person.name}-${i}`}
              onClick={() => onSelect(person)}
              className={`w-24 text-left rounded-2xl p-2 transition-all ${selected?.name === person.name ? 'bg-white/[0.07] border border-cyan-300/25' : 'bg-white/[0.018] border border-white/[0.06] hover:bg-white/[0.04]'}`}
            >
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-black/20 border border-white/10">
                {person.image_url ? (
                  <img src={person.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/25 text-xl font-black">{String(person.name || '?').slice(0, 1)}</div>
                )}
              </div>
              <p className="text-[10px] text-white font-bold mt-2 truncate">{person.name || 'Developer'}</p>
              <p className="text-[8px] text-white/35 mt-0.5 line-clamp-2">{person.role || 'Developer'}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function PersonDetail({ person }) {
  if (!person) return null;
  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={person.name}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="mt-4"
      >
        <div className="flex items-stretch min-h-[210px]">
          <div className="w-1/4 pr-5 flex items-center justify-center">
            <div className="w-full max-w-[140px] aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/20">
              {person.image_url ? <img src={person.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white/25">{String(person.name || '?').slice(0, 1)}</div>}
            </div>
          </div>
          <div className="w-px self-center h-3/4 bg-white/10" />
          <div className="w-3/4 pl-5">
            <p className="text-[9px] uppercase tracking-[0.24em] text-cyan-300 font-bold">Team member</p>
            <h3 className="text-2xl font-black text-white mt-1">{person.name}</h3>
            <p className="text-sm text-white/45 mt-1">{person.role || 'Developer'}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
              <div className={`${glass} rounded-xl p-3`}>
                <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Games worked on</p>
                <p className="text-sm text-white/70 mt-1">{person.games?.length ? person.games.join(' · ') : 'Public credits not documented.'}</p>
              </div>
              <div className={`${glass} rounded-xl p-3`}>
                <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Previous studios</p>
                <p className="text-sm text-white/70 mt-1">{person.previous_studios?.length ? person.previous_studios.join(' · ') : 'Not publicly documented.'}</p>
              </div>
              <div className={`${glass} rounded-xl p-3 md:col-span-2`}>
                <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Interests / specialties</p>
                <p className="text-sm text-white/70 mt-1">{person.interests?.length ? person.interests.join(' · ') : 'No public interests listed.'}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}

function ProjectsSection({ projects }) {
  const [selected, setSelected] = useState(null);
  if (!projects?.length) return null;
  const active = selected || projects[0];

  return (
    <section className="space-y-4">
      <SectionDivider />
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-white/30 font-bold">Games to Come</h3>
          <p className="text-xs text-white/35 mt-1">Current and upcoming titles publicly associated with the studio.</p>
        </div>
        <span className="text-[9px] text-white/25">{projects.length} projects</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)] gap-5">
        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
          {projects.map((project, i) => (
            <button
              key={`${project.title}-${i}`}
              onClick={() => setSelected(project)}
              className={`w-full text-left rounded-xl px-3 py-3 transition-all ${active.title === project.title ? 'bg-white/[0.06] border border-cyan-300/20' : 'bg-white/[0.018] border border-white/[0.06] hover:bg-white/[0.035]'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white truncate">{project.title}</span>
                <ChevronRight className="w-3 h-3 text-white/25" />
              </div>
              <p className="text-[9px] text-cyan-300/70 mt-1">{project.status || 'In development'}{project.release_window ? ` · ${project.release_window}` : ''}</p>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="flex items-stretch min-h-[300px]"
          >
            <div className="w-3/4 pr-5">
              <div className="h-full rounded-2xl overflow-hidden border border-white/10 bg-black/20 relative">
                {active.image_url && <img src={active.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-45" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-[9px] uppercase tracking-widest text-cyan-300 font-bold">{active.status || 'In development'}</p>
                  <h4 className="text-2xl font-black text-white mt-1">{active.title}</h4>
                  <p className="text-white/55 text-xs mt-2 max-w-xl">{active.description || 'Project information will appear here when publicly available.'}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {active.genre && <span className="px-2 py-1 rounded-full bg-white/10 border border-white/10 text-[9px] text-white/55">{active.genre}</span>}
                    {active.release_window && <span className="px-2 py-1 rounded-full bg-white/10 border border-white/10 text-[9px] text-white/55">{active.release_window}</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="w-px self-center h-3/4 bg-white/10" />
            <div className="w-1/4 pl-5 flex items-center">
              <div className={`${glass} rounded-2xl p-4 w-full`}>
                <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Project Notes</p>
                <p className="text-sm text-white/60 mt-2">Selected project details appear here while the complete studio project list remains available on the left.</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

export default function StudioProfileView({ game }) {
  const { profile, loading, refreshing, error } = useStudioProfile(game);
  const [catalogCount, setCatalogCount] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);

  useEffect(() => {
    const developer = profile?.developer_name;
    if (!developer) { setCatalogCount(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const all = await base44.entities.Game.list();
        const rows = Array.isArray(all) ? all : (all?.data || []);
        const count = rows.filter(g => g?.developer && g.developer.trim().toLowerCase() === developer.trim().toLowerCase()).length;
        if (!cancelled) setCatalogCount(count);
      } catch { if (!cancelled) setCatalogCount(null); }
    })();
    return () => { cancelled = true; };
  }, [profile?.developer_name]);

  if (loading || (!profile && !error)) {
    return <div className="h-full flex flex-col items-center justify-center gap-3"><Loader2 className="w-5 h-5 text-white/40 animate-spin" /><p className="text-white/40 text-xs uppercase tracking-widest font-bold">Loading saved studio profile…</p></div>;
  }
  if (error || !profile) return <div className="h-full flex items-center justify-center"><p className="text-white/40 text-sm">Studio information unavailable right now.</p></div>;

  return (
    <div className="w-full h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
        {/* Original clean Studio header preserved. New information begins below it. */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-6">
          <StudioLogo name={profile.developer_name} logoUrl={profile.logo_url} className="w-24 h-24 text-3xl" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 font-bold mb-1">Developer of {game?.title}</p>
            <h2 className="text-3xl font-black text-white tracking-tight leading-none">{profile.developer_name}</h2>
            {profile.tagline && <p className="text-white/50 text-sm mt-2">{profile.tagline}</p>}
            {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-bold uppercase tracking-wider text-cyan-300/80 hover:text-cyan-200 transition-colors"><Globe className="w-3.5 h-3.5" /> Official site</a>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-5 py-5 border-y border-white/10">
          <Stat icon={Calendar} label="Founded" value={profile.founded_year} />
          <Stat icon={MapPin} label="Headquarters" value={profile.headquarters} />
          <Stat icon={Users} label="Studio size" value={profile.employees} />
          <Stat icon={Building2} label="Parent company" value={profile.parent_company || 'Independent'} />
        </motion.div>

        {profile.description && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3"><h3 className="text-[10px] uppercase tracking-[0.25em] text-white/30 font-bold">About the studio</h3><p className="text-white/70 text-sm leading-relaxed max-w-3xl">{profile.description}</p>{profile.known_for?.length > 0 && <div className="flex flex-wrap gap-1.5 pt-1">{profile.known_for.map((k, i) => <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white/60 border border-white/10 bg-white/[0.04]">{k}</span>)}</div>}</motion.div>}

        {/* Everything below this point is additive and follows the original clean Studio UI. */}
        <SectionDivider />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <Stat icon={Layers} label="Studio type" value={profile.studio_type || 'Developer'} />
          <Stat icon={Gamepad2} label="Games in Atom XE" value={catalogCount == null ? 'Loading…' : catalogCount} />
          <Stat icon={Sparkles} label="Focus" value={profile.known_for?.[0] || 'Interactive entertainment'} />
          <Stat icon={Briefcase} label="Recruiting" value={profile.recruiting ? 'Public info' : 'Not listed'} />
        </div>

        <TeamScroller team={profile.team} selected={selectedPerson} onSelect={setSelectedPerson} />
        <PersonDetail person={selectedPerson} />

        <SectionDivider />

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`${glass} rounded-2xl p-5`}><Sparkles className="w-4 h-4 text-cyan-300 mb-3" /><h3 className="text-[10px] uppercase tracking-[0.24em] text-white/45 font-bold">Studio Culture</h3><p className="text-sm text-white/60 mt-2">{profile.culture || 'Public information about studio culture will appear here when documented.'}</p></div>
          <div className={`${glass} rounded-2xl p-5`}><Briefcase className="w-4 h-4 text-cyan-300 mb-3" /><h3 className="text-[10px] uppercase tracking-[0.24em] text-white/45 font-bold">Recruiting</h3><p className="text-sm text-white/60 mt-2">{profile.recruiting || 'Recruiting and hiring information will appear here when publicly documented.'}</p></div>
          <div className={`${glass} rounded-2xl p-5`}><Gamepad2 className="w-4 h-4 text-cyan-300 mb-3" /><h3 className="text-[10px] uppercase tracking-[0.24em] text-white/45 font-bold">What They Make</h3><p className="text-sm text-white/60 mt-2">{profile.known_for?.join(' · ') || 'Game development and interactive entertainment.'}</p></div>
        </section>

        <ProjectsSection projects={profile.upcoming_projects} />
        {!profile.upcoming_projects?.length && profile.notable_games?.length > 0 && <ProjectsSection projects={profile.notable_games.map(g => ({ ...g, status: g.status || 'Released' }))} />}

        <section className="pb-12">
          <SectionDivider />
          <div className={`${glass} rounded-2xl p-5`}>
            <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-cyan-300" /><h3 className="text-[10px] uppercase tracking-[0.24em] text-white/45 font-bold">Work With the Studio</h3></div>
            <p className="text-sm text-white/55 mt-2">A flexible area for jobs, internships, open roles, community programs, announcements, or other recruiting information the studio chooses to publish.</p>
            {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 text-xs font-bold">Visit official studio site</a>}
          </div>
          {refreshing && <p className="text-center text-[9px] uppercase tracking-widest text-white/20 mt-3">Refreshing public studio information in the background…</p>}
        </section>
      </div>
    </div>
  );
}
