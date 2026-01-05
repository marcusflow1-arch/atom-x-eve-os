import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

const TABS = [
  { id: "home", label: "Home", content: () => <p className="text-white/80">Streams, sponsors, and highlights curated for new viewers.</p> },
  { id: "irl", label: "Real Life", content: () => <p className="text-white/80">Photos, interests, and a touch of humor from off-stream life.</p> },
  { id: "prefs", label: "Gaming Preferences", content: () => <p className="text-white/80">Loves PvE raids, deep lore, and achievement hunting.</p> },
  { id: "clips", label: "Clips & Screenshots", content: () => <p className="text-white/80">Top clips and recent screenshots from the community.</p> },
  { id: "schedule", label: "Schedule", content: () => <p className="text-white/80">Streams Tue/Thu 7-10pm ET. Weekend specials as announced.</p> },
];

export default function AboutMeAutoTabs({ rotateMs = 6000 }) {
  const [active, setActive] = useState(TABS[0].id);
  const [auto, setAuto] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!auto) return;
    timerRef.current = setInterval(() => {
      setActive((prev) => {
        const idx = TABS.findIndex(t => t.id === prev);
        const next = TABS[(idx + 1) % TABS.length].id;
        return next;
      });
    }, rotateMs);
    return () => clearInterval(timerRef.current);
  }, [auto, rotateMs]);

  const ActiveContent = TABS.find(t => t.id === active)?.content || (() => null);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 mb-10">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-bold text-xl">About Me</h3>
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <span>Auto-rotate</span>
          <Toggle pressed={auto} onPressedChange={setAuto} className={`h-8 px-3 rounded-xl ${auto ? 'bg-cyan-600 text-white' : 'bg-white/10 text-white/70'}`}> {auto ? 'On' : 'Off'} </Toggle>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <Button key={t.id} variant="outline" onClick={() => setActive(t.id)} className={`h-9 rounded-xl px-4 whitespace-nowrap ${active === t.id ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70 hover:text-white'}`}>
            {t.label}
          </Button>
        ))}
      </div>

      <div className="min-h-[80px]">
        <ActiveContent />
      </div>
    </div>
  );
}