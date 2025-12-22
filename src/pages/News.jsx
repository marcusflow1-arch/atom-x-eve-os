import React, { useMemo, useState } from "react";
import { CalendarDays, Dot, Circle } from "lucide-react";
import NewsItemCard from "../components/news/NewsItemCard";
import NewsDetailOverlay from "../components/news/NewsDetailOverlay";

const sampleNews = [
  {
    id: 101,
    date: "2025-12-02",
    category: "REGULAR UPDATE",
    title: "ArtiO Arrives: Bear Goddess Update",
    subtitle: "Dual stances, a new Aspect, god balance, and UI polish",
    summary: "A major balance patch lands with new mechanics and a refined experience.",
    image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&h=450&fit=crop",
    details: [
      "New god with stance swapping and roar mechanic",
      "Global combat number readability pass",
      "Controller aim assist and recoil fixes",
    ],
  },
  {
    id: 102,
    date: "2025-11-26",
    category: "ITEM / DISCOUNT",
    title: "Black Friday Sale",
    subtitle: "25% off Diamond price storewide",
    summary: "Limited-time sale on featured sets, skins, and boosts across the storefront.",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=450&fit=crop",
    details: [
      "Legendary card bundles",
      "Season Pass discount",
      "Creator shop highlights",
    ],
  },
  {
    id: 103,
    date: "2025-11-26",
    category: "SMALL UPDATE",
    title: "Client Hotfix 1.0.3",
    summary: "Addresses party invites reliability and reduces memory spikes on launch.",
  },
  {
    id: 104,
    date: "2025-11-18",
    category: "REGULAR UPDATE",
    title: "Da Ji Arrives | The Nine-Tailed Vox Patch",
    subtitle: "Earn free rewards, performance fixes, and experience improvements.",
    summary: "A content refresh that modernizes early game routes and adds new cosmetics.",
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=450&fit=crop",
  },
  {
    id: 105,
    date: "2025-12-02",
    category: "MINOR NOTICE",
    title: "Creator Hub maintenance window",
    summary: "Short maintenance between 01:00–01:20 UTC. Purchases unaffected.",
  },
];

export default function NewsPage() {
  const [selected, setSelected] = useState(null);

  // Group by date (descending)
  const grouped = useMemo(() => {
    const by = sampleNews.reduce((acc, n) => {
      (acc[n.date] = acc[n.date] || []).push(n);
      return acc;
    }, {});
    return Object.keys(by)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((d) => ({ date: d, items: by[d] }));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6">
      <style>{`
        .glass { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .timeline:before { content: ""; position: absolute; left: 10px; top: 0; bottom: 0; width: 2px; background: linear-gradient(to bottom, rgba(255,255,255,0.3), rgba(255,255,255,0.1)); border-radius: 2px; }
        .date-chip { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); backdrop-filter: blur(14px); border-radius: 9999px; }
      `}</style>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="glass p-6 mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">News & Updates</h1>
          <p className="text-slate-400 mt-2">A clean, console-ready feed of releases, sales, and announcements.</p>
        </div>

        {/* Timeline */}
        <div className="relative timeline pl-10">
          {grouped.map((section) => {
            const d = new Date(section.date);
            const label = d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }).toUpperCase();
            return (
              <div key={section.date} className="mb-8">
                {/* Date row */}
                <div className="flex items-center gap-3 mb-3 relative">
                  <div className="w-5 h-5 rounded-full bg-cyan-400/30 border border-cyan-300/50 grid place-items-center">
                    <Circle className="w-2.5 h-2.5 text-cyan-200" />
                  </div>
                  <span className="date-chip text-xs md:text-sm px-3 py-1 text-white/90 font-semibold tracking-wide">{label}</span>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <NewsItemCard key={item.id} item={item} onClick={setSelected} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <NewsDetailOverlay item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}