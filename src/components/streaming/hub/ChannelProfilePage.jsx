import { useEffect } from 'react';
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
import { ChannelPresentation } from './ChannelPlayback';
import './consoleHub.css';

export default function ChannelProfilePage({ streamerId, streamId, source }) {
  const [sidebarVisible, toggleSidebar] = useSidebarVisible();
  const client = useQueryClient();
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
  return <GlassPageFrame sidebarVisible={sidebarVisible} onSidebarToggle={toggleSidebar} bottomContent={<AuraBottomNav />}><SideAccessMenu /><div className="console-page-host"><main className="console-hub console-profile-page"><header><Link className="console-text-button" to={stream ? `/streaming?${new URLSearchParams({ gameId: stream.gameId })}` : '/streaming'}><ArrowLeft size={17} />Back to Streamers</Link></header>{query.isPending ? <div className="console-empty" role="status">Opening channel…</div> : query.isError && !stream ? <div className="console-empty" role="alert"><p>This channel could not load.</p><button type="button" onClick={() => query.refetch()}>Try again</button></div> : stream ? <ChannelPresentation stream={stream} /> : <div className="console-empty"><Artwork key={profile?.avatar_url} src={profile?.avatar_url} avatar className="console-avatar" /><h1>{profile?.display_name || 'Channel unavailable'}</h1><Radio size={24} /><p>This channel is offline.</p>{profile?.bio && <p className="console-channel-bio">{profile.bio}</p>}{profile && <small>{formatCount(profile.follower_count)} followers</small>}<Link to="/streaming" className="console-text-button">Explore live streamers</Link></div>}</main></div></GlassPageFrame>;
}
