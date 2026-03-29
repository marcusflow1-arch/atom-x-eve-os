import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, BookOpen } from 'lucide-react';
import FriendsNetworkWidget from './FriendsNetworkWidget';
import CardCollectionBrowser from './CardCollectionBrowser';

export default function SidebarOverlays({ className = "" }) {
  const [showFriends, setShowFriends] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    const tf = () => { setShowFriends(v => !v); setShowLibrary(false); };
    const tl = () => { setShowLibrary(v => !v); setShowFriends(false); };
    window.addEventListener('toggleFriendsFullOverlay', tf);
    window.addEventListener('toggleLibraryFullOverlay', tl);
    return () => {
      window.removeEventListener('toggleFriendsFullOverlay', tf);
      window.removeEventListener('toggleLibraryFullOverlay', tl);
    };
  }, []);

  return (
    <AnimatePresence>
      {showFriends && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`bg-slate-900/95 backdrop-blur-xl p-8 overflow-y-auto border border-white/10 shadow-2xl rounded-2xl ${className}`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white tracking-wider uppercase flex items-center gap-3">
              <Users className="w-6 h-6 text-green-400" />
              Friends Network
            </h2>
            <button onClick={() => setShowFriends(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"><X className="w-5 h-5"/></button>
          </div>
          <FriendsNetworkWidget isFullPage={true} />
        </motion.div>
      )}
      {showLibrary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`bg-slate-900/95 backdrop-blur-xl p-8 overflow-y-auto border border-white/10 shadow-2xl rounded-2xl ${className}`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white tracking-wider uppercase flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-cyan-400" />
              My Library
            </h2>
            <button onClick={() => setShowLibrary(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"><X className="w-5 h-5"/></button>
          </div>
          <CardCollectionBrowser />
        </motion.div>
      )}
    </AnimatePresence>
  );
}