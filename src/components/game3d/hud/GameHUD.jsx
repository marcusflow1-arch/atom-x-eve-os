import React from 'react';
import HUDMinimapQuest from './HUDMinimapQuest';
import HUDVitals from './HUDVitals';
import TargetDisplay from './TargetDisplay';
import HUDGameQuickActions from './HUDGameQuickActions';
import HUDCompanionSkillSlots from './HUDCompanionSkillSlots';
import HUDKillStreakChip from './HUDKillStreakChip';


export default function GameHUD() {
  return (
    <>
      <HUDKillStreakChip />
      <HUDMinimapQuest />
      <HUDGameQuickActions />
      <TargetDisplay />
      <HUDCompanionSkillSlots />
      <HUDVitals />
    </>
  );
}