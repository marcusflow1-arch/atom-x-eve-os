import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Zap, Sword, Search, MessageSquare, UserPlus, Calendar, Clock, MapPin, Send, MoreVertical, Gift, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- Shared Liquid Glass Container ---
const GlassContainer = ({ children, title, onClose, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 100, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 100, scale: 0.95 }}
    className={`fixed inset-x-4 bottom-24 top-24 md:inset-x-auto md:right-8 md:top-24 md:bottom-8 md:w-96 rounded-3xl overflow-hidden flex flex-col z-[1500] ${className}`}
    style={{
      background: 'rgba(30, 41, 59, 0.4)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
    }}
  >
    {/* Header */}
    <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
      <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
      <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
        <X className="w-5 h-5 text-white/70" />
      </button>
    </div>
    
    {/* Content */}
    <div className="flex-1 overflow-hidden relative">
      {children}
    </div>
  </motion.div>
);

// --- Inventory Overlay ---
export const InventoryOverlay = ({ onClose }) => {
  const items = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    name: `Item ${i + 1}`,
    rarity: ['Common', 'Rare', 'Epic', 'Legendary'][Math.floor(Math.random() * 4)],
    icon: i % 2 === 0 ? Package : Gift
  }));

  return (
    <GlassContainer title="Inventory" onClose={onClose}>
      <ScrollArea className="h-full p-4">
        <div className="grid grid-cols-4 gap-3">
          {items.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`aspect-square rounded-xl flex items-center justify-center relative border transition-all ${
                item.rarity === 'Legendary' ? 'bg-yellow-500/10 border-yellow-500/30' :
                item.rarity === 'Epic' ? 'bg-purple-500/10 border-purple-500/30' :
                item.rarity === 'Rare' ? 'bg-blue-500/10 border-blue-500/30' :
                'bg-slate-500/10 border-white/10'
              }`}
            >
              <item.icon className={`w-6 h-6 ${
                item.rarity === 'Legendary' ? 'text-yellow-400' :
                item.rarity === 'Epic' ? 'text-purple-400' :
                item.rarity === 'Rare' ? 'text-blue-400' :
                'text-slate-400'
              }`} />
            </motion.button>
          ))}
        </div>
      </ScrollArea>
    </GlassContainer>
  );
};

// --- Loadout Overlay ---
export const LoadoutOverlay = ({ onClose }) => {
  return (
    <GlassContainer title="Loadout" onClose={onClose}>
      <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="flex justify-center">
           <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
              <span className="text-xs text-white/40">Avatar</span>
           </div>
        </div>

        <div className="space-y-4">
          {['Primary Weapon', 'Secondary Weapon', 'Armor', 'Accessory'].map((slot) => (
            <div key={slot} className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-black/20 flex items-center justify-center">
                <Sword className="w-5 h-5 text-white/30" />
              </div>
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider font-bold">{slot}</div>
                <div className="text-sm text-white font-medium">Empty Slot</div>
              </div>
              <Button size="sm" variant="ghost" className="ml-auto text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10">
                Equip
              </Button>
            </div>
          ))}
        </div>
      </div>
    </GlassContainer>
  );
};

// --- Messages Overlay ---
export const MessagesOverlay = ({ onClose }) => {
  const messages = [
    { id: 1, sender: 'SlayerX', text: 'Raiding the dragon soon?', time: '2m ago', online: true },
    { id: 2, sender: 'LunaFan', text: 'Found a rare chest at the park!', time: '15m ago', online: false },
    { id: 3, sender: 'Guild Leader', text: 'Meeting at 8 PM EST.', time: '1h ago', online: true },
  ];

  return (
    <GlassContainer title="Comms Link" onClose={onClose}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Search comms..." 
              className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {messages.map((msg) => (
              <button key={msg.id} className="w-full p-3 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-3 text-left group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold border border-indigo-500/30">
                    {msg.sender[0]}
                  </div>
                  {msg.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-white font-medium text-sm group-hover:text-cyan-400 transition-colors">{msg.sender}</span>
                    <span className="text-white/30 text-[10px]">{msg.time}</span>
                  </div>
                  <p className="text-white/60 text-xs truncate">{msg.text}</p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/10 bg-white/5">
           <Button className="w-full bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30">
             <MessageSquare className="w-4 h-4 mr-2" /> New Transmission
           </Button>
        </div>
      </div>
    </GlassContainer>
  );
};

// --- Friends Overlay ---
export const FriendsOverlay = ({ onClose }) => {
  return (
    <GlassContainer title="Friends List" onClose={onClose}>
      <div className="p-4 space-y-4">
        <Button className="w-full bg-white/5 hover:bg-white/10 border border-white/10">
          <UserPlus className="w-4 h-4 mr-2" /> Add Friend
        </Button>
        
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
                <div>
                  <div className="text-sm font-medium text-white">Player {i}</div>
                  <div className="text-xs text-green-400 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" /> Online
                  </div>
                </div>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-white/40">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </GlassContainer>
  );
};

// --- Events Overlay ---
export const EventsOverlay = ({ onClose }) => {
  return (
    <GlassContainer title="World Events" onClose={onClose}>
      <ScrollArea className="h-full p-4">
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-red-900/40 to-slate-900/40 rounded-xl p-4 border border-red-500/30">
            <div className="flex justify-between items-start mb-2">
              <Badge className="bg-red-500 text-white border-none">RAID BOSS</Badge>
              <span className="text-red-300 text-xs font-mono flex items-center"><Clock className="w-3 h-3 mr-1" /> 2h 45m</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Inferno Dragon Attack</h3>
            <p className="text-white/60 text-xs mb-3">A massive dragon has been spotted in Central Park. Gather your squad.</p>
            <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
              <MapPin className="w-3 h-3" /> <span>Central Park, NYC</span>
            </div>
            <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-white border-none">Join Raid</Button>
          </div>

          <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/40 rounded-xl p-4 border border-blue-500/30">
            <div className="flex justify-between items-start mb-2">
              <Badge className="bg-blue-500 text-white border-none">EVENT</Badge>
              <span className="text-blue-300 text-xs font-mono flex items-center"><Clock className="w-3 h-3 mr-1" /> 2d remaining</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Double XP Weekend</h3>
            <p className="text-white/60 text-xs mb-3">Earn 2x XP from all monster battles and chest unlocks.</p>
            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none">View Details</Button>
          </div>
        </div>
      </ScrollArea>
    </GlassContainer>
  );
};