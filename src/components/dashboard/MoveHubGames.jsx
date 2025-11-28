import React from 'react';

export const moveHubGamesData = [
{
  id: 1,
  title: 'Star Wars Knights of the Old Republic',
  image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=80&h=80&fit=crop',
  achievements: [
  { id: 1, name: 'Jedi Master', icon: '⚔️', description: 'Complete the Jedi training' },
  { id: 2, name: 'Sith Lord', icon: '🔴', description: 'Embrace the dark side' },
  { id: 3, name: 'Republic Hero', icon: '🌟', description: 'Save the Republic' },
  { id: 4, name: 'Force Sensitive', icon: '✨', description: 'Master all Force powers' }]

},
{
  id: 2,
  title: 'Legend of Kain Blood Omen',
  image: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=80&h=80&fit=crop',
  achievements: [
  { id: 1, name: 'Vampire Lord', icon: '🦇', description: 'Become the ultimate vampire' },
  { id: 2, name: 'Blood Feast', icon: '🩸', description: 'Drain 100 enemies' },
  { id: 3, name: 'Soul Reaver', icon: '⚔️', description: 'Obtain the Soul Reaver' },
  { id: 4, name: 'Ancient Power', icon: '💀', description: 'Unlock ancient abilities' }]

},
{
  id: 3,
  title: 'Star Wars Jedi Knight Outcast',
  image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=80&h=80&fit=crop',
  achievements: [
  { id: 1, name: 'Lightsaber Master', icon: '🗡️', description: 'Master all lightsaber forms' },
  { id: 2, name: 'Force Push', icon: '👋', description: 'Push 50 enemies off ledges' },
  { id: 3, name: 'Jedi Knight', icon: '⭐', description: 'Complete the story' },
  { id: 4, name: 'Dark Forces', icon: '🌑', description: 'Defeat the dark Jedi' }]

},
{
  id: 4,
  title: 'Star Wars Jedi Academy',
  image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=80&h=80&fit=crop',
  achievements: [
  { id: 1, name: 'Academy Graduate', icon: '🎓', description: 'Complete Jedi training' },
  { id: 2, name: 'Dual Wielder', icon: '⚔️⚔️', description: 'Master dual lightsabers' },
  { id: 3, name: 'Saber Staff', icon: '🔱', description: 'Master the double-bladed saber' },
  { id: 4, name: 'Chosen Path', icon: '🛤️', description: 'Choose your destiny' }]

},
{
  id: 5,
  title: 'Fallout 4',
  image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=80&h=80&fit=crop',
  achievements: [
  { id: 1, name: 'Vault Dweller', icon: '🏠', description: 'Leave Vault 111' },
  { id: 2, name: 'Wasteland Wanderer', icon: '🌍', description: 'Discover 50 locations' },
  { id: 3, name: 'Power Armor', icon: '🤖', description: 'Acquire power armor' },
  { id: 4, name: 'Brotherhood', icon: '⚙️', description: 'Join the Brotherhood of Steel' }]

},
{
  id: 6,
  title: 'Quake',
  image: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=80&h=80&fit=crop',
  achievements: [
  { id: 1, name: 'Rocket Master', icon: '🚀', description: 'Get 100 rocket kills' },
  { id: 2, name: 'Quad Damage', icon: '💥', description: 'Activate Quad Damage 10 times' },
  { id: 3, name: 'Speedrunner', icon: '⚡', description: 'Complete a level in under 2 minutes' },
  { id: 4, name: 'Arena Master', icon: '🏆', description: 'Win 25 multiplayer matches' }]

},
{
  id: 7,
  title: 'Elder Scrolls',
  image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=80&h=80&fit=crop',
  achievements: [
  { id: 1, name: 'Dragonborn', icon: '🐉', description: 'Discover your true nature' },
  { id: 2, name: 'Thane', icon: '👑', description: 'Become Thane of a hold' },
  { id: 3, name: 'Master Wizard', icon: '🔮', description: 'Master all schools of magic' },
  { id: 4, name: 'Legendary', icon: '⭐', description: 'Reach level 50' }]

},
{
  id: 8,
  title: 'Star Wars Force Unleashed',
  image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=80&h=80&fit=crop',
  achievements: [
  { id: 1, name: 'Sith Apprentice', icon: '🔴', description: 'Complete your training' },
  { id: 2, name: 'Force Lightning', icon: '⚡', description: 'Master Force Lightning' },
  { id: 3, name: 'Star Destroyer', icon: '🚀', description: 'Pull down a Star Destroyer' },
  { id: 4, name: 'Unleashed', icon: '💫', description: 'Unleash your full power' }]

}];


const AbilityTree = ({ achievement }) => {
  return (
    <div className="flex h-full w-full">
      {/* Left Section - 40% - Ability Tree */}
      <div className="w-[40%] h-full flex items-start justify-start pl-8 pt-8">
        <div className="relative" style={{ width: '300px', height: '600px' }}>
          {/* Left Column */}
          {/* Vertical line for left column */}
          <div className="absolute bg-blue-500" style={{
            top: '30px',
            left: '80px',
            width: '2px',
            height: '260px',
            zIndex: 1
          }}></div>
          
          {/* Top circle - left column */}
          <div className="absolute" style={{ top: '20px', left: '56px', zIndex: 2 }}>
            <div className="w-12 h-12 rounded-full border-2 border-blue-500 bg-slate-800"></div>
          </div>
          
          {/* Second circle - left column */}
          <div className="absolute" style={{ top: '100px', left: '56px', zIndex: 2 }}>
            <div className="w-12 h-12 rounded-full border-2 border-blue-500 bg-slate-800"></div>
          </div>
          
          {/* Third circle - left column */}
          <div className="absolute" style={{ top: '180px', left: '56px', zIndex: 2 }}>
            <div className="w-12 h-12 rounded-full border-2 border-blue-500 bg-slate-800"></div>
          </div>
          
          {/* Bottom circle - left column */}
          <div className="absolute" style={{ top: '260px', left: '56px', zIndex: 2 }}>
            <div className="w-12 h-12 rounded-full border-2 border-blue-500 bg-slate-800"></div>
          </div>

          {/* Right Column */}
          {/* Vertical line for right column */}
          <div className="absolute bg-blue-500" style={{
            top: '30px',
            left: '180px',
            width: '2px',
            height: '260px',
            zIndex: 1
          }}></div>
          
          {/* Top circle - right column */}
          <div className="absolute" style={{ top: '20px', left: '156px', zIndex: 2 }}>
            <div className="w-12 h-12 rounded-full border-2 border-blue-500 bg-slate-800"></div>
          </div>
          
          {/* Second circle - right column */}
          <div className="absolute" style={{ top: '100px', left: '156px', zIndex: 2 }}>
            <div className="w-12 h-12 rounded-full border-2 border-blue-500 bg-slate-800"></div>
          </div>
          
          {/* Third circle - right column */}
          <div className="absolute" style={{ top: '180px', left: '156px', zIndex: 2 }}>
            <div className="w-12 h-12 rounded-full border-2 border-blue-500 bg-slate-800"></div>
          </div>
          
          {/* Bottom circle - right column */}
          <div className="absolute" style={{ top: '260px', left: '156px', zIndex: 2 }}>
            <div className="w-12 h-12 rounded-full border-2 border-blue-500 bg-slate-800"></div>
          </div>

          {/* Y-shaped connections from bottom circles to box */}
          {/* Left diagonal line from left bottom circle */}
          <div className="absolute bg-blue-500" style={{
            top: '286px',
            left: '81px',
            width: '2px',
            height: '90px',
            transformOrigin: 'top center',
            transform: 'rotate(25deg)',
            zIndex: 1
          }}></div>

          {/* Right diagonal line from right bottom circle */}
          <div className="absolute bg-blue-500" style={{
            top: '286px',
            left: '181px',
            width: '2px',
            height: '90px',
            transformOrigin: 'top center',
            transform: 'rotate(-25deg)',
            zIndex: 1
          }}></div>

          {/* Square Box at Bottom */}
          <div className="absolute" style={{ bottom: '80px', left: '98px', zIndex: 2 }}>
            <div className="bg-slate-800 my-32 pt-2 w-16 h-16 border-2 border-blue-500"></div>
          </div>

          {/* Achievement Info */}
          <div className="absolute" style={{ bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '250px' }}>
            <div className="text-center bg-slate-800/80 rounded-lg p-3 border border-blue-500/50">
              <span className="text-3xl mb-2 block">{achievement.icon}</span>
              <h4 className="text-white font-bold text-sm">{achievement.name}</h4>
              <p className="text-slate-400 text-xs mt-1">{achievement.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Divider Line at 40% */}
      <div className="w-[2px] h-full bg-blue-500"></div>

      {/* Right Section - 60% - Empty for now */}
      <div className="flex-1 h-full bg-slate-800/10"></div>
    </div>);

};

export default function MoveHubTab() {
  const [selectedGame, setSelectedGame] = React.useState(null);
  const [selectedAchievement, setSelectedAchievement] = React.useState(null);

  const handleGameClick = (game) => {
    setSelectedGame(game);
    setSelectedAchievement(null);
  };

  const handleAchievementClick = (achievement) => {
    setSelectedAchievement(achievement);
  };

  const handleCloseOverlay = () => {
    setSelectedGame(null);
    setSelectedAchievement(null);
  };

  const handleBackToGame = () => {
    setSelectedAchievement(null);
  };

  return (
    <div className="h-full w-full flex">
      <div className="w-[20%] h-full bg-slate-800/20 relative overflow-hidden">
        <div className="h-full overflow-y-auto">
          {moveHubGamesData.map((game) =>
          <div
            key={game.id}
            onClick={() => handleGameClick(game)}
            className="flex items-center gap-3 p-3 cursor-pointer">

              <img
              src={game.image}
              alt={game.title}
              className="w-12 h-12 rounded object-cover flex-shrink-0" />

              <span className="text-slate-300 text-sm hover:text-blue-400 transition-colors">
                {game.title}
              </span>
            </div>
          )}
        </div>

        {selectedGame &&
        <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-10 flex flex-col">
            <div className="p-4 border-b border-slate-700">
              <button
              onClick={handleCloseOverlay}
              className="text-slate-400 hover:text-white mb-2">

                ← Back
              </button>
              <h3 className="text-white font-bold text-lg">{selectedGame.title}</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <h4 className="text-blue-400 font-semibold mb-3 text-sm">Achievements & Abilities</h4>
              <div className="space-y-3">
                {selectedGame.achievements.map((achievement) =>
              <div
                key={achievement.id}
                onClick={() => handleAchievementClick(achievement)}
                className={`bg-slate-800/50 rounded-lg p-3 border transition-colors cursor-pointer ${
                selectedAchievement?.id === achievement.id ?
                'border-blue-500 bg-blue-500/10' :
                'border-slate-700/50 hover:border-blue-500/50'}`
                }>

                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{achievement.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-white font-semibold text-sm mb-1">
                          {achievement.name}
                        </h5>
                        <p className="text-slate-400 text-xs">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  </div>
              )}
              </div>
            </div>
          </div>
        }
      </div>
      
      <div className="w-[1px] h-full bg-slate-600"></div>
      
      <div className="flex-1 h-full bg-slate-800/10">
        {selectedAchievement ?
        <>
            <div className="p-4 border-b border-slate-700">
              <button
              onClick={handleBackToGame}
              className="text-slate-400 hover:text-white text-sm">

                ← Back to Achievements
              </button>
            </div>
            <AbilityTree achievement={selectedAchievement} />
          </> :

        <div className="flex items-center justify-center h-full text-slate-500">
            <p className="text-center">
              {selectedGame ?
            'Select an achievement to view its ability tree' :
            'Select a game and achievement to view ability tree'
            }
            </p>
          </div>
        }
      </div>
    </div>);

}