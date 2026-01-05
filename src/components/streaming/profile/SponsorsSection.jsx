import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEFAULT_SPONSORS = [
  {
    id: "monster",
    name: "Monster Energy",
    category: "Energy Drinks",
    logo: "https://images.unsplash.com/photo-1613478223719-2c3a4b7779cb?w=200&auto=format&fit=crop",
    link: "https://www.monsterenergy.com/",
    showcase: [
      "https://images.unsplash.com/photo-1542442828-287225c2ad3c?w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1558640477-1aa0aa61d7c0?w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1574755393849-623942496936?w=1200&auto=format&fit=crop",
    ],
    products: [
      { id: "p1", name: "Monster Hoodie", price: 59, image: "https://images.unsplash.com/photo-1520975682031-662b1f4ebd5b?w=600&auto=format&fit=crop" },
      { id: "p2", name: "Collector Can Pack", price: 24, image: "https://images.unsplash.com/photo-1581291519195-ef11498d1cf5?w=600&auto=format&fit=crop" },
      { id: "p3", name: "Esports Cap", price: 29, image: "https://images.unsplash.com/photo-1520975693411-1f8a8aa4c6ed?w=600&auto=format&fit=crop" },
      { id: "p4", name: "VIP Event Ticket", price: 0, image: "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?w=600&auto=format&fit=crop" },
    ],
  },
  {
    id: "razer",
    name: "Razer",
    category: "Gaming Gear",
    logo: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop",
    link: "https://www.razer.com/",
    showcase: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200&auto=format&fit=crop",
    ],
    products: [
      { id: "r1", name: "Pro Mouse", price: 129, image: "https://images.unsplash.com/photo-1549921296-3ecf9c6a1333?w=600&auto=format&fit=crop" },
      { id: "r2", name: "RGB Keyboard", price: 169, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop" },
      { id: "r3", name: "Gaming Headset", price: 99, image: "https://images.unsplash.com/photo-1585079542156-2755d9b6043a?w=600&auto=format&fit=crop" },
    ],
  },
];

export default function SponsorsSection({ sponsors = DEFAULT_SPONSORS, onSponsorChange }) {
  const [sIndex, setSIndex] = useState(0);
  const sponsor = sponsors[sIndex];
  const [showIndex, setShowIndex] = useState(0);

  const nextSponsor = () => { const ni = (sIndex + 1) % sponsors.length; setSIndex(ni); setShowIndex(0); onSponsorChange?.(sponsors[ni]); };
  const prevSponsor = () => { const pi = (sIndex - 1 + sponsors.length) % sponsors.length; setSIndex(pi); setShowIndex(0); onSponsorChange?.(sponsors[pi]); };

  const nextShow = () => setShowIndex((i) => (i + 1) % sponsor.showcase.length);
  const prevShow = () => setShowIndex((i) => (i - 1 + sponsor.showcase.length) % sponsor.showcase.length);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 mb-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-xl">Partners & Sponsors</h3>
        <div className="flex items-center gap-2">
          <button onClick={prevSponsor} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white"><ChevronLeft className="w-4 h-4"/></button>
          <button onClick={nextSponsor} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white"><ChevronRight className="w-4 h-4"/></button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Identity */}
        <div className="col-span-12 md:col-span-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-white/10 flex-shrink-0">
              <img src={sponsor.logo} alt={sponsor.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-white font-bold text-lg">{sponsor.name}</div>
              <div className="text-white/60 text-sm">{sponsor.category}</div>
              <Button asChild className="mt-3 rounded-xl h-9 px-4 bg-cyan-600 hover:bg-cyan-500">
                <a href={sponsor.link} target="_blank" rel="noreferrer">
                  Visit Sponsor <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Right Showcase */}
        <div className="col-span-12 md:col-span-8">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5">
            <img src={sponsor.showcase[showIndex]} alt="Sponsor showcase" className="w-full h-[320px] object-cover" />
            <button onClick={prevShow} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 border border-white/10 text-white hover:bg-black/60">
              <ChevronLeft className="w-4 h-4 mx-auto" />
            </button>
            <button onClick={nextShow} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 border border-white/10 text-white hover:bg-black/60">
              <ChevronRight className="w-4 h-4 mx-auto" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}