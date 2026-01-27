import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Image as ImageIcon, Video, Link as LinkIcon, Upload, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SponsorsSection({ allowEditing = true }) {
  const [isEditing, setIsEditing] = useState(false);
  const [sponsors, setSponsors] = useState([
    {
      id: 1,
      name: 'Moon Tech',
      description: 'The future of gaming peripherals. Experience low latency and high precision.',
      link: 'https://moontech.gg/aura',
      logo: 'https://source.unsplash.com/random/100x100?tech,logo',
      media: [
        { type: 'video', url: 'https://source.unsplash.com/random/800x450?gaming,setup' },
        { type: 'image', url: 'https://source.unsplash.com/random/200x200?keyboard' },
        { type: 'image', url: 'https://source.unsplash.com/random/200x200?mouse' },
      ],
      tier: 'Gold'
    }
  ]);

  const [aboutMe, setAboutMe] = useState("Hey there! I'm a variety streamer who loves connecting with chat and exploring new games together. When I'm not streaming, you can find me making music or hiking in the mountains.");

  const handleMediaUpload = (sponsorId) => {
    // Mock upload
    alert("Media upload dialog would open here");
  };

  const handleLogoUpload = (sponsorId) => {
    // Mock upload
    alert("Logo upload dialog would open here");
  };

  return (
    <div className="w-full mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
            Partners & Sponsors
            {isEditing && <span className="text-sm font-normal text-white/40">(Edit Mode)</span>}
            </h3>
            {allowEditing && (
            <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`p-2 rounded-full transition-all ${isEditing ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
            >
                <Settings className="w-4 h-4" />
            </button>
            )}
        </div>
        {isEditing && (
            <Button variant="outline" size="sm" className="bg-white/5 border-white/10" onClick={() => setSponsors([...sponsors, { id: Date.now(), name: '', description: '', media: [], tier: 'Bronze' }])}>
                <Plus className="w-4 h-4 mr-2" /> Add Sponsor
            </Button>
        )}
      </div>

      <div className="relative group/carousel">
        {/* Navigation Arrows (Outside Box) */}
        {!isEditing && sponsors.length > 1 && (
            <>
                <button 
                    onClick={() => {
                        const container = document.getElementById('sponsors-container');
                        if (container) container.scrollBy({ left: -container.offsetWidth, behavior: 'smooth' });
                    }}
                    className="absolute -left-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 border border-white/10 backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100 z-10"
                >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button 
                    onClick={() => {
                        const container = document.getElementById('sponsors-container');
                        if (container) container.scrollBy({ left: container.offsetWidth, behavior: 'smooth' });
                    }}
                    className="absolute -right-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 border border-white/10 backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100 z-10"
                >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </>
        )}

        <div 
            id="sponsors-container" 
            className={`flex gap-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory ${isEditing ? 'flex-col overflow-visible' : ''}`}
            style={{ scrollBehavior: 'smooth' }}
        >
            {sponsors.map((sponsor, index) => (
            <div key={sponsor.id} className={`relative flex-shrink-0 w-full snap-center ${isEditing ? 'p-6 bg-white/5 border border-white/10 rounded-2xl' : ''}`}>
                {isEditing ? (
                    // EDIT MODE (Original Content)
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Name</label>
                                <Input 
                                    value={sponsor.name} 
                                    onChange={(e) => {
                                        const newSponsors = [...sponsors];
                                        newSponsors[index].name = e.target.value;
                                        setSponsors(newSponsors);
                                    }}
                                    className="bg-black/20 border-white/10"
                                    placeholder="Sponsor Name"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Description</label>
                                <Textarea 
                                    value={sponsor.description}
                                    onChange={(e) => {
                                        const newSponsors = [...sponsors];
                                        newSponsors[index].description = e.target.value;
                                        setSponsors(newSponsors);
                                    }}
                                    className="bg-black/20 border-white/10 min-h-[100px]"
                                    placeholder="Sponsor Description"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Tier</label>
                                    <select className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm text-white">
                                        <option>Gold</option>
                                        <option>Silver</option>
                                        <option>Bronze</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Affiliate Link</label>
                                    <Input 
                                        value={sponsor.link}
                                        onChange={(e) => {
                                            const newSponsors = [...sponsors];
                                            newSponsors[index].link = e.target.value;
                                            setSponsors(newSponsors);
                                        }}
                                        className="bg-black/20 border-white/10"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Logo</label>
                                <div 
                                    onClick={() => handleLogoUpload(sponsor.id)}
                                    className="h-20 w-full border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
                                >
                                    {sponsor.logo ? (
                                        <img src={sponsor.logo} alt="Logo" className="h-16 object-contain" />
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Upload className="w-4 h-4 text-white/40 mb-1" />
                                            <span className="text-[10px] text-white/40">Upload Logo</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Middle: About Me Edit */}
                        <div className="space-y-4">
                            <div className="h-full flex flex-col">
                                <label className="text-xs font-bold text-white/40 uppercase mb-1 block">About Me (Displayed in Middle)</label>
                                <Textarea 
                                    value={aboutMe}
                                    onChange={(e) => setAboutMe(e.target.value)}
                                    className="bg-black/20 border-white/10 flex-1 min-h-[200px]"
                                    placeholder="Write something about yourself..."
                                />
                                <p className="text-[10px] text-white/30 mt-2">This content will be displayed between the sponsor details and media.</p>
                            </div>
                        </div>

                        {/* Right: Media */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-white/40 uppercase mb-1 block">Media Gallery</label>
                            <div 
                                className="aspect-video w-full bg-black/40 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={() => handleMediaUpload(sponsor.id)}
                            >
                                <Video className="w-8 h-8 text-white/20 mb-2" />
                                <span className="text-sm text-white/40 font-medium">Big media (click to add)</span>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="aspect-square bg-black/20 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/5">
                                        <Plus className="w-4 h-4 text-white/20" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white/20 hover:text-red-400 hover:bg-red-500/10" onClick={() => {
                            const newSponsors = sponsors.filter(s => s.id !== sponsor.id);
                            setSponsors(newSponsors);
                        }}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    // VIEW MODE - 3 Column Layout
                    <div className="w-full bg-[#0f1419]/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group">
                        {/* Background Glow */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />
                        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
                            {/* Left Col: Sponsor Info (3 cols) */}
                            <div className="lg:col-span-3 flex flex-col items-center text-center lg:items-start lg:text-left space-y-4">
                                <div className="w-24 h-24 bg-white rounded-2xl p-4 shadow-lg shadow-cyan-500/10 flex items-center justify-center mb-2">
                                    <img src={sponsor.logo} alt={sponsor.name} className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-white tracking-tight mb-2">{sponsor.name}</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed mb-4">{sponsor.description}</p>
                                    <a 
                                        href={sponsor.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider transition-colors"
                                    >
                                        <LinkIcon className="w-3 h-3" />
                                        Visit Partner
                                    </a>
                                </div>
                            </div>

                            {/* Middle Col: About Me + Partnership Title (5 cols) */}
                            <div className="lg:col-span-5 flex flex-col justify-center h-full relative px-4 lg:px-8 border-t lg:border-t-0 lg:border-l lg:border-r border-white/5 py-8 lg:py-0">
                                <div className="text-center">
                                    <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">
                                        Streamer Partnership
                                    </span>
                                    <h3 className="text-xl font-bold text-white mb-4">About Me</h3>
                                    <div className="relative">
                                        <p className="text-slate-300 leading-relaxed text-base italic">
                                            "{aboutMe}"
                                        </p>
                                        <div className="mt-6 flex justify-center gap-2">
                                            {/* Social Icons Mock */}
                                            {[1,2,3].map(i => (
                                                <div key={i} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors">
                                                    <div className="w-4 h-4 bg-white/20 rounded-sm" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: Media (4 cols) */}
                            <div className="lg:col-span-4 space-y-4">
                                {/* Big Media */}
                                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black relative group/media cursor-pointer shadow-2xl">
                                    <img src={sponsor.media[0]?.url} className="w-full h-full object-cover opacity-80 group-hover/media:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover/media:scale-110 transition-transform">
                                            <PlayIcon className="w-5 h-5 text-white fill-white" />
                                        </div>
                                    </div>
                                </div>
                                {/* Small Thumbs */}
                                <div className="grid grid-cols-4 gap-2">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="aspect-square rounded-lg bg-white/5 overflow-hidden cursor-pointer hover:ring-2 ring-cyan-500/50 transition-all">
                                            {sponsor.media[i+1] && <img src={sponsor.media[i+1].url} className="w-full h-full object-cover" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function PlayIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
    )
}