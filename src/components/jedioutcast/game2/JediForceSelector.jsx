import { Brain, Hand, HeartPulse, Zap, Wind } from 'lucide-react';
import { RAVEN_GAMEPLAY_FORCE_POWERS } from './jediSourceConstants';

const ICONS = {
  heal: HeartPulse,
  speed: Wind,
  push: Hand,
  pull: Hand,
  telepathy: Brain,
  grip: Hand,
  lightning: Zap,
};

function wrapped(index) {
  const count = RAVEN_GAMEPLAY_FORCE_POWERS.length;
  return (index % count + count) % count;
}

export default function JediForceSelector({ selectedId, visible }) {
  const selectedIndex = Math.max(0, RAVEN_GAMEPLAY_FORCE_POWERS.findIndex((power) => power.id === selectedId));
  const slots = [-3, -2, -1, 0, 1, 2, 3].map((offset) => ({
    offset,
    power: RAVEN_GAMEPLAY_FORCE_POWERS[wrapped(selectedIndex + offset)],
  }));

  return (
    <div
      className={`pointer-events-none absolute bottom-5 left-1/2 z-30 -translate-x-1/2 transition-all duration-150 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
      aria-hidden={!visible}
    >
      <div className="flex items-center justify-center gap-3">
        {slots.map(({ offset, power }) => {
          const Icon = ICONS[power.id] || Zap;
          const selected = offset === 0;
          return (
            <div
              key={offset}
              className={`grid place-items-center rounded-md border border-cyan-100/15 bg-black/55 text-cyan-100 shadow-[0_0_18px_rgba(80,190,255,.16)] backdrop-blur-sm ${selected ? 'h-[60px] w-[60px]' : 'h-[30px] w-[30px] opacity-70'}`}
              title={power.label}
            >
              <Icon className={selected ? 'h-8 w-8' : 'h-4 w-4'} strokeWidth={1.6} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-center text-[12px] font-semibold uppercase tracking-[0.16em] text-[#81bde4]">
        {RAVEN_GAMEPLAY_FORCE_POWERS[selectedIndex]?.label}
      </div>
    </div>
  );
}
