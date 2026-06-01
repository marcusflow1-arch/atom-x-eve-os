import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        // Return safe defaults if context is not available
        return {
            user: null,
            avatar: null,
            isAuthenticated: false,
            loading: true,
            showSignUp: false,
            login: () => Promise.resolve(),
            loginWithRedirect: () => Promise.resolve(),
            logout: () => Promise.resolve(),
            updateUserData: () => Promise.resolve({ success: false }),
            completeSignUp: () => Promise.resolve(),
            setShowSignUp: () => {},
            refreshUserData: () => Promise.resolve(),
            isLoginFlow: false
        };
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [avatar, setAvatar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSignUp, setShowSignUp] = useState(false);
    const [isLoginFlow, setIsLoginFlow] = useState(false);
    const sessionId = React.useRef(Math.random().toString(36).substring(7));
    const [sessionConflict, setSessionConflict] = useState(false);

    // Presence Heartbeat & Conflict Resolution
    useEffect(() => {
        if (!user) return;

        const updateHeartbeat = async () => {
            if (sessionConflict) return; // Stop if another tab took over

            try {
                // Check if we've been overridden by another session recently
                const freshUser = await base44.auth.me();
                const remoteSessionId = freshUser?.current_activity?.sessionId;
                
                // If there's a remote session ID, it's different from ours, and it was updated recently (< 2 mins), we have a conflict
                const lastSeen = new Date(freshUser?.last_seen || 0);
                const now = new Date();
                const isRecent = (now - lastSeen) < 120000; // 2 mins

                if (remoteSessionId && remoteSessionId !== sessionId.current && isRecent) {
                    console.log("Session conflict detected. Pausing heartbeat.");
                    setSessionConflict(true);
                    return;
                }

                // If no conflict, proceed
                await base44.auth.updateMe({
                    last_seen: new Date().toISOString(),
                    presence_status: 'online',
                    // Merge existing activity with our session ID to claim it
                    current_activity: { 
                        ...(freshUser?.current_activity || {}), 
                        sessionId: sessionId.current 
                    }
                });
            } catch (e) {
                console.error("Heartbeat failed", e);
            }
        };

        // Initial update
        updateHeartbeat();

        // Update every minute
        const interval = setInterval(updateHeartbeat, 60000);
        return () => clearInterval(interval);
    }, [user?.id, sessionConflict]);

    const updatePresenceContext = async (activity) => {
        if (!user) return;
        
        // When explicitly updating context, we force claim the session
        setSessionConflict(false); 
        
        const activityWithSession = { ...activity, sessionId: sessionId.current };
        
        try {
            await base44.auth.updateMe({
                current_activity: activityWithSession,
                last_seen: new Date().toISOString()
            });
            // Optimistic update
            setUser(prev => ({ ...prev, current_activity: activityWithSession }));
        } catch (e) {
            console.error("Failed to update presence context", e);
        }
    };

    // Function to refresh user and avatar data
    const refreshUserData = async () => {
        if (!user && !loading) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const updatedUser = await base44.auth.me();
            if (updatedUser) {
                setUser(updatedUser);

                if (!updatedUser.username) {
                    setShowSignUp(true);
                    setAvatar(null);
                } else {
                    setShowSignUp(false);
                    const userAvatars = await base44.entities.Avatar.filter({ user_id: updatedUser.id });
                    if (userAvatars.length > 0) {
                        setAvatar(userAvatars[0]);
                    } else {
                        setAvatar(null);
                    }
                }
            } else {
                setUser(null);
                setAvatar(null);
                setShowSignUp(false);
                setIsLoginFlow(false);
            }
        } catch(e) {
            console.error("Failed to refresh user data:", e);
            setUser(null);
            setAvatar(null);
            setShowSignUp(false);
            setIsLoginFlow(false);
        } finally {
            setLoading(false);
        }
    };

    // Check for existing session on app load
    useEffect(() => {
        const checkSession = async () => {
            setLoading(true);
            try {
                const currentUser = await base44.auth.me();
                if (currentUser) {
                    setUser(currentUser);

                    if (!currentUser.username) {
                        setShowSignUp(true);
                        setAvatar(null);
                        setIsLoginFlow(true);
                    } else {
                        const userAvatars = await base44.entities.Avatar.filter({ user_id: currentUser.id });
                        if (userAvatars.length > 0) {
                            setAvatar(userAvatars[0]);
                        } else {
                            setAvatar(null);
                        }
                        setIsLoginFlow(false);
                    }

                    await base44.auth.updateMe({
                        last_login: new Date().toISOString()
                    });

                    // Attempt state recovery once per session (guarded to prevent rate-limit on re-renders)
                    const recoveryKey = `state_recovered_${currentUser.id}`;
                    if (!sessionStorage.getItem(recoveryKey)) {
                        sessionStorage.setItem(recoveryKey, '1');
                        try {
                            const recovery = await base44.functions.invoke('recoverState');
                            if (recovery.data?.restored && recovery.data?.activity) {
                                console.log('State recovered:', recovery.data.changes);
                                setUser(prev => ({ ...prev, current_activity: recovery.data.activity }));
                            }
                        } catch (err) {
                            console.warn('State recovery failed (non-critical):', err);
                        }
                    }

                    if (!currentUser.unlocked_achievements?.includes('first_login')) {
                        console.log("Granting First Login Achievement");
                        const updatedAchievements = [...(currentUser.unlocked_achievements || []), 'first_login'];
                        await base44.auth.updateMe({ unlocked_achievements: updatedAchievements });
                    }
                } else {
                    setUser(null);
                    setAvatar(null);
                    setShowSignUp(false);
                    setIsLoginFlow(false);
                }
            } catch (error) {
                console.log('No authenticated user found or session check failed:', error);
                setUser(null);
                setAvatar(null);
                setShowSignUp(false);
                setIsLoginFlow(false);
            }
            setLoading(false);
        };

        checkSession();
    }, []);

    const login = async () => {
        try {
            setIsLoginFlow(true);
            await base44.auth.redirectToLogin();
        } catch (error) {
            console.error('Login failed:', error);
            setIsLoginFlow(false);
        }
    };

    const loginWithRedirect = async (callbackUrl) => {
        try {
            await base44.auth.redirectToLogin(callbackUrl);
        } catch (error) {
            console.error('Login with redirect failed:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    };

    const logout = async () => {
        try {
            await base44.auth.logout();
            setUser(null);
            setAvatar(null);
            setShowSignUp(false);
            setIsLoginFlow(false);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const updateUserData = async (newData) => {
        setLoading(true);
        try {
            await base44.auth.updateMe(newData);
            await refreshUserData();
            return { success: true };
        } catch (error) {
            console.error('Failed to update user data:', error);
            return { success: false, error: 'Failed to update profile' };
        } finally {
            setLoading(false);
        }
    };

    const completeSignUp = async (signUpData) => {
        setLoading(true);
        try {
            await base44.auth.updateMe({
                username: signUpData.username,
                bio: signUpData.bio,
                avatar_url: signUpData.avatar_url
            });

            if (signUpData.gender) {
                if (!user?.id) {
                    throw new Error("User ID not available to create avatar.");
                }
                await base44.entities.Avatar.create({
                    user_id: user.id,
                    name: signUpData.username,
                    gender: signUpData.gender,
                });
            }

            await refreshUserData();
            setShowSignUp(false);
            setIsLoginFlow(false);
        } catch (error) {
            console.error('Failed to complete sign up:', error);
            setIsLoginFlow(false);
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        avatar,
        isAuthenticated: !!user,
        loading,
        showSignUp: showSignUp && isLoginFlow,
        login,
        loginWithRedirect,
        logout,
        updateUserData,
        completeSignUp,
        setShowSignUp,
        refreshUserData,
        isLoginFlow,
        updatePresenceContext,
        sessionConflict,
        claimSession: () => setSessionConflict(false)
        };

        return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};