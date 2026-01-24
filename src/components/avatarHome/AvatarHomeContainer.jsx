import React from 'react';
import { base44 } from '@/api/base44Client';
import AvatarPresence from './AvatarPresence';
import AvatarGreeting from './AvatarGreeting';
import AvatarHomeEnvironment from './AvatarHomeEnvironment';
import HomeObjectInteraction from './HomeObjectInteraction';
import AvatarAchievementWall from './AvatarAchievementWall';
import AvatarMemoryBoard from './AvatarMemoryBoard';
import AvatarCatchphraseDisplay from './AvatarCatchphraseDisplay';
import LunaDashboardPortalLayer from './LunaDashboardPortalLayer';

export default function AvatarHomeContainer({ mode, avatarUserId, entryContext }) {
  const [state, setState] = React.useState({
    name: 'Guest', level: 1, mood: 'calm', catchphrase: 'Welcome in. Make yourself at home.',
    achievements: [], games: [], activity: []
  });
  const [selected, setSelected] = React.useState(null);
  const [greet, setGreet] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        const isSelf = mode === 'self' || !avatarUserId || avatarUserId === me?.id;
        const targetId = isSelf ? me?.id : avatarUserId;

        // Try unified AvatarHomeState first
        const records = await base44.entities.AvatarHomeState.filter({ avatarId: targetId });
        const home = records?.[0];

        const headerName = isSelf ? (me?.full_name || me?.email?.split('@')[0] || 'You') : (home?.name || 'Friend');

        // Fallback content
        const ach = await base44.entities.Achievement.list('-created_date', 6);
        const games = await base44.entities.Game.list('-created_date', 6);

        setState(s => ({
          ...s,
          name: headerName,
          level: home?.level ?? s.level,
          mood: home?.mood ?? s.mood,
          catchphrase: home?.catchphrase ?? s.catchphrase,
          achievements: (home?.achievements && home.achievements.length > 0) ? home.achievements : (ach || []),
          games: (home?.games && home.games.length > 0) ? home.games : (games || []),
        }));
      } catch (e) {
        console.error('AvatarHomeContainer load failed', e);
      }
    };
    load();
  }, [mode, avatarUserId]);

  const objects = React.useMemo(() => ([
    { id: 'trophies', type: 'trophy_wall', label: 'Trophy Wall', onInteract: () => setSelected({ id: 'trophies', contentType: 'achievements' }) },
    { id: 'console', type: 'console', label: 'Console', onInteract: () => setSelected({ id: 'console', contentType: 'games' }) },
    { id: 'memory', type: 'memory_board', label: 'Memory Board', onInteract: () => setSelected({ id: 'memory', contentType: 'activity' }) },
  ]), []);

  return (
    <div className="space-y-6">
      <AvatarPresence
        avatarData={{ name: state.name, level: state.level, mood: state.mood, catchphrase: state.catchphrase }}
        isOwner={mode === 'self'}
      />

      {greet && (
        <AvatarGreeting message={mode === 'self' ? 'Hey — welcome.' : `Welcome to ${state.name}\'s home.`} autoDismissMs={2800} onDismiss={() => setGreet(false)} />
      )}

      <AvatarCatchphraseDisplay catchphrase={state.catchphrase} />

      <AvatarHomeEnvironment theme="default" interactiveObjects={objects} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AvatarAchievementWall achievements={(state.achievements || []).map(a => ({
            id: a.id, title: a.title, rarity: (a.rarity || 'Common').toLowerCase().includes('legend') ? 'legendary' : (a.rarity || 'Common').toLowerCase().includes('rare') ? 'rare' : 'common'
          }))} />
        </div>
        <AvatarMemoryBoard activities={[]} />
      </div>

      <LunaDashboardPortalLayer enabled={mode === 'self'} />

      {selected && (
        <HomeObjectInteraction objectId={selected.id} contentType={selected.contentType} onClose={() => setSelected(null)} />)
      }
    </div>
  );
}