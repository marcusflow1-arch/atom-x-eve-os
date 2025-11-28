import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Search, Mic, MicOff, Sword, Shield, Sparkles, Box, Database, Ghost, Hammer, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { itemData, skillData } from './mockData';

const rarityColors = {
    'Common': 'border-slate-600 bg-slate-800/50',
    'Uncommon': 'border-green-500/50 bg-green-900/20',
    'Rare': 'border-blue-500/50 bg-blue-900/20',
    'Epic': 'border-purple-500/50 bg-purple-900/20',
    'Legendary': 'border-orange-500/50 bg-orange-900/20',
    'Mythic': 'border-red-500/50 bg-red-900/20'
};

const InventoryRow = ({ title, icon: Icon, items, droppableId }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const scrollContainerRef = React.useRef(null);

    const handleScrollLineWheel = (e) => {
        if (scrollContainerRef.current && !isExpanded) {
            e.preventDefault();
            e.stopPropagation();
            scrollContainerRef.current.scrollLeft += e.deltaY;
        }
    };

    if (!items || items.length === 0) return null;

    return (
        <div className="mb-6 relative w-fit max-w-full group/row">
            <div className="flex items-center gap-2 mb-3 px-2">
                <div className="p-1.5 rounded-md bg-slate-700/50">
                    <Icon className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{title}</h3>
                <span className="text-xs text-slate-500 font-mono">({items.length})</span>
                
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1 rounded-full hover:bg-slate-700/50"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? (
                        <ArrowDownLeft className="w-4 h-4 text-cyan-400" />
                    ) : (
                        <ArrowUpRight className="w-4 h-4 text-slate-400 hover:text-cyan-400" />
                    )}
                </Button>
            </div>
            
            <Droppable droppableId={droppableId} direction={isExpanded ? undefined : "horizontal"}>
                {(provided) => (
                    <div 
                        ref={(el) => {
                            provided.innerRef(el);
                            scrollContainerRef.current = el;
                        }}
                        {...provided.droppableProps}
                        className={`
                            ${isExpanded 
                                ? 'grid grid-cols-5 gap-1 px-1 pb-4 w-fit' 
                                : 'flex gap-1 overflow-x-auto pb-4 px-2 pr-6 custom-scrollbar min-h-[110px] scroll-smooth'
                            }
                            transition-all duration-300 ease-in-out
                        `}
                        onWheel={(e) => {
                            if (!isExpanded && e.currentTarget) {
                                e.currentTarget.scrollLeft += e.deltaY;
                            }
                        }}
                    >
                        {items.map((item, index) => {
                            // Handle both item objects and simple ID references if any
                            const itemDetails = item.itemId ? (itemData[item.itemId] || item) : item;
                            const uniqueId = item.id || item.skillId || `item-${index}`;
                            
                            return (
                                <Draggable key={uniqueId} draggableId={uniqueId} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`
                                                flex-shrink-0 w-24 h-24
                                                rounded-xl border-2 relative group cursor-grab
                                                ${rarityColors[itemDetails.rarity] || rarityColors['Common']}
                                                ${snapshot.isDragging ? 'scale-110 z-50 shadow-[0_0_20px_rgba(0,0,0,0.5)]' : 'hover:scale-105 hover:border-opacity-100'}
                                                transition-all duration-200
                                            `}
                                        >
                                            <div className="w-full h-full p-2 flex items-center justify-center">
                                                <img 
                                                    src={itemDetails.icon_url || itemDetails.icon} 
                                                    alt={itemDetails.name}
                                                    className="max-w-full max-h-full object-contain drop-shadow-md"
                                                />
                                            </div>
                                            
                                            {/* Item Count / Level overlay if needed */}
                                            {itemDetails.levelRequirement && (
                                                <div className="absolute top-1 left-1 bg-black/60 rounded px-1 text-[9px] text-slate-300 font-mono">
                                                    LV{itemDetails.levelRequirement}
                                                </div>
                                            )}

                                            {/* Hover Tooltip */}
                                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col justify-center items-center p-2 pointer-events-none">
                                                <p className="text-white text-[10px] font-bold text-center leading-tight mb-1">{itemDetails.name}</p>
                                                <p className={`text-[9px] font-mono uppercase ${
                                                    itemDetails.rarity === 'Legendary' ? 'text-orange-400' : 
                                                    itemDetails.rarity === 'Epic' ? 'text-purple-400' : 'text-slate-400'
                                                }`}>
                                                    {itemDetails.rarity}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            );
                        })}
                        {provided.placeholder}
                        
                        {/* Empty slots filler to make the row look like a grid track */}
                        {[...Array(Math.max(0, (isExpanded ? 20 : 6) - items.length))].map((_, i) => (
                            <div key={`empty-${i}`} className="flex-shrink-0 w-24 h-24 rounded-xl border border-slate-800 bg-slate-900/20 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-slate-800" />
                            </div>
                        ))}
                    </div>
                )}
            </Droppable>
            
            {/* Scroll Wheel Line Indicator for Contracted View */}
            {!isExpanded && items.length > 0 && (
                <div 
                    className="absolute -right-1 top-10 bottom-4 w-4 flex items-center justify-center cursor-ns-resize z-10 hover:scale-110 transition-transform"
                    onWheel={handleScrollLineWheel}
                >
                    <div className="h-full w-0.5 bg-slate-600 rounded-full group-hover/row:bg-cyan-500/50 transition-colors shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                </div>
            )}
        </div>
    );
};

const InventoryPanel = ({ inventory, capacity, profile }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isListening, setIsListening] = useState(false);

    const startVoiceSearch = () => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = () => setIsListening(false);
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setSearchTerm(transcript);
            };

            recognition.start();
        }
    };

    // Categorize Items
    const getFilteredItems = () => {
        return inventory.filter(item => {
            const details = itemData[item.itemId] || item;
            if (!details) return false;
            if (searchTerm && !details.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return true;
        });
    };

    const filteredInventory = getFilteredItems();
    
    // Group items by type for rows
    const weapons = filteredInventory.filter(i => (itemData[i.itemId]?.type === 'weapon'));
    const armor = filteredInventory.filter(i => (itemData[i.itemId]?.type === 'armor'));
    const equipment = filteredInventory.filter(i => (itemData[i.itemId]?.type === 'equipment' || itemData[i.itemId]?.subtype === 'cape' || itemData[i.itemId]?.subtype === 'gloves' || itemData[i.itemId]?.subtype === 'boots')); // Merging some armor subtypes if needed, but assuming type 'armor' covers most
    const artifacts = filteredInventory.filter(i => (itemData[i.itemId]?.type === 'artifact'));
    const aspects = filteredInventory.filter(i => (itemData[i.itemId]?.type === 'aspect'));
    
    // Combine skills into a category for display if they were part of inventory, but they are usually separate.
    // The mock data has `skillData` but inventory is separate. 
    // However, the previous code rendered abilities. I'll include them as a row.
    const abilities = Object.values(skillData).filter(s => !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Placeholders for other categories mentioned
    const materials = []; // Placeholder
    const questItems = []; // Placeholder
    const consumables = []; // Placeholder

    return (
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 h-full flex flex-col overflow-hidden">
            {/* Header & Search */}
            <div className="p-4 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-md z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-white font-bold text-lg">Full Arsenal</h2>
                        <Badge variant="outline" className="border-slate-700 text-slate-400 font-mono text-xs">
                            {inventory.length} / {capacity} ITEMS
                        </Badge>
                    </div>
                </div>

                <div className="relative">
                    <Input
                        placeholder="Search arsenal..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-950/50 border-slate-800 pl-10 pr-12 h-10 text-sm focus:border-cyan-500/50 transition-colors"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Button
                        onClick={startVoiceSearch}
                        variant="ghost"
                        size="icon"
                        className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 ${
                            isListening ? 'text-red-500 animate-pulse' : 'text-slate-500 hover:text-white'
                        }`}
                    >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                
                <InventoryRow 
                    title="Weapons" 
                    icon={Sword} 
                    items={weapons} 
                    droppableId="inventory-weapons" 
                />

                <InventoryRow 
                    title="Armor & Gear" 
                    icon={Shield} 
                    items={armor} 
                    droppableId="inventory-armor" 
                />

                <InventoryRow 
                    title="Artifacts & Relics" 
                    icon={Ghost} 
                    items={artifacts} 
                    droppableId="inventory-artifacts" 
                />

                <InventoryRow 
                    title="Abilities & Skills" 
                    icon={Sparkles} 
                    items={abilities} 
                    droppableId="inventory-abilities" 
                />

                <InventoryRow 
                    title="Aspects" 
                    icon={Database} 
                    items={aspects} 
                    droppableId="inventory-aspects" 
                />

                {/* Placeholder Rows for Empty Categories to show structure */}
                <div className="opacity-50 grayscale pointer-events-none">
                     <InventoryRow 
                        title="Materials (Empty)" 
                        icon={Hammer} 
                        items={[{id: 'mat-1', name: 'Scrap', icon: '', rarity: 'Common'}]} 
                        droppableId="inventory-materials" 
                    />
                    <InventoryRow 
                        title="Quest Items (Empty)" 
                        icon={Box} 
                        items={[{id: 'quest-1', name: 'Key', icon: '', rarity: 'Rare'}]} 
                        droppableId="inventory-quest" 
                    />
                </div>

            </div>
        </div>
    );
};

export default InventoryPanel;