import GlassPageFrame from '@/components/shared/GlassPageFrame';
import AuraBottomNav from '@/components/streaming/AuraBottomNav';
import SideAccessMenu from '@/components/dashboard/SideAccessMenu';
import { useSidebarVisible } from '../hooks/useSidebarVisible';
import AuraLandingPage from '@/components/streaming/aura/landing/AuraLandingPage';

export default function Aura() {
  const [sidebarVisible, toggleSidebar] = useSidebarVisible();
  return <GlassPageFrame sidebarVisible={sidebarVisible} onSidebarToggle={toggleSidebar} bottomContent={<AuraBottomNav />}>
    <SideAccessMenu />
    <div className="console-page-host"><AuraLandingPage /></div>
  </GlassPageFrame>;
}
