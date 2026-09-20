import {useSyncExternalStore} from 'react';
let state={party:null,members:[]};const listeners=new Set();
export const partySession={getSnapshot:()=>state,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},publish(next){state=next;listeners.forEach(fn=>fn());}};
export const usePartySession=()=>useSyncExternalStore(partySession.subscribe,partySession.getSnapshot);
