import React from 'react';
import HUDMinimapQuest from './HUDMinimapQuest';
import HUDSkillSlots from './HUDSkillSlots';
import HUDEquipment from './HUDEquipment';
import HUDVitals from './HUDVitals';
import TargetDisplay from './TargetDisplay';
import HUDGameQuickActions from './HUDGameQuickActions';


export default function GameHUD() {
  return (
    <>
      <HUDMinimapQuest />
      <HUDGameQuickActions />
      <TargetDisplay />
      <HUDSkillSlots />
      <HUDVitals />
      <HUDEquipment />
    </>
  );
}