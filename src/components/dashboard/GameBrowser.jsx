import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const gameList = [
  "Half-Life: Reconstructed",
  "Counter-Strike: Evolution",
  "Diablo II: Eternal",
  "Street Fighter Alpha: Reborn",
  "Final Fantasy VII: Remastered",
  "Age of Empires: Chronicles",
  "StarCraft: Ghost Protocol",
];

export default function GameBrowser() {
  return (
    <div className="bg-[#455a64] p-2 bevel-light h-full">
      <h3 className="text-xl pb-2 mb-2">AI News - Atom x Eve</h3>
      <div className="flex gap-2 mb-2">
        <div className="w-20 h-8 bg-[#2c3e50] bevel-dark"></div>
        <div className="w-40 h-8 bg-[#2c3e50] bevel-dark flex-grow"></div>
        <div className="w-20 h-8 bg-[#2c3e50] bevel-dark"></div>
      </div>
      <div className="bg-[#2c3e50] p-2 bevel-dark">
        <div className="flex items-center gap-2 mb-2">
          <Button className="bevel-light hover:bg-[#546e7a] text-xs px-2 py-1">Home</Button>
          <Select>
            <SelectTrigger className="bevel-light bg-[#455a64] text-xs h-8 w-32">
              <SelectValue placeholder="Game" />
            </SelectTrigger>
          </Select>
          <Select>
            <SelectTrigger className="bevel-light bg-[#455a64] text-xs h-8 w-40">
              <SelectValue placeholder="Drop menu" />
            </SelectTrigger>
          </Select>
          <div className="flex-grow"></div>
          <Button className="bevel-light hover:bg-[#546e7a] text-xs px-2 py-1">Search</Button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="col-span-3 bg-[#34495e] bevel-dark p-2 space-y-1 h-64 overflow-y-auto">
            {gameList.map(game => (
              <div key={game} className="p-2 bg-[#455a64] bevel-light text-sm">
                {game}
              </div>
            ))}
          </div>
          <div className="col-span-1 bg-[#34495e] bevel-dark p-2">
            <h4 className="text-sm border-b border-[#546e7a] pb-1 mb-2">Search option pattern</h4>
            <div className="space-y-2 text-xs">
              {['Option 1', 'Option 2', 'Option 3', 'Option 4'].map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#455a64] bevel-light"></div>
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}