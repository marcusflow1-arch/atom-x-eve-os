import React from 'react';
import { useAuth } from './AuthContext';
import { Lock, User, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProtectedRoute({ children, message = "Please sign in to access this feature" }) {
    const { isAuthenticated, loading, login } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center"
                >
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-blue-400" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
                    <p className="text-slate-400 mb-6">{message}</p>
                    
                    <div className="space-y-3">
                        <button
                            onClick={login}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <User className="w-5 h-5" />
                            Sign In with Google
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        
                        <p className="text-xs text-slate-500 mt-4">
                            Secure authentication powered by Base44
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return children;
}