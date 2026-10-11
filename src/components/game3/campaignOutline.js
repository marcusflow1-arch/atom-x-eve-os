// Original Game 3 story blueprint. Planning data only: finale gameplay/cinematics are NOT implemented.
export const GAME3_CAMPAIGN = Object.freeze({
  id:'night-run',
  genre:'open-city-story-arcade-racing',
  targetBrawlShare:0.20,
  characters:{driver:'DRIVER',bestFriend:'BEST FRIEND',antagonist:'RACE ORGANIZER'},
  acts:[
    {id:'act-1',label:'Before the Line',play:['city-exploration','npc-dialogue','garage','racing'],purpose:'Establish friendship, childhood ambitions, the familiar lightweight car and antagonist'},
    {id:'act-2',label:'The City Runs',play:['race-meets','rivalries','optional-squabbles','story-interactions'],purpose:'Build skills and consequences; set up the dangerous invitational'},
    {id:'act-3',label:'The Last Night',play:['hospital-run','e-bike-escape','underpowered-final-race','cinematic-fight'],purpose:'The rescue, narrow victory, sacrifice and memorial'}
  ],
  finale:[
    {id:'F01',name:'The Injury',type:'hybrid',story:'Wounded best friend, car impact, small ramp and one-handed grab',playerActions:['drive','restricted-steer']},
    {id:'F02',name:'Over The Freeway',type:'hybrid',story:'Rear-door rescue while airborne; friend belts in; emergency recovery landing',playerActions:['timed-rescue-assist','landing-correction']},
    {id:'F03',name:'Back Entrance',type:'hybrid',story:'Two-person e-bike to hospital service entrance, medics and surgery warning',playerActions:['e-bike-ride']},
    {id:'F04',name:'One Last Race',type:'race',story:'Old lightweight car; no nitrous; shortcut and photo finish win',carRules:{nitrous:false,perfectShift:true,slipstream:true,shortcuts:true,dust:'TBD'},playerActions:['shift','draft','steer','drift','shortcuts']},
    {id:'F05',name:'Waterfront',type:'cinematic',story:'Antagonist ambush; apparent graveside flash-forward',playerActions:[]},
    {id:'F06',name:'The Sacrifice',type:'cinematic',story:'Friend survives surgery long enough to intervene and takes the fatal bullet',playerActions:[]},
    {id:'F07',name:'What We Imagined',type:'hybrid',story:'Emotional fight with punch-linked childhood anime memory flipbook and signature kick combo',playerActions:['punch','dodge','finisher']},
    {id:'F08',name:'Until We Meet',type:'cinematic',story:'Graveside friend-spirit reveal and credits',playerActions:[]}
  ],
  musicMix:{cinematic:0.88,dialogue:0.15,hospital:0.12,grave:0.08},
  implementationStatus:'design_only'
});
export function getFinaleBeat(id){return GAME3_CAMPAIGN.finale.find(beat=>beat.id===id)||null;}
