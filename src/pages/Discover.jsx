import GlassPageFrame from '@/components/shared/GlassPageFrame';
import AuraBottomNav from '@/components/streaming/AuraBottomNav';
import SideAccessMenu from '@/components/dashboard/SideAccessMenu';
import { useSidebarVisible } from '../hooks/useSidebarVisible';
import DiscoverHub from '@/components/streaming/discover/DiscoverHub';

export default function Discover() {
  const [sidebarVisible, toggleSidebar] = useSidebarVisible();
  return <GlassPageFrame sidebarVisible={sidebarVisible} onSidebarToggle={toggleSidebar} bottomContent={<AuraBottomNav />}>
    <SideAccessMenu />
    <div className="console-page-host"><DiscoverHub /></div>
  </GlassPageFrame>;
}
