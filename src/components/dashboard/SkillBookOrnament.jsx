import { BookOpen, Sparkles } from 'lucide-react';

// Vector chrome scales with independently resized windows; no baked-in text or UI image.
export function SkillBookCrest({ prefab = false }) {
  const Icon = prefab ? Sparkles : BookOpen;
  return <span className={`lsb-crest ${prefab ? 'lsb-crest--prefab' : ''}`} aria-hidden="true">
    <svg viewBox="0 0 90 90"><path d="M45 3 55 24 73 17 68 38 85 45 68 53 73 74 55 67 45 87 35 67 17 74 22 53 5 45 22 38 17 17 35 24Z"/><path d="m45 11 27 34-27 34L18 45Z"/><path d="m14 23-7 42 27 7M76 23l7 42-27 7"/></svg>
    <Icon size={42} strokeWidth={1.3}/>
  </span>;
}

export default function SkillBookOrnament() {
  return <div className="lsb-ornament" aria-hidden="true">
    {['tl','tr','bl','br'].map(corner => <svg key={corner} className={`lsb-corner lsb-corner--${corner}`} viewBox="0 0 90 90">
      <path d="M2 88V22Q2 2 22 2H88M8 82V26Q8 8 26 8H82M0 38 9 27 4 7 27 12 40 1M6 7l18 17M13 34l11-10 10-11M16 55V35l19-19h20M8 44l8-9-3-22 22 3 9-8M24 24l9 2-7 7Z"/>
      <path d="M19 61V43l24-24h18M4 15 15 4M27 4l8 8M4 27l8 8"/>
    </svg>)}
    <span className="lsb-center-gem lsb-center-gem--top"/><span className="lsb-center-gem lsb-center-gem--bottom"/>
  </div>;
}
