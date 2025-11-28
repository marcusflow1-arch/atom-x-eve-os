import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Minus, Zap, Shield, Sword, Heart, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { skillData } from './mockData';

const StatsAndSkills = ({ profile, onAttributeChange, onLoadoutChange }) => {
    const [currentAttributes, setCurrentAttributes] = useState(profile?.attributes || { str: 0, dex: 0, int: 0, will: 0 });
    const [availableStatPoints, setAvailableStatPoints] = useState(profile?.availableStatPoints || 15);
    
    // Skill loadout management
    const [activeLoadout, setActiveLoadout] = useState(profile?.activeLoadout || 'default');
    const [equippedSkills, setEquippedSkills] = useState(profile?.skillLoadouts?.[activeLoadout] || new Array(8).fill(null));

    // Update when profile changes
    useEffect(() => {
        if (profile?.attributes) {
            setCurrentAttributes(profile.attributes);
        }
        if (profile?.availableStatPoints !== undefined) {
            setAvailableStatPoints(profile.availableStatPoints);
        }
        if (profile?.activeLoadout) {
            setActiveLoadout(profile.activeLoadout);
        }
        if (profile?.skillLoadouts?.[activeLoadout]) {
            setEquippedSkills(profile.skillLoadouts[activeLoadout]);
        }
    }, [profile, activeLoadout]);

    // Calculate derived stats
    const derivedStats = {
        hp: 100 + (currentAttributes.str * 10) + (currentAttributes.will * 5),
        damage: 10 + (currentAttributes.str * 3) + (currentAttributes.dex * 2),
        defense: 5 + (currentAttributes.str * 2) + (currentAttributes.will * 1),
        critical: Math.min(5 + (currentAttributes.dex * 2), 95) // Cap at 95%
    };

    const handleAttributeChange = (attribute, change) => {
        const newValue = currentAttributes[attribute] + change;
        
        // Prevent negative values and check available points
        if (newValue < 0) return;
        if (change > 0 && availableStatPoints <= 0) return;
        
        const newAttributes = { ...currentAttributes, [attribute]: newValue };
        const newAvailablePoints = availableStatPoints - change;
        
        setCurrentAttributes(newAttributes);
        setAvailableStatPoints(newAvailablePoints);
        
        if (onAttributeChange) {
            onAttributeChange(attribute, newValue);
        }
    };

    const handleLoadoutChange = (newLoadout) => {
        setActiveLoadout(newLoadout);
        setEquippedSkills(profile?.skillLoadouts?.[newLoadout] || new Array(8).fill(null));
        if (onLoadoutChange) {
            onLoadoutChange(newLoadout);
        }
    };

    const AttributeRow = ({ attribute, label, icon: Icon }) => {
        const value = currentAttributes[attribute];
        const canDecrease = value > 0;
        const canIncrease = availableStatPoints > 0;
        
        return (
            <div className="flex items-center justify-between py-2 px-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="text-white font-medium w-20">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-8 h-8 p-0"
                        onClick={() => handleAttributeChange(attribute, -1)}
                        disabled={!canDecrease}
                    >
                        <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-white font-bold">{value}</span>
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-8 h-8 p-0"
                        onClick={() => handleAttributeChange(attribute, 1)}
                        disabled={!canIncrease}
                    >
                        <Plus className="w-3 h-3" />
                    </Button>
                </div>
            </div>
        );
    };

    const SkillSlot = ({ index, skillId }) => {
        const skill = skillId ? skillData[skillId] : null;
        
        return (
            <Droppable droppableId={`skill-${index}`}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`aspect-square rounded-lg border-2 border-dashed border-slate-600 bg-slate-700/30 flex items-center justify-center transition-all ${
                            snapshot.isDraggedOver ? 'border-blue-500 bg-blue-500/20' : ''
                        }`}
                    >
                        {skill ? (
                            <div className="w-full h-full p-1">
                                <img src={skill.icon} alt={skill.name} className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <span className="text-slate-500 text-xs">{index + 1}</span>
                        )}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        );
    };

    return (
        <div className="space-y-4">
            {/* Attributes Section */}
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/30 p-4">
                <h4 className="text-white font-semibold mb-3">Attributes</h4>
                <div className="space-y-2 mb-4">
                    <AttributeRow attribute="str" label="Strength" icon={Sword} />
                    <AttributeRow attribute="dex" label="Dexterity" icon={Target} />
                    <AttributeRow attribute="int" label="Intellect" icon={Zap} />
                    <AttributeRow attribute="will" label="Willpower" icon={Shield} />
                </div>
                
                {/* Available Stat Points */}
                <div className="text-center">
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500">
                        Available Stat Points: {availableStatPoints}
                    </Badge>
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/30 p-4">
                <h4 className="text-white font-semibold mb-3">Stats</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between py-2 px-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-red-400" />
                            <span className="text-slate-300">HP</span>
                        </div>
                        <span className="text-white font-bold">{derivedStats.hp}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Sword className="w-4 h-4 text-red-400" />
                            <span className="text-slate-300">Damage</span>
                        </div>
                        <span className="text-white font-bold">{derivedStats.damage}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <span className="text-slate-300">Defense</span>
                        </div>
                        <span className="text-white font-bold">{derivedStats.defense}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-yellow-400" />
                            <span className="text-slate-300">Critical</span>
                        </div>
                        <span className="text-white font-bold">{derivedStats.critical}%</span>
                    </div>
                </div>
            </div>

            {/* Skills Section */}
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/30 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-semibold">Skills</h4>
                    <select 
                        value={activeLoadout}
                        onChange={(e) => handleLoadoutChange(e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-white text-sm"
                    >
                        <option value="default">Default</option>
                        <option value="pvp">PvP Build</option>
                        <option value="pve">PvE Build</option>
                    </select>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                    {equippedSkills.map((skillId, index) => (
                        <SkillSlot key={index} index={index} skillId={skillId} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StatsAndSkills;