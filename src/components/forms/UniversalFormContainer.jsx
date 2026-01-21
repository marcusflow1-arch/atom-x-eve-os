import React from 'react';
import { motion } from 'framer-motion';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';
import { cn } from '@/lib/utils';
import { Sparkles, Save, History, Lock, Globe, Users, Shield, Crown, Monitor, Smartphone, Gamepad2 } from 'lucide-react';

/**
 * UniversalFormContainer
 * 
 * A universal structured input system container used across Atom X Eve.
 * 
 * Props:
 * @param {string} pageId - Unique identifier for the page
 * @param {string} pageTitle - Main title of the page
 * @param {string} pageSubtitle - Optional subtitle
 * @param {string} pageType - Type of page (clan, guild, event, ai-training, moderation, marketplace, custom)
 * @param {string} visualTheme - Visual theme (liquid-glass, dark-glass, holo-metal)
 * @param {string} platformMode - Platform mode (desktop, console, hybrid)
 * @param {string} accessLevel - Access level (public, member, admin, owner)
 * @param {boolean} aiAssistanceEnabled - Whether AI assistance is enabled
 * @param {boolean} autosaveEnabled - Whether autosave is enabled
 * @param {boolean} versioningEnabled - Whether versioning is enabled
 */
const UniversalFormContainer = ({
    pageId,
    pageTitle,
    pageSubtitle,
    pageType = 'custom',
    visualTheme = 'liquid-glass',
    platformMode = 'desktop',
    accessLevel = 'public',
    aiAssistanceEnabled = false,
    autosaveEnabled = false,
    versioningEnabled = false,
    className,
    children
}) => {
    // Theme mapping
    const themeStyles = {
        'liquid-glass': 'bg-gradient-to-br from-blue-500/5 to-purple-500/5',
        'dark-glass': 'bg-black/40',
        'holo-metal': 'bg-gradient-to-b from-slate-800/50 to-slate-900/50 border-t border-cyan-400/20'
    };

    // Access Level Icons
    const AccessIcon = {
        'public': Globe,
        'member': Users,
        'admin': Shield,
        'owner': Crown
    }[accessLevel] || Globe;

    // Platform Icons
    const PlatformIcon = {
        'desktop': Monitor,
        'console': Gamepad2,
        'hybrid': Smartphone
    }[platformMode] || Monitor;

    return (
        <div className={cn("w-full h-full min-h-screen flex flex-col", className)} id={pageId}>
            {/* Header Section */}
            <div className="w-full max-w-7xl mx-auto px-6 py-8">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-4 mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-white tracking-wide">{pageTitle}</h1>
                                <div className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                    <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider">{pageType}</span>
                                </div>
                            </div>
                            {pageSubtitle && (
                                <p className="text-white/60 text-lg">{pageSubtitle}</p>
                            )}
                        </div>

                        {/* Status Indicators */}
                        <div className="flex items-center gap-4">
                            {aiAssistanceEnabled && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>AI Active</span>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-2 text-white/40 text-xs">
                                <div className="flex items-center gap-1" title={`Access: ${accessLevel}`}>
                                    <AccessIcon className="w-3.5 h-3.5" />
                                    <span className="capitalize">{accessLevel}</span>
                                </div>
                                <span className="text-white/10">|</span>
                                <div className="flex items-center gap-1" title={`Mode: ${platformMode}`}>
                                    <PlatformIcon className="w-3.5 h-3.5" />
                                    <span className="capitalize">{platformMode}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meta Controls */}
                    {(autosaveEnabled || versioningEnabled) && (
                        <div className="flex items-center justify-end gap-4 text-xs text-white/40">
                            {autosaveEnabled && (
                                <div className="flex items-center gap-1.5">
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Autosave on</span>
                                </div>
                            )}
                            {versioningEnabled && (
                                <div className="flex items-center gap-1.5">
                                    <History className="w-3.5 h-3.5" />
                                    <span>Versioning active</span>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Form Content Container */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                        "rounded-3xl border border-white/10 backdrop-blur-xl overflow-hidden relative min-h-[600px]",
                        themeStyles[visualTheme]
                    )}
                >
                    {/* Background Ambient Effects based on theme */}
                    {visualTheme === 'liquid-glass' && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen" />
                            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] mix-blend-screen" />
                        </div>
                    )}
                    
                    <div className="relative z-10 p-8">
                        {children}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default UniversalFormContainer;