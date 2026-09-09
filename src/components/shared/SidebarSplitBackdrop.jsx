export default function SidebarSplitBackdrop({ visible }) {
  if (!visible) return null;

  return (
    <div aria-hidden="true" className="hidden md:block">
      <div className="fixed left-0 top-16 bottom-12 z-[2] w-[10vw] border-r border-white/10 bg-slate-950/85 backdrop-blur-3xl shadow-[18px_0_42px_rgba(0,0,0,0.48)]" />
      <div className="fixed left-[10vw] right-0 top-16 bottom-12 z-[2] pointer-events-none bg-black/15 backdrop-blur-[1px]" />
    </div>
  );
}