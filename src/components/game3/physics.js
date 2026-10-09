// Original Game 3 arcade vehicle dynamics. No third-party game code.
export const MAX_SPEED = 84;
export const GEAR_LIMITS = [0, 24, 37, 50, 63, 75, 84];
export const CARS = [
  { id: 'sls', name: '2010 Mercedes SLS AMG', file: '2010_mercedes_sls_amg.glb', color: '#b9c7d5', accel: 1.04, handling: 1.03, locked: false },
  { id: 'scifi', name: 'Sci-Fi Sport Car', file: 'sci_fi_sport_car.glb', color: '#1bd2ee', accel: 1.11, handling: 1.14, locked: false }
];
export const STORY_SCENES = [
  { kind:'cinematic', title:'PROLOGUE · THE CITY NEVER STOPS', speaker:'NARRATOR', text:'At night, the city belongs to whoever can find an open road. Every street has a history. Every driver has a reason to run.' },
  { kind:'dialogue', title:'THE INVITATION', speaker:'MARA · CREW LEADER', text:'That car has a story. But a name on the hood does not make you a racer. Meet me at the underpass. Show me how you drive.' },
  { kind:'dialogue', title:'YOUR ANSWER', speaker:'DRIVER', text:'Give me a starting line. I will handle the rest.' },
  { kind:'cinematic', title:'CHAPTER 1 · FIRST LIGHT', speaker:'NARRATOR', text:'Engines turn over. Flags rise. Beyond the first finish line, a secret about the city’s ghost racers waits to be uncovered.' }
];
export function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }
export function makeRaceState(){
 return {phase:'idle',speed:0,gear:1,rpm:0,distance:0,lane:0,lateral:0,yaw:0,drift:false,nitrous:100,boost:0,slipSeconds:0,slipLevel:0,ghost:0,perfectShift:0,shiftStatus:'',shiftFlash:0,launchStatus:'',jump:0,air:0,shake:0,raceTime:0,opponentDistance:33,opponentLane:0,damageFlash:0,finish:false};
}
export function shiftGear(s){
 if(s.phase!=='race'||s.gear>=6) return false;
 const perfect=s.rpm>=0.77 && s.rpm<=0.97;
 s.gear++; s.shiftStatus=perfect?'PERFECT SHIFT':'SHIFT';
 s.shiftFlash=1.5;
 if(perfect){s.perfectShift=1.7;s.speed=Math.min(MAX_SPEED,s.speed+3.4);s.nitrous=clamp(s.nitrous+6,0,100);}
 return perfect;
}
export function activateGhost(s){
 if(s.phase!=='race'||s.slipLevel<2||s.ghost>0) return false;
 s.ghost=1.65; s.boost=2.2; s.speed=clamp(s.speed+12,0,MAX_SPEED);
 s.slipSeconds=0;s.slipLevel=0; return true;
}
export function applyPerfectLaunch(s,rpm){
 s.phase='race'; s.launchStatus=(rpm>=0.55&&rpm<=0.85)?'PERFECT START':rpm>0.85?'WHEELSPIN':'NORMAL START';
 s.speed=s.launchStatus==='PERFECT START'?15: s.launchStatus==='WHEELSPIN'?2:7;
 s.boost=s.launchStatus==='PERFECT START'?2.2:0.5;
 s.shiftFlash=1.8; return s.launchStatus;
}
export function stepRace(s,input,dt,car=CARS[0]){
 dt=clamp(dt,0,0.04);
 if(s.phase!=='race'||s.finish) return s;
 s.raceTime+=dt;
 s.ghost=Math.max(0,s.ghost-dt);s.boost=Math.max(0,s.boost-dt);
 s.perfectShift=Math.max(0,s.perfectShift-dt);
 s.shiftFlash=Math.max(0,s.shiftFlash-dt);
 s.damageFlash=Math.max(0,s.damageFlash-dt);
 const steering=(input.right?1:0)-(input.left?1:0);
 const limit=GEAR_LIMITS[s.gear];
 const power=s.speed<limit ? 15.5*car.accel*(1-0.3*s.speed/MAX_SPEED):1.6;
 const accelerate=input.forward?power:0;
 const airDrag=(0.012*s.speed+0.0012*s.speed*s.speed);
 const brake=input.back?28:0;
 s.speed=clamp(s.speed+(accelerate-airDrag-brake)*dt,0,Math.min(MAX_SPEED,limit+8));
 if(s.boost>0)s.speed=clamp(s.speed+7*dt,0,Math.min(MAX_SPEED,limit+10));
 if(input.nitro && s.nitrous>0){
  s.speed=clamp(s.speed+38*dt,0,Math.min(MAX_SPEED,limit+13));
  s.nitrous=Math.max(0,s.nitrous-25*dt);
 }
 if(input.dodge && s.nitrous>=17 && steering!==0){
  s.lateral+=steering*9;s.lane=clamp(s.lane+steering*0.7,-4.5,4.5);
  s.nitrous-=17;
 }
 const drift=input.drift && s.speed>10 && steering!==0;
 s.drift=drift;
 const grip=drift?1.3:4.8;
 const idealLateral=steering*(drift?5:3.7)*car.handling*Math.min(1,s.speed/20);
 s.lateral+=(idealLateral-s.lateral)*Math.min(1,dt*grip);
 s.lane=clamp(s.lane+s.lateral*dt,-4.5,4.5);
 s.yaw+=(steering*(drift?0.31:0.09)-s.yaw)*(Math.min(1,dt*(drift?1.8:6)));
 s.distance+=s.speed*dt;
 s.rpm=clamp(s.speed/limit,0,1.3);
 const drafting=s.opponentDistance>5&&s.opponentDistance<36&&Math.abs(s.lane-s.opponentLane)<1.55;
 s.slipSeconds=drafting?clamp(s.slipSeconds+dt,0,8):Math.max(0,s.slipSeconds-dt*3);
 s.slipLevel=s.slipSeconds>=8?2:s.slipSeconds>=4?1:0;
 if(s.slipLevel>=1&&drafting)s.speed=clamp(s.speed+4.2*dt,0,Math.min(MAX_SPEED,limit+8));
 s.opponentDistance+=(31.0-s.speed)*dt;
 if(s.opponentDistance<-30){s.opponentDistance=70;s.opponentLane=[-2.7,0,2.7][Math.floor(s.raceTime/8)%3];}
 if(s.opponentDistance<3&&s.opponentDistance>-3&&Math.abs(s.lane-s.opponentLane)<1.3&&s.ghost<=0){
  s.speed*=0.45; s.opponentDistance=6;s.damageFlash=0.7; s.slipSeconds=0;s.slipLevel=0;
 }
 const before=Math.floor((s.distance-s.speed*dt)/420),after=Math.floor(s.distance/420);
 if(after>before&&s.speed>17){s.jump=0.01;}
 if(s.jump>0){s.jump+=dt;s.air=Math.sin(Math.PI*Math.min(1,s.jump/2.2))*3.4;if(s.jump>=2.2){s.jump=0;s.air=0;s.nitrous=clamp(s.nitrous+10,0,100);}}
 s.shake=(s.speed>58&&s.perfectShift<=0)?clamp((s.speed-58)/26,0,1):0;
 if(s.distance>=1500){s.finish=true;s.phase='finish';}
 return s;
}
