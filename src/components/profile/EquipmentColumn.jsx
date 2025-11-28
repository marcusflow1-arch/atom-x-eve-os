import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { itemData } from './mockData';

const rarityColors = {
    'Common': 'border-gray-500',
    'Uncommon': 'border-green-500',
    'Rare': 'border-blue-500',
    'Epic': 'border-purple-500',
    'Legendary': 'border-orange-500',
    'Mythic': 'border-pink-500'
};

const EquipmentColumn = ({ profile, onUnequip }) => {
    const EquipmentSlot = ({ type, slotId, itemId, label, className = "" }) => {
        const item = itemId ? itemData[itemId] : null;
        
        return (
            <Droppable droppableId={`${type}-${slotId}`}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`relative w-12 h-12 rounded-md border-2 border-dashed border-slate-600 bg-slate-700/30 flex flex-col items-center justify-center transition-all ${
                            snapshot.isDraggedOver ? 'border-blue-500 bg-blue-500/20' : ''
                        } ${className}`}
                    >
                        {item ? (
                            <div className="w-full h-full p-1 relative">
                                <img src={item.icon_url} alt={item.name} className="w-full h-full object-contain" />
                                <div className={`absolute inset-0 rounded-md ${rarityColors[item.rarity] || 'border-gray-500'}`} />
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 w-4 h-4 p-0 text-xs"
                                    onClick={() => onUnequip(type, slotId)}
                                >
                                    ×
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="text-slate-500 text-xs mb-1">{label}</div>
                                <div className="w-6 h-6 border border-slate-600 rounded bg-slate-800/50" />
                            </div>
                        )}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        );
    };

    const AspectSlot = ({ index, aspectId }) => {
        const aspect = aspectId ? itemData[aspectId] : null;
        
        return (
            <Droppable droppableId={`aspect-${index}`}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`w-10 h-10 rounded-md border-2 border-dashed border-slate-600 bg-slate-700/30 flex items-center justify-center transition-all ${
                            snapshot.isDraggedOver ? 'border-purple-500 bg-purple-500/20' : ''
                        }`}
                    >
                        {aspect ? (
                            <div className="w-full h-full p-1 relative">
                                <img src={aspect.icon_url} alt={aspect.name} className="w-full h-full object-contain" />
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 w-3 h-3 p-0 text-xs"
                                    onClick={() => onUnequip('aspect', index)}
                                >
                                    ×
                                </Button>
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

    const ArtifactSlot = ({ index, artifactId }) => {
        const artifact = artifactId ? itemData[artifactId] : null;
        
        return (
            <Droppable droppableId={`artifact-${index}`}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`w-10 h-10 rounded-md border-2 border-dashed border-slate-600 bg-slate-700/30 flex items-center justify-center transition-all ${
                            snapshot.isDraggedOver ? 'border-yellow-500 bg-yellow-500/20' : ''
                        }`}
                    >
                        {artifact ? (
                            <div className="w-full h-full p-1 relative">
                                <img src={artifact.icon_url} alt={artifact.name} className="w-full h-full object-contain" />
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="absolute -top-1 -right-1 w-3 h-3 p-0 text-xs"
                                    onClick={() => onUnequip('artifact', index)}
                                >
                                    ×
                                </Button>
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
            {/* Character Stats */}
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/30 p-3 text-center">
                <h3 className="text-white font-semibold text-base">{profile?.name}</h3>
                <Badge className="bg-blue-600/20 text-blue-400 border-blue-500 text-sm">
                    Level {profile?.level}
                </Badge>
                <div className="mt-2">
                    <div className="bg-slate-700 rounded-full h-2 w-full">
                        <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${((profile?.xp || 0) / (profile?.xpRequired || 1)) * 100}%` }}
                        />
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        {profile?.xp || 0} / {profile?.xpRequired || 0} XP
                    </div>
                </div>
            </div>

            {/* Weapons - Organized Grid */}
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/30 p-3">
                <h4 className="text-white font-semibold mb-2 text-center text-sm">Weapons</h4>
                <div className="grid grid-cols-3 gap-2">
                    <EquipmentSlot 
                        type="weapon" 
                        slotId={0} 
                        itemId={profile?.equipped?.weapons?.[0]} 
                        label="Primary"
                    />
                    <EquipmentSlot 
                        type="weapon" 
                        slotId={1} 
                        itemId={profile?.equipped?.weapons?.[1]} 
                        label="Secondary"
                    />
                    <EquipmentSlot 
                        type="weapon" 
                        slotId={2} 
                        itemId={profile?.equipped?.weapons?.[2]} 
                        label="Tertiary"
                    />
                </div>
            </div>

            {/* Armor - Better Organized Grid */}
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/30 p-3">
                <h4 className="text-white font-semibold mb-2 text-center text-sm">Armor</h4>
                <div className="space-y-2">
                    {/* Top Row */}
                    <div className="flex justify-center gap-2">
                        <EquipmentSlot 
                            type="armor" 
                            slotId="head" 
                            itemId={profile?.equipped?.armor?.head} 
                            label="Head"
                        />
                    </div>
                    
                    {/* Middle Row */}
                    <div className="flex justify-center gap-2">
                        <EquipmentSlot 
                            type="armor" 
                            slotId="cape" 
                            itemId={profile?.equipped?.armor?.cape} 
                            label="Cape"
                        />
                        <EquipmentSlot 
                            type="armor" 
                            slotId="chest" 
                            itemId={profile?.equipped?.armor?.chest} 
                            label="Chest"
                        />
                        <EquipmentSlot 
                            type="armor" 
                            slotId="gloves" 
                            itemId={profile?.equipped?.armor?.gloves} 
                            label="Gloves"
                        />
                    </div>
                    
                    {/* Bottom Row */}
                    <div className="flex justify-center gap-2">
                        <EquipmentSlot 
                            type="armor" 
                            slotId="pants" 
                            itemId={profile?.equipped?.armor?.pants} 
                            label="Pants"
                        />
                        <EquipmentSlot 
                            type="armor" 
                            slotId="boots" 
                            itemId={profile?.equipped?.armor?.boots} 
                            label="Boots"
                        />
                    </div>
                </div>
            </div>

            {/* Aspects - Compact */}
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/30 p-3">
                <h4 className="text-white font-semibold mb-2 text-center text-sm">Aspects</h4>
                <div className="flex justify-center gap-2">
                    {[0, 1, 2].map(index => (
                        <AspectSlot 
                            key={index} 
                            index={index} 
                            aspectId={profile?.equipped?.aspects?.[index]} 
                        />
                    ))}
                </div>
            </div>

            {/* Artifacts - Compact */}
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/30 p-3">
                <h4 className="text-white font-semibold mb-2 text-center text-sm">Artifacts</h4>
                <div className="flex justify-center gap-2">
                    {[0, 1, 2].map(index => (
                        <ArtifactSlot 
                            key={index} 
                            index={index} 
                            artifactId={profile?.equipped?.artifacts?.[index]} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EquipmentColumn;