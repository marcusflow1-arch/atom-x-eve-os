
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { 
  ClipboardCheck, Globe, Trophy, Star, Gift, CheckCircle, ChevronRight, X, User, Shield, Zap, Swords
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// Helper for 3D model on cards
const Achievement3DPreview = ({ rarity }) => {
    const mountRef = useRef(null);

    const rarityConfig = {
        Common: { color: 0x94a3b8, size: 0.6 },
        Uncommon: { color: 0x4ade80, size: 0.7 },
        Rare: { color: 0x60a5fa, size: 0.8 },
        Unique: { color: 0x22d3ee, size: 0.9 },
        Epic: { color: 0xa78bfa, size: 1.0 },
        Legendary: { color: 0xfb923c, size: 1.1 },
        Mythical: { color: 0xf87171, size: 1.2 },
        Godlike: { color: 0xf472b6, size: 1.3 },
    };
    const config = rarityConfig[rarity] || rarityConfig.Common;

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
        camera.position.z = 2.5;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(64, 64);
        currentMount.appendChild(renderer.domElement);

        const geometry = new THREE.IcosahedronGeometry(config.size, 0);
        const material = new THREE.MeshStandardMaterial({
            color: config.color,
            metalness: 0.7,
            roughness: 0.3,
            wireframe: true,
            emissive: config.color,
            emissiveIntensity: 0.4
        });
        const model = new THREE.Mesh(geometry, material);
        scene.add(model);
        
        const light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.set(2, 2, 2);
        scene.add(light);

        let animationId;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            model.rotation.y += 0.01;
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            if (currentMount && renderer.domElement) {
                currentMount.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [rarity, config]);

    return <div ref={mountRef} className="absolute -right-2 -top-2 w-16 h-16 opacity-50" />;
};

const QuestBoard = () => {
    const [trackedAchievements, setTrackedAchievements] = useState([]);
    const [isTrackerVisible, setIsTrackerVisible] = useState(true);

    // Static mock data to avoid API calls during development
    const quests = {
        daily: [
            { id: 1, title: 'Win 3 Matches', description: 'Test your skills in the arena and emerge victorious.', reward: '150 AGP', progress: 66 },
            { id: 2, title: 'Craft a Legendary Item', description: 'Gather rare materials and forge an item of immense power.', reward: 'Legendary Component', progress: 0 },
            { id: 5, title: 'Explore the Lost Ruins', description: 'Discover the secrets of an ancient civilization.', reward: '200 AGP', progress: 25 },
        ],
        weekly: [
            { id: 3, title: 'Complete 10 Bounties', description: 'Hunt down the most wanted targets across the system.', reward: '500 AGP', progress: 40 },
            { id: 4, title: 'Defeat a World Boss', description: 'Join forces with other players to take down a colossal threat.', reward: 'Mythic Shard', progress: 0 },
            { id: 6, title: 'Master a New Weapon', description: 'Achieve 100 kills with a weapon you haven\'t mastered yet.', reward: 'Weapon XP Boost', progress: 10 },
        ]
    };

    const worldEvents = [
        { id: 1, name: 'Abyssal Leviathan', difficulty: 'Hard', hp: 42, players: 1532, time: '3d 14h', loot: ['Mythic Trident', 'Leviathan Scale'] },
        { id: 2, name: 'Cybernetic Uprising', difficulty: 'Medium', hp: 78, players: 890, time: '1d 5h', loot: ['Cyber Core', 'Plasma Rifle'] },
    ];

    const achievements = [
        { id: 1, name: 'Force Lightning', rarity: 'Godlike', description: 'Unlock the power of pure energy.', icon: Zap, progress: 25 },
        { id: 2, name: 'Dragonscale Armor', rarity: 'Legendary', description: 'Forge armor from the scales of an ancient dragon.', icon: Shield, progress: 75 },
        { id: 3, name: 'First Kill', rarity: 'Common', description: 'Complete your first bounty.', icon: Trophy, progress: 100 },
    ];

    const toggleAchievementTrack = (ach) => {
        setTrackedAchievements(prev =>
            prev.find(a => a.id === ach.id)
                ? prev.filter(a => a.id !== ach.id)
                : [...prev, ach]
        );
    };

    const allQuests = [...quests.daily, ...quests.weekly];

    return (
        <div className="flex flex-col relative">
            <style>{`
                .quest-card-3d {
                    transform-style: preserve-3d;
                    transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                .quest-card-3d:hover {
                    transform: perspective(1000px) rotateY(5deg) rotateX(10deg) scale3d(1.05, 1.05, 1.05);
                }
                .daily-chest-3d {
                    animation: float 4s ease-in-out infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>

            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <ClipboardCheck className="text-cyan-400" />
                Quest Board
            </h3>
            
            {/* Quest Tracker Sidebar */}
            <AnimatePresence>
                {isTrackerVisible && trackedAchievements.length > 0 && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                        className="absolute top-0 right-0 h-full w-64 bg-slate-900/80 backdrop-blur-lg p-4 border-l border-slate-700 z-20 rounded-r-xl"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-white">Tracked</h4>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsTrackerVisible(false)}><X className="w-4 h-4" /></Button>
                        </div>
                        <div className="space-y-3">
                            {trackedAchievements.map(ach => (
                                <div key={ach.id} className="bg-slate-800 p-2 rounded-lg text-sm">
                                    <p className="font-medium text-slate-200">{ach.name}</p>
                                    <p className="text-xs text-slate-400">{ach.rarity}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {!isTrackerVisible && trackedAchievements.length > 0 && (
                 <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-8 w-8 z-30" onClick={() => setIsTrackerVisible(true)}><ChevronRight className="w-5 h-5" /></Button>
            )}

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto pr-2 space-y-12">
                
                {/* Daily Quests Section (Marketplace Style) */}
                <section>
                    <h4 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
                        <Swords className="text-blue-400" />
                        Daily Quests
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allQuests.map(q => (
                            <div key={q.id} className="bg-slate-900/50 p-4 rounded-lg quest-card-3d flex flex-col justify-between border border-slate-800 hover:border-blue-500/50">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-semibold text-white text-lg">{q.title}</p>
                                        <p className="text-sm text-yellow-300 font-bold">{q.reward}</p>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-4">{q.description}</p>
                                </div>
                                <div className="mt-auto">
                                    <Progress value={q.progress} className="h-2 bg-slate-700 mb-3" indicatorClassName="bg-blue-500" />
                                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">Accept Quest</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* World Events Section */}
                <section>
                    <h4 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
                        <Globe className="text-purple-400" />
                        World Events
                    </h4>
                    <div className="space-y-4">
                       {worldEvents.map(event => (
                           <div key={event.id} className="bg-gradient-to-br from-purple-600/30 to-blue-600/30 p-4 rounded-xl border border-purple-500/50 quest-card-3d">
                               <h4 className="text-xl font-bold text-white">{event.name}</h4>
                               <div className="flex justify-between text-sm my-2">
                                   <span className="font-semibold text-red-400">Difficulty: {event.difficulty}</span>
                                   <span className="text-cyan-300 flex items-center gap-1"><User className="w-4 h-4"/> {event.players} Players</span>
                               </div>
                               <p className="text-md text-slate-300 mb-2">HP: {event.hp}%</p>
                               <Progress value={event.hp} className="h-3 bg-red-900/50" indicatorClassName="bg-gradient-to-r from-red-500 to-yellow-500"/>
                               <div className="text-right text-sm mt-1 text-slate-400">{event.time} remaining</div>
                               <div className="flex gap-2 mt-3">
                                    <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">Join Fight</Button>
                                    <Button size="sm" variant="outline" className="flex-1">Spectate</Button>
                               </div>
                           </div>
                       ))}
                    </div>
                </section>

                {/* Achievement Hunting Section */}
                <section>
                    <h4 className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
                        <Trophy className="text-yellow-400" />
                        Achievement Hunting
                    </h4>
                    <div className="space-y-3">
                        {achievements.map(ach => (
                            <div key={ach.id} className="relative bg-slate-900/50 p-4 rounded-xl overflow-hidden quest-card-3d border-l-4 border-yellow-500/50">
                                <Achievement3DPreview rarity={ach.rarity} />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3">
                                        <ach.icon className="w-8 h-8 text-slate-300" />
                                        <div>
                                            <p className="font-bold text-lg text-white">{ach.name}</p>
                                            <p className="text-sm font-semibold text-yellow-400">{ach.rarity}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-2">{ach.description}</p>
                                    <Progress value={ach.progress} className="h-1 mt-3 bg-slate-700" indicatorClassName="bg-yellow-500" />
                                    <Button 
                                        size="sm" 
                                        className="mt-3" 
                                        variant={trackedAchievements.find(t => t.id === ach.id) ? 'secondary' : 'default'}
                                        onClick={() => toggleAchievementTrack(ach)}
                                    >
                                        {trackedAchievements.find(t => t.id === ach.id) ? 'Untrack' : 'Track'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default QuestBoard;
