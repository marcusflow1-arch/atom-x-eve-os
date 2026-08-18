import React from 'react';
import HUDMinimapQuest from './HUDMinimapQuest';
import HUDVitals from './HUDVitals';
import TargetDisplay from './TargetDisplay';
import HUDGameQuickActions from './HUDGameQuickActions';
import HUDKillStreakChip from './HUDKillStreakChip';
import GameEngineEditLauncher from '../GameEngineEditLauncher';

export default function GameHUD() {
  return (
    <>
      <HUDKillStreakChip />
      <HUDMinimapQuest />
      <HUDGameQuickActions />
      <TargetDisplay />
      <HUDVitals />
      <GameEngineEditLauncher />
    </>
  );
}
