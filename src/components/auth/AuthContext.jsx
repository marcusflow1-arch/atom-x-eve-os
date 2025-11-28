import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@/entities/User';
import { Avatar } from '@/entities/Avatar';

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

    // Function to refresh user and avatar data
    const refreshUserData = async () => {
        if (!user && !loading) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const updatedUser = await User.me();
            if (updatedUser) {
                setUser(updatedUser);

                if (!updatedUser.username) {
                    setShowSignUp(true);
                    setAvatar(null);
                } else {
                    setShowSignUp(false);
                    const userAvatars = await Avatar.filter({ user_id: updatedUser.id });
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
                const currentUser = await User.me();
                if (currentUser) {
                    setUser(currentUser);

                    if (!currentUser.username) {
                        setShowSignUp(true);
                        setAvatar(null);
                        setIsLoginFlow(true);
                    } else {
                        const userAvatars = await Avatar.filter({ user_id: currentUser.id });
                        if (userAvatars.length > 0) {
                            setAvatar(userAvatars[0]);
                        } else {
                            setAvatar(null);
                        }
                        setIsLoginFlow(false);
                    }

                    await User.updateMyUserData({
                        last_login: new Date().toISOString()
                    });

                    if (!currentUser.unlocked_achievements?.includes('first_login')) {
                        console.log("Granting First Login Achievement");
                        const updatedAchievements = [...(currentUser.unlocked_achievements || []), 'first_login'];
                        await User.updateMyUserData({ unlocked_achievements: updatedAchievements });
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
        setIsLoginFlow(true);
        setLoading(true);
        try {
            const loggedInUser = await User.login();
            if (loggedInUser) {
                setUser(loggedInUser);

                if (!loggedInUser.username) {
                    setShowSignUp(true);
                    setAvatar(null);
                } else {
                    setShowSignUp(false);
                    const userAvatars = await Avatar.filter({ user_id: loggedInUser.id });
                    if (userAvatars.length > 0) {
                        setAvatar(userAvatars[0]);
                    } else {
                        setAvatar(null);
                    }
                }

                await User.updateMyUserData({ last_login: new Date().toISOString() });

                if (!loggedInUser.unlocked_achievements?.includes('first_login')) {
                    console.log("Granting First Login Achievement");
                    const updatedAchievements = [...(loggedInUser.unlocked_achievements || []), 'first_login'];
                    await User.updateMyUserData({ unlocked_achievements: updatedAchievements });
                    const refreshedUser = await User.me();
                    setUser(refreshedUser);
                }
            } else {
                setUser(null);
                setAvatar(null);
                setShowSignUp(false);
            }
        } catch (error) {
            console.error('Login failed:', error);
            setUser(null);
            setAvatar(null);
            setShowSignUp(false);
            setIsLoginFlow(false);
            return { success: false, error: 'Login failed. Please try again.' };
        } finally {
            setLoading(false);
        }
    };

    const loginWithRedirect = async (callbackUrl) => {
        try {
            await User.loginWithRedirect(callbackUrl);
        } catch (error) {
            console.error('Login with redirect failed:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    };

    const logout = async () => {
        try {
            await User.logout();
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
            await User.updateMyUserData(newData);
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
            await User.updateMyUserData({
                username: signUpData.username,
                bio: signUpData.bio,
                avatar_url: signUpData.avatar_url
            });

            if (signUpData.gender) {
                if (!user?.id) {
                    throw new Error("User ID not available to create avatar.");
                }
                await Avatar.create({
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
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};