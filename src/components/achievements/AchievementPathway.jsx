import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, Star, Map, Compass } from 'lucide-react';

const mockPathways = [
  {
    id: 'path_warrior',
    name: "The Warrior's Way",
    nodes: [
      { id: 'node_1', title: 'First Blood', x: 50, y: 80, status: 'unlocked' },
      { id: 'node_2', title: 'Arena Novice', x: 30, y: 60, status: 'unlocked' },
      { id: 'node_3', title: 'Beast Slayer', x: 70, y: 60, status: 'locked' },
      { id: 'node_4', title: 'Champion', x: 50, y: 30, status: 'locked' },
      { id: 'node_5', title: 'Legend', x: 50, y: 10, status: 'locked' },
    ],
    connections: [
      { from: 'node_1', to: 'node_2' },
      { from: 'node_1', to: 'node_3' },
      { from: 'node_2', to: 'node_4' },
      { from: 'node_3', to: 'node_4' },
      { from: 'node_4', to: 'node_5' },
    ]
  },
  {
    id: 'path_explorer',
    name: "Explorer's Journey",
    nodes: [
      { id: 'node_ex_1', title: 'Setting Out', x: 50, y: 90, status: 'unlocked' },
      { id: 'node_ex_2', title: 'Map Maker', x: 50, y: 60, status: 'locked' },
      { id: 'node_ex_3', title: 'Cartographer', x: 50, y: 30, status: 'locked' },
    ],
    connections: [
      { from: 'node_ex_1', to: 'node_ex_2' },
      { from: 'node_ex_2', to: 'node_ex_3' },
    ]
  }
];

export default function AchievementPathway() {
  const [activePath, setActivePath] = useState(mockPathways[0]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Map className="w-6 h-6 text-blue-400" />
          Achievement Pathways
        </h2>
        <div className="flex gap-2">
          {mockPathways.map(path => (
            <button
              key={path.id}
              onClick={() => setActivePath(path)}
              className={`px-3 py-1 rounded-full text-sm border transition-all ${
                activePath.id === path.id 
                  ? 'bg-blue-600 border-blue-500 text-white' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {path.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl relative overflow-hidden p-8">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {activePath.connections.map((conn, i) => {
            const fromNode = activePath.nodes.find(n => n.id === conn.from);
            const toNode = activePath.nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;
            return (
              <line
                key={i}
                x1={`${fromNode.x}%`}
                y1={`${fromNode.y}%`}
                x2={`${toNode.x}%`}
                y2={`${toNode.y}%`}
                stroke="rgba(96, 165, 250, 0.3)"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {activePath.nodes.map(node => (
          <motion.div
            key={node.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)]
              transition-all duration-300 group-hover:scale-110
              ${node.status === 'unlocked' 
                ? 'bg-blue-600 border-blue-400 text-white shadow-blue-500/30' 
                : 'bg-slate-800 border-slate-600 text-slate-500'}
            `}>
              {node.status === 'unlocked' ? <Trophy className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
            </div>
            
            <div className={`
              mt-2 px-3 py-1 rounded-lg text-xs font-bold border
              ${node.status === 'unlocked' 
                ? 'bg-blue-900/80 border-blue-500/50 text-blue-200' 
                : 'bg-slate-900/80 border-slate-700 text-slate-500'}
            `}>
              {node.title}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}