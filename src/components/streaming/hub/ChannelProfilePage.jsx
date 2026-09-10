import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Radio } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import AuraBottomNav from '@/components/streaming/AuraBottomNav';
import SideAccessMenu from '@/components/dashboard/SideAccessMenu';
import { useSidebarVisible } from '@/hooks/useSidebarVisible';
import { buildDiscovery, formatCount } from './discoveryModel';
import { DIRECTORY_KEY, PUBLIC_FIELDS } from './useLiveDirectory';
import { Artwork } from './DirectoryCards';
import StreamMedia from './StreamMedia';
import { useAuth } from '@/components/auth/AuthContext';
import ProfileInfoBar from '../creator/ProfileInfoBar';
import PlayerAchievementCollection from '../collection/PlayerAchievementCollection';
import GallerySection from '../creator/GallerySection';
import ScheduleSection from '../creator/ScheduleSection';
import GamesSection from '../creator/GamesSection';
import useChannelHomeData from '../channel/useChannelHomeData';
import ChannelHomeContent from '../channel/ChannelHomeContent';
import ChannelCommunityChat from '../channel/ChannelCommunityChat';
import './consoleHub.css';
import '../channel/channelHome.css';

export default function ChannelProfilePage({ streamerId, streamId, source }) {
  const [sidebarVisible, toggleSidebar] = useSidebarVisible();
  const client = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(null);
  const [scheduleDate, setScheduleDate] = useState(null);
  const anchorRef = useRef(null);
  const cached = client.getQueryData(DIRECTORY_KEY)?.channels.find((stream) => (stream.streamerId === streamerId || stream.profileId === streamerId) && (!streamId || stream.recordId === streamId));
  const query = useQuery({
    queryKey: ['channel-watch', streamerId, streamId, source],
    initialData: cached ? { stream: cached, profile: { display_name: cached.name, avatar_url: cached.avatar, bio: cached.bio, follower_count: cached.followers } } : undefined,
    initialDataUpdatedAt: 0, staleTime: 30000, refetchInterval: 30000, retry: 1,
    queryFn: async () => {
      const found = await Promise.all([
        base44.entities.StreamerProfile.filter({ user_id: streamerId }, '-created_date', 1, 0, PUBLIC_FIELDS.StreamerProfile),
        base44.entities.StreamerProfile.filter({ id: streamerId }, '-created_date', 1, 0, PUBLIC_FIELDS.StreamerProfile),
      ]);
      const profiles = found.flat();
      const profile = profiles[0];
      const owners = [...new Set([streamerId, profile?.user_id, profile?.id].filter(Boolean))];
      const broadcasts = await Promise.all(['Stream', 'AuraStream'].map(async (name) => {
        const pages = await Promise.all(owners.map((id) => base44.entities[name].filter({ streamer_id: id, is_live: true }, '-started_at', 20, 0, PUBLIC_FIELDS[name])));
        return [...new Map(pages.flat().map((row) => [row.id, row])).values()];
      }));
      const gameIds = [...new Set(broadcasts.flat().map((stream) => stream.game_id).filter(Boolean))];
      const games = (await Promise.all(gameIds.map((id) => base44.entities.Game.filter({ id }, '-created_date', 1, 0, PUBLIC_FIELDS.Game)))).flat();
      const { channels } = buildDiscovery({ profiles, games, streams: broadcasts[0], auraStreams: broadcasts[1] });
      const stream = channels.find((row) => row.recordId === streamId && row.source === source) || channels[0];
      return { stream: stream || null, profile: profile || null };
    },
  });
  useEffect(() => {
    const cleanups = [];
    for (const name of ['Stream', 'AuraStream']) {
      try { cleanups.push(base44.entities[name].subscribe((event) => { if (event.type === 'delete' || [streamerId, query.data?.stream?.profileId].includes(event.data?.streamer_id)) client.invalidateQueries({ queryKey: ['channel-watch', streamerId] }); })); } catch { /* Timed refresh covers unavailable realtime. */ }
    }
    return () => cleanups.forEach((unsubscribe) => unsubscribe?.());
  }, [client, streamerId, query.data?.stream?.profileId]);
  const stream = query.data?.stream;
  const profile = query.data?.profile;
  const owner = profile?.user_id || stream?.streamerId || streamerId;
  const homeQuery = useChannelHomeData(owner, profile?.id || stream?.profileId);
  const layout = homeQuery.data?.layouts?.[0] || {};
  const activeRecord = stream ? { id: stream.recordId, is_live: stream.isLive !== false } : null;
  const openTab = (tab, date) => {
    if (!['schedule', 'cards', 'gallery', 'games', null].includes(tab)) return;
    setScheduleDate(date || null); setActiveTab((previous) => previous === tab ? null : tab);
    if (activeTab !== tab && ['schedule', 'games'].includes(tab)) requestAnimationFrame(() => document.querySelector('.channel-stage-grid')?.scrollIntoView({ block: 'start', behavior: 'auto' }));
  };
  const closeTab = () => setActiveTab(null);
  useEffect(() => {
    const close = (event) => { if (event.key === 'Escape' && !event.defaultPrevented && !['gallery', 'cards'].includes(activeTab)) setActiveTab(null); };
    window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close);
  }, [activeTab]);
  return <GlassPageFrame sidebarVisible={sidebarVisible} onSidebarToggle={toggleSidebar} bottomContent={<AuraBottomNav />}><SideAccessMenu /><div className="console-page-host"><main className="console-hub console-profile-page channel-home-page channel-public-page"><header><Link className="console-text-button" to={stream ? `/streaming?${new URLSearchParams({ gameId: stream.gameId })}` : '/streaming'}><ArrowLeft size={17} />Back to Streamers</Link></header>{query.isPending ? <div className="console-empty" role="status">Opening channel…</div> : query.isError && !stream ? <div className="console-empty" role="alert"><p>This channel could not load.</p><button type="button" onClick={() => query.refetch()}>Try again</button></div> : <>
    <div className="channel-stage-grid grid grid-cols-12 gap-4"><div className="channel-stage-player col-span-12 lg:col-span-9 xl:col-span-10"><div className="channel-stage-caption"><span>{stream ? `LIVE · ${formatCount(stream.viewers)} watching` : 'CHANNEL OFFLINE'}</span><strong>{stream?.title || profile?.tagline || 'The next stream is on its way.'}</strong></div><div data-stream-player-box="true" className="channel-public-player">{stream ? <StreamMedia key={stream.id} url={stream.url} poster={stream.thumbnail} title={stream.title} active={!activeTab} /> : <div className="channel-offline-stage"><Artwork key={profile?.avatar_url} src={profile?.avatar_url} avatar className="console-avatar" /><Radio size={24} /><h1>{profile?.display_name || 'Channel unavailable'}</h1><p>This channel is offline. Explore the channel below, or open Gallery and Schedule.</p></div>}</div></div><div className="channel-stage-chat col-span-12 lg:col-span-3 xl:col-span-2"><ChannelCommunityChat key={activeRecord?.id || 'offline'} streamId={activeRecord?.id} isLive={Boolean(stream)} user={user} /></div></div>
    <div ref={anchorRef}><ProfileInfoBar activeProfile={profile || { display_name: stream?.name || 'Channel', avatar_url: stream?.avatar, follower_count: stream?.followers }} isEditMode={false} isLive={Boolean(stream)} activeTab={activeTab} setActiveTab={openTab} /></div>
    {profile?.bio && <p className="channel-about-copy">{profile.bio}</p>}
    <ChannelHomeContent sponsors={homeQuery.data?.sponsors || []} allowEditing={false} />
    {activeTab === 'cards' && createPortal(<PlayerAchievementCollection user={user?.id === owner ? user : { id: owner }} publicView={user?.id !== owner} onClose={closeTab} />, document.body)}
    {activeTab === 'gallery' && createPortal(<GallerySection isEditMode={false} galleryImages={layout.gallery_images || []} onClose={closeTab} user={user} channelId={owner} anchorRef={anchorRef} />, document.body)}
    {activeTab === 'schedule' && <ScheduleSection isEditMode={false} scheduleData={layout.schedule_data || {}} scheduledStreams={homeQuery.data?.schedules} initialDate={scheduleDate} onClose={closeTab} />}
    {activeTab === 'games' && <GamesSection isEditMode={false} pinnedGames={layout.pinned_games || []} onClose={closeTab} />}
  </>}</main></div></GlassPageFrame>;
}
