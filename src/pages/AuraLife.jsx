import GlassPageFrame from '@/components/shared/GlassPageFrame';
import AuraBottomNav from '@/components/streaming/AuraBottomNav';
import SideAccessMenu from '@/components/dashboard/SideAccessMenu';
import LifeBeyondDirectory from '@/components/streaming/aura/life/LifeBeyondDirectory';
import { useSidebarVisible } from '@/hooks/useSidebarVisible';

export default function AuraLife() {
  const [sidebarVisible, toggleSidebar] = useSidebarVisible();
  return <GlassPageFrame sidebarVisible={sidebarVisible} onSidebarToggle={toggleSidebar} bottomContent={<AuraBottomNav />}>
    <SideAccessMenu />
    <LifeBeyondDirectory />
  </GlassPageFrame>;
}