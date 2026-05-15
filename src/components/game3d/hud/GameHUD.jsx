import React from 'react';
import HUDMinimapQuest from './HUDMinimapQuest';
import HUDSkillSlots from './HUDSkillSlots';
import HUDEquipment from './HUDEquipment';
import HUDVitals from './HUDVitals';
import TargetDisplay from './TargetDisplay';


export default function GameHUD() {
  return (
    <>
      <HUDMinimapQuest />
      <TargetDisplay />
      <HUDSkillSlots />
      <HUDVitals />
      <HUDEquipment />
    </>
  );
}