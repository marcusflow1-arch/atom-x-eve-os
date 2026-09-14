const sequence=[['idle',6000],['afk',8000],['wave',3700],['idle',3000],['walk',4800],['sit',8000],['lean',7000],['stand',5500]];
const reduced=typeof window!=='undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let state={command:'idle',armLift:0,revision:0,paused:false,cycling:!reduced,hidden:false};
let timer=null,index=0;
const listeners=new Set();
const emit=patch=>{state={...state,...patch};listeners.forEach(fn=>fn());};
const schedule=()=>{
 clearTimeout(timer);timer=null;
 if(!listeners.size||!state.cycling||state.paused||state.hidden)return;
 timer=setTimeout(()=>{index=(index+1)%sequence.length;emit({command:sequence[index][0],armLift:0,revision:state.revision+1});schedule();},sequence[index][1]);
};
const visibility=()=>{emit({hidden:document.hidden});schedule();};
export const avatarAnimationStore={
 getSnapshot:()=>state,
 subscribe(fn){listeners.add(fn);if(listeners.size===1){if(typeof document!=='undefined'){state={...state,hidden:document.hidden};document.addEventListener('visibilitychange',visibility);}schedule();}
 return()=>{listeners.delete(fn);if(!listeners.size){clearTimeout(timer);timer=null;if(typeof document!=='undefined')document.removeEventListener('visibilitychange',visibility);}};},
 command(command){if(!['idle','afk','wave','walk','sit','lean','stand'].includes(command))return;emit({command,armLift:0,revision:state.revision+1,paused:false,cycling:false});schedule();},
 setArmLift(value){emit({armLift:Math.max(0,Math.min(1,Number(value)||0)),paused:false,cycling:false});schedule();},
 setPaused(paused){emit({paused:Boolean(paused)});schedule();},
 setCycling(cycling){if(cycling){index=0;emit({cycling:true,paused:false,command:'idle',armLift:0,revision:state.revision+1});}else emit({cycling:false});schedule();},
};
