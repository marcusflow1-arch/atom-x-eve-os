import {createContext,useContext,useEffect,useState} from 'react';
export const CompanionIdentityContext=createContext(null);
export const useCompanionIdentity=()=>useContext(CompanionIdentityContext);
export default function CompanionIdentityProvider({avatar,children}){
 const [current,setCurrent]=useState(avatar);useEffect(()=>setCurrent(avatar),[avatar]);
 useEffect(()=>{const saved=e=>{const next=e.detail?.avatar;if(next&&(!avatar?.user_id||next.user_id===avatar.user_id))setCurrent(next);};window.addEventListener('avatarAppearanceSaved',saved);return()=>window.removeEventListener('avatarAppearanceSaved',saved);},[avatar?.user_id]);
 return <CompanionIdentityContext.Provider value={current}>{children}</CompanionIdentityContext.Provider>;
}