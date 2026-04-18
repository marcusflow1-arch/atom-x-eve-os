import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, CheckCircle, Radio, Youtube, Twitter, MessageSquare, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SocialBtn = ({ href, icon: Icon, label, color }) => (
  <a href={href} target="_blank" rel="noopener noreferrer"
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105 ${color}`}>
    <Icon className="w-3.5 h-3.5" />
    <span className="hidden sm:inline">{label}</span>
  </a>
);

export default function DevStudioHero({ developer }) {
  const { studio_name, tagline, bio, avatar_url, banner_url, location, founded_year,
    team_size, verified, is_live, stream_title, followers, total_games, total_cards,
    genres, tools, social_links } = developer;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10">
      {/* Banner */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <img src={banner_url} alt="studio banner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c12] via-[#080c12]/60 to-transparent" />
        
        {/* Live badge */}
        {is_live && (
          <motion.div
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-full"
          >
            <Radio className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-xs font-bold uppercase tracking-wider">Live Now</span>
          </motion.div>
        )}
      </div>

      {/* Profile Row */}
      <div className="relative px-6 pb-6 -mt-16">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <img
              src={avatar_url}
              alt={studio_name}
              className="w-24 h-24 rounded-2xl border-4 border-[#080c12] object-cover shadow-2xl"
            />
            {is_live && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-[#080c12] animate-pulse" />
            )}
          </div>

          {/* Name & Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-2xl font-black text-white tracking-tight">{studio_name}</h2>
              {verified && <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />}
              <Badge className="bg-white/10 text-white/70 border-none text-xs">{team_size}</Badge>
            </div>
            <p className="text-white/50 text-sm mb-2 italic">"{tagline}"</p>
            <div className="flex items-center gap-4 text-xs text-white/40 flex-wrap">
              {location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{location}</span>}
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{followers?.toLocaleString()} followers</span>
              <span>Est. {founded_year}</span>
            </div>
          </div>

          {/* Stats Pills */}
          <div className="flex gap-3 flex-shrink-0">
            <div className="text-center px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-xl font-black text-white">{total_games}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Games</p>
            </div>
            <div className="text-center px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-xl font-black text-cyan-400">{total_cards}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Cards</p>
            </div>
          </div>
        </div>

        {/* Stream Alert */}
        {is_live && stream_title && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-3 px-4 py-3 bg-red-900/30 border border-red-500/30 rounded-xl"
          >
            <Radio className="w-4 h-4 text-red-400 animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-red-300 font-bold text-sm truncate">{stream_title}</p>
              <p className="text-red-400/60 text-xs">Streaming live now — click to watch</p>
            </div>
            <button className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white text-xs font-bold transition-colors flex-shrink-0">
              Watch Live
            </button>
          </motion.div>
        )}

        {/* Bio */}
        <p className="mt-4 text-white/60 text-sm leading-relaxed max-w-3xl">{bio}</p>

        {/* Genres & Tools */}
        <div className="mt-4 flex flex-wrap gap-2">
          {genres?.map(g => (
            <span key={g} className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-medium">{g}</span>
          ))}
          {tools?.map(t => (
            <span key={t} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-white/50 text-xs">{t}</span>
          ))}
        </div>

        {/* Social Links */}
        {social_links && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {social_links.twitter && <SocialBtn href={social_links.twitter} icon={Twitter} label="Twitter" color="border-sky-500/30 text-sky-400 bg-sky-500/10 hover:bg-sky-500/20" />}
            {social_links.youtube && <SocialBtn href={social_links.youtube} icon={Youtube} label="YouTube" color="border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20" />}
            {social_links.twitch && <SocialBtn href={social_links.twitch} icon={Radio} label="Twitch" color="border-purple-500/30 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20" />}
            {social_links.discord && <SocialBtn href={social_links.discord} icon={MessageSquare} label="Discord" color="border-indigo-500/30 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20" />}
            {social_links.website && <SocialBtn href={social_links.website} icon={Globe} label="Website" color="border-white/20 text-white/60 bg-white/5 hover:bg-white/10" />}
          </div>
        )}
      </div>
    </div>
  );
}