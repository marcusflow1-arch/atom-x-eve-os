import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useSidebarVisible } from '@/hooks/useSidebarVisible';

export default function SidebarToggle({ className = '' }) {
  const [visible, toggle] = useSidebarVisible();
  const Icon = visible ? PanelLeftClose : PanelLeftOpen;
  return (
    <button
      type="button"
      onClick={toggle}
      title={visible ? 'Hide sidebar' : 'Show sidebar'}
      aria-label={visible ? 'Hide sidebar' : 'Show sidebar'}
      aria-expanded={visible}
      data-sidebar-toggle="true"
      data-ui-editor-ignore="true"
      className={'pointer-events-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/60 backdrop-blur-lg transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ' + className}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
