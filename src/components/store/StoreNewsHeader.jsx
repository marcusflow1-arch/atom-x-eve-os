import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Newspaper, Calendar, ArrowRight, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function StoreNewsHeader() {
  const news = [
    { title: "Patch 2.1 Notes: New Raid Added", date: "Today", type: "Update" },
    { title: "Server Maintenance Schedule", date: "Tomorrow", type: "Alert" },
  ];

  const upcoming = [
    { title: "Winter Festival Event", date: "Dec 15" },
    { title: "New Class: Cyber-Ninja", date: "Jan 10" },
  ];

  const recommended = [
    { title: "Stellar Blade", image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80", rating: 4.9 },
    { title: "Cyberpunk 2077", image: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&q=80", rating: 4.8 },
    { title: "Elden Ring", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80", rating: 4.9 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full mb-6 grid grid-cols-1 lg:grid-cols-12 gap-4"
    >
      {/* Recommended Titles - Spans 6 columns */}
      <div className="lg:col-span-6 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> 
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-500">
              Recommended For You
            </span>
          </h3>
          <button className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-3 flex-1">
          {recommended.map((game, i) => (
            <div key={i} className="relative rounded-lg overflow-hidden aspect-video cursor-pointer hover:ring-2 ring-white/20 transition-all group/item">
              <img src={game.image} alt={game.title} className="w-full h-full object-cover transform group-hover/item:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs font-bold truncate">{game.title}</p>
                <div className="flex items-center gap-1 mt-0.5">
                   <Star className="w-2 h-2 text-yellow-400 fill-yellow-400" />
                   <span className="text-[10px] text-white/80">{game.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* News & Updates - Spans 3 columns */}
      <div className="lg:col-span-3 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col relative overflow-hidden hover:border-white/20 transition-colors">
        <h3 className="text-white font-bold flex items-center gap-2 mb-3">
          <Newspaper className="w-4 h-4 text-blue-400" /> News & Updates
        </h3>
        <div className="flex flex-col gap-3">
          {news.map((item, i) => (
            <div key={i} className="group/news cursor-pointer">
              <div className="flex justify-between items-start mb-1">
                <Badge variant="outline" className="text-[10px] py-0 h-4 border-blue-400/30 text-blue-300">{item.type}</Badge>
                <span className="text-[10px] text-white/40">{item.date}</span>
              </div>
              <p className="text-sm text-white/80 group-hover/news:text-white transition-colors line-clamp-2">{item.title}</p>
            </div>
          ))}
        </div>
        <button className="mt-auto pt-3 text-xs text-blue-300 hover:text-blue-200 text-left">Read Patch Notes</button>
      </div>

      {/* Upcoming Changes - Spans 3 columns */}
      <div className="lg:col-span-3 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col relative overflow-hidden hover:border-white/20 transition-colors">
         <h3 className="text-white font-bold flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-purple-400" /> Upcoming
        </h3>
        <div className="space-y-3">
           {upcoming.map((item, i) => (
             <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg p-2 group/event hover:bg-white/10 transition-colors cursor-pointer">
               <div className="w-10 h-10 rounded-md bg-purple-500/20 flex flex-col items-center justify-center text-purple-300 border border-purple-500/30">
                  <span className="text-[8px] uppercase">{item.date.split(' ')[0]}</span>
                  <span className="text-xs font-bold">{item.date.split(' ')[1]}</span>
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-xs text-white font-medium truncate">{item.title}</p>
                 <p className="text-[10px] text-white/50">Notify me</p>
               </div>
             </div>
           ))}
        </div>
      </div>
    </motion.div>
  );
}