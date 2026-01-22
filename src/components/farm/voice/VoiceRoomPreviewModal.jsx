import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mic, X, Shield, Signal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';

export default function VoiceRoomPreviewModal({ room, isOpen, onClose, onConfirm }) {
    if (!isOpen || !room) return null;

    const isFull = room.users >= room.max;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-[#0f1419] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10"
                >
                    {/* Header */}
                    <div className="p-6 pb-4 border-b border-white/5 flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-white">{room.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${isFull ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                    <Users className="w-3 h-3" />
                                    {room.users} / {room.max}
                                </span>
                                {room.tags.map(tag => (
                                    <span key={tag} className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded uppercase">{tag}</span>
                                ))}
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Participants Mock */}
                    <div className="p-6 space-y-4">
                        <h4 className="text-sm font-medium text-white/60 uppercase tracking-wider">Current Speakers</h4>
                        <div className="space-y-2">
                            {Array.from({ length: room.users }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <span className="text-white/80 font-medium">Player {String.fromCharCode(65 + i)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {i === 0 && <Shield className="w-3 h-3 text-yellow-500" />}
                                        <div className={`w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
                                    </div>
                                </div>
                            ))}
                            {/* Empty Slots */}
                            {Array.from({ length: Math.max(0, room.max - room.users) }).map((_, i) => (
                                <div key={`empty-${i}`} className="flex items-center justify-between p-3 rounded-xl border border-white/5 border-dashed opacity-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                            <Users className="w-4 h-4 text-white/20" />
                                        </div>
                                        <span className="text-white/20 font-medium italic">Empty Slot</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 pt-0 flex gap-3">
                        <Button variant="ghost" className="flex-1 text-white/60 hover:text-white" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button 
                            className={`flex-1 ${isFull ? 'bg-white/10 text-white/40' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                            onClick={() => !isFull && onConfirm(room)}
                            disabled={isFull}
                        >
                            {isFull ? 'Room Full' : 'Join Room'}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}