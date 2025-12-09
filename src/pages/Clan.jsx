import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import ClanContent from '@/components/dashboard/ClanContent';
import { ALL_NAV_ITEMS } from '@/components/dashboard/NavigationConfig';

export default function ClanPage() {
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <div className="h-screen w-full pt-16 pb-4 px-4 overflow-hidden relative">
             {/* Menu Button */}
             <button
                onClick={() => setDrawerOpen(true)}
                className="absolute top-4 left-4 z-50 w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md hover:bg-white/10 flex items-center justify-center transition-all border border-white/10"
             >
                <div className="flex flex-col gap-[3px]">
                  <span className="w-4 h-[2px] bg-white/90 rounded-full"></span>
                  <span className="w-4 h-[2px] bg-white/90 rounded-full"></span>
                  <span className="w-4 h-[2px] bg-white/90 rounded-full"></span>
                </div>
             </button>

             {/* Navigation Drawer */}
             <AnimatePresence>
                {drawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                            onClick={() => setDrawerOpen(false)}
                        />
                        <motion.div
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-72 bg-slate-900/90 backdrop-blur-3xl border-r border-white/10 z-[101] p-6 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider">Navigation</h2>
                                <button onClick={() => setDrawerOpen(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5"/></button>
                            </div>
                            <div className="space-y-1">
                                {ALL_NAV_ITEMS.map((page) => (
                                    <Link
                                        key={page.name}
                                        to={page.path}
                                        onClick={() => setDrawerOpen(false)}
                                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all text-left"
                                    >
                                        <page.icon className="w-5 h-5" />
                                        <span className="font-medium">{page.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
             </AnimatePresence>

             <ClanContent />
        </div>
    );
}