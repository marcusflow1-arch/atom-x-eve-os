// Genre collections describe the design direction, not deployed combat engines.
// Only the existing avatar duel has a queue adapter. Never fall back to it for a concept.
export const BATTLE_MODES = [
  { id: 'pvp', label: 'PvP', subtitle: 'Challenge another player', goal: 'Outplay your opponent with your avatar and equipped abilities.' },
  { id: 'pve', label: 'PvE', subtitle: 'Practice & encounters', goal: 'Planned: quick AI encounters for experience and occasional materials.' },
  { id: 'world_boss', label: 'World Events', subtitle: 'Take on a boss together', goal: 'Planned: join other players against a shared boss for experience and materials.' },
];
const style = (id, name, view, description, reference) => ({ id, name, view, description, reference });
export const BATTLE_GENRES = [
  { id: 'core', label: 'Avatar Duel', family: 'Current arena', icon: 'swords', tagline: 'Your avatar. Your next rival.',
    description: 'Queue for the existing two-player avatar arena with your equipped abilities.',
    objective: 'Defeat the opposing avatar.', tags: ['1 vs 1', 'Equipped abilities', 'Current queue'], styles: [] },
  { id: 'fighting', label: 'Fighting', family: 'Close combat', icon: 'swords', tagline: 'One rivalry. Three dimensions.',
    description: 'A fighting arena combining spacing, sidesteps and aerial pursuit. Arena Shift would change how you move, not who you are fighting.',
    objective: 'Win the duel; health and the round timer carry through each shift.', tags: ['Duel', 'Combos', 'Counterplay'],
    styles: [
      style('side', 'Side-on duel', '2D', 'Read spacing, guard and punish on a shared fighting plane.', 'Street Fighter'),
      style('sidestep', 'Ground arena', '3D', 'Circle your opponent and use lateral movement to create openings.', 'Tekken'),
      style('aerial', 'Aerial clash', 'AIR', 'Pursue through an open arena with vertical movement and ranged abilities.', 'Dragon Ball Z: Budokai Tenkaichi 3'),
    ] },
  { id: 'racing', label: 'Racing', family: 'Speed & control', icon: 'flag', tagline: 'Your line. Your advantage.',
    description: 'One race built around street driving, technical corners and ability-driven overtakes.',
    objective: 'Finish the course first; checkpoints and race progress persist through shifts.', tags: ['Race', 'Handling', 'Overtakes'],
    styles: [
      style('street', 'Street sprint', 'TRACK', 'Read the road and commit to a clean racing line.', 'Need for Speed'),
      style('circuit', 'Precision course', 'TRACK', 'Use braking, grip and corner exits to gain ground.', 'Forza Horizon'),
      style('combat', 'Ability race', 'TRACK', 'Use race-compatible cards for boosts, shields and disruption.', 'Mario Kart'),
    ] },
  { id: 'sci-fi', label: 'Sci-fi', family: 'Themed action arena', icon: 'orbit', tagline: 'Beyond one universe.',
    description: 'A science-fiction collection combining energy melee, tactical powers and ranged pressure in an original arena.',
    objective: 'Keep a shared combat objective while changing the active arena style.', tags: ['Energy', 'Technology', 'Mobility'],
    styles: [
      style('energy', 'Energy duel', '3D', 'Close-range weapons and directional powers.', 'Star Wars: Jedi Outcast'),
      style('tactical', 'Tactical powers', '3D', 'Create openings through complementary ability effects.', 'Mass Effect'),
      style('weapon', 'Weapon arena', '3D', 'Control space with ranged combat and movement.', 'Halo'),
    ] },
  { id: 'fantasy', label: 'Fantasy', family: 'Themed action arena', icon: 'sparkles', tagline: 'Build your own legend.',
    description: 'Traversal, deliberate duels and creature encounters share a fantasy world shaped by earned abilities.',
    objective: 'Complete the selected combat objective across the three styles.', tags: ['Magic', 'Melee', 'Exploration'],
    styles: [
      style('wild', 'Wild terrain', '3D', 'Use elevation and environmental opportunities.', 'The Legend of Zelda: Breath of the Wild'),
      style('duel', 'Measured duel', '3D', 'Read attacks and choose the moment to commit.', 'Elden Ring'),
      style('hunt', 'Creature hunt', '3D', 'Read a large enemy and exploit openings together.', 'Monster Hunter'),
    ] },
  { id: 'shooter', label: 'Shooter', family: 'Aim & positioning', icon: 'crosshair', tagline: 'Precision meets personality.',
    description: 'An original combat space for fast aim, team abilities and mobile engagements.',
    objective: 'Keep the same elimination or objective score across shifts.', tags: ['Aim', 'Positioning', 'Team play'],
    styles: [
      style('arena', 'Arena pressure', '3D', 'Stay mobile and manage ranges.', 'Quake'),
      style('hero', 'Ability front', '3D', 'Combine roles and utility around a shared objective.', 'Overwatch'),
      style('mobile', 'Mobile skirmish', '3D', 'Reposition and use movement to change an engagement.', 'Apex Legends'),
    ] },
  { id: 'rpg', label: 'RPG', family: 'Tactical encounters', icon: 'book', tagline: 'Every unlock tells a story.',
    description: 'A proposal for command-based combat, reactive defense and party combinations.',
    objective: 'Defeat the encounter; turn order needs explicit transition rules.', tags: ['Commands', 'Reactions', 'Party synergy'],
    styles: [
      style('command', 'Command duel', 'TACTICAL', 'Plan the next action and spend resources deliberately.', 'Final Fantasy X'),
      style('react', 'Reactive defense', 'TACTICAL', 'Use timed defensive actions during enemy attacks.', 'Clair Obscur: Expedition 33'),
      style('team', 'Party sequence', 'TACTICAL', 'Create advantages through complementary roles.', 'Persona 5'),
    ] },
  { id: 'strategy', label: 'Strategy', family: 'Command & control', icon: 'layers', tagline: 'Win before the final blow.',
    description: 'A strategy collection exploring unit control, territory and positional tactics.',
    objective: 'Preserve the strategic objective and resources; action timing needs a dedicated ruleset.', tags: ['Planning', 'Territory', 'Units'],
    styles: [
      style('command', 'Unit command', 'TACTICAL', 'Coordinate units and spend resources.', 'StarCraft'),
      style('territory', 'Territory siege', 'TACTICAL', 'Control routes and defend valuable ground.', 'Age of Empires'),
      style('formation', 'Formation clash', 'TACTICAL', 'Use positioning and matchups to create advantages.', 'Fire Emblem'),
    ] },
  { id: 'sports', label: 'Sports', family: 'Precision challenges', icon: 'trophy', tagline: 'Make the decisive play.',
    description: 'Explore sports-inspired challenges. Each sport requires its own scoring and movement rules before it can become a queue.',
    objective: 'Select one compatible sport ruleset; different sports do not silently share a match.', tags: ['Timing', 'Teamwork', 'Precision'],
    styles: [
      style('field', 'Field play', '3D', 'Find space and build coordinated scoring opportunities.', 'EA Sports FC'),
      style('court', 'Court play', '3D', 'Use passing and positioning around a compact court.', 'NBA 2K'),
      style('boost', 'Boost arena', '3D', 'Combine vehicle movement with a shared ball objective.', 'Rocket League'),
    ] },
  { id: 'platform', label: 'Platform', family: 'Traversal challenges', icon: 'gamepad', tagline: 'Movement is your signature.',
    description: 'A traversal collection for precise jumps, speed routes and obstacle rounds.',
    objective: 'Reach the finish while keeping checkpoint progress through compatible shifts.', tags: ['Traversal', 'Timing', 'Momentum'],
    styles: [
      style('precision', 'Precision route', '2D', 'Read platforms and time each jump.', 'Super Mario'),
      style('speed', 'Momentum run', '2D', 'Maintain speed through changing terrain.', 'Sonic the Hedgehog'),
      style('obstacle', 'Obstacle course', '3D', 'Navigate shared hazards on the way to the finish.', 'Fall Guys'),
    ] },
];
export function getBattleQueueTarget(mode, genreId) {
  return mode === 'pvp' && genreId === 'core' ? { mode: 'pvp' } : null;
}
export function getBattleAvailability(mode, genreId) {
  if (getBattleQueueTarget(mode, genreId)) return { available: true, label: 'Current queue', reason: 'Existing two-player avatar arena. Genre shifting is not enabled.' };
  if (mode === 'pve') return { available: false, label: 'Mode preview', reason: 'AI encounters are not available to queue yet. Experience and material rewards shown here describe the planned mode.' };
  if (mode === 'world_boss') return { available: false, label: 'Mode preview', reason: 'No world-event schedule is connected yet. Bosses, parties and rewards will appear when events are available.' };
  return { available: false, label: 'Genre preview', reason: 'Explore this genre’s three proposed styles. Its arena and Arena Shift are not available to queue yet.' };
}
