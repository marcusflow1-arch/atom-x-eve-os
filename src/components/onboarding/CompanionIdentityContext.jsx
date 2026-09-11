import React, { createContext, useContext } from 'react';
export const CompanionIdentityContext = createContext(null);
export const useCompanionIdentity = () => useContext(CompanionIdentityContext);
export default function CompanionIdentityProvider({ avatar, children }) { return <CompanionIdentityContext.Provider value={avatar}>{children}</CompanionIdentityContext.Provider>; }