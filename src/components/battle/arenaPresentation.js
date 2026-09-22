import { useSyncExternalStore } from 'react';
let visible=false;const listeners=new Set();
export const arenaPresentation={
  getSnapshot:()=>visible,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
  setVisible(next){visible=Boolean(next);listeners.forEach(fn=>fn());},
};
export const useArenaPresentation=()=>useSyncExternalStore(arenaPresentation.subscribe,arenaPresentation.getSnapshot);
export const openAIBattle=(encounterId)=>window.dispatchEvent(new CustomEvent('openAIBattle',{detail:{encounterId}}));
