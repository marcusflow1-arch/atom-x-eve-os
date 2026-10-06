import GlassPageFrame from '@/components/shared/GlassPageFrame';
import SideAccessMenu from '@/components/dashboard/SideAccessMenu';
import ScreenshotExtractor from '@/components/screenshots/ScreenshotExtractor';

export default function Screenshots() {
  return (
    <GlassPageFrame>
      <SideAccessMenu />
      <ScreenshotExtractor />
    </GlassPageFrame>
  );
}
