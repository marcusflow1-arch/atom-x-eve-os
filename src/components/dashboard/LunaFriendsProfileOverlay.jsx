import { X } from 'lucide-react';
import FriendsListContent from './FriendsListContent';

export default function LunaFriendsProfileOverlay({ onClose }) {
  return (
    <div
      data-dashboard-utility-workspace
      aria-label="Friends profile workspace"
      className="fixed left-[330px] right-0 top-[64px] bottom-[32px] z-[118] pointer-events-auto overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(18,29,44,.84), rgba(11,19,31,.72) 46%, rgba(8,15,25,.84))',
        backdropFilter: 'blur(24px) saturate(132%)',
        WebkitBackdropFilter: 'blur(24px) saturate(132%)',
        boxShadow: 'inset 1px 0 0 rgba(255,255,255,.05), inset 0 1px 0 rgba(255,255,255,.035)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(103,232,249,.07),transparent_28%),radial-gradient(circle_at_76%_20%,rgba(129,140,248,.055),transparent_30%)]" />

      <button
        type="button"
        onClick={onClose}
        aria-label="Close Friends"
        className="absolute right-5 top-4 z-[70] flex h-9 w-9 items-center justify-center border border-white/[0.09] bg-black/20 text-white/55 backdrop-blur-xl transition-colors hover:bg-white/[0.08] hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative z-10 h-full w-full p-3">
        <FriendsListContent lunaOverlay />
      </div>
    </div>
  );
}
