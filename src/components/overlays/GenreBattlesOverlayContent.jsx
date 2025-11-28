import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Swords, Trophy } from 'lucide-react';

export default function GenreBattlesOverlayContent() {
  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Globe className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Genre Battles</h3>
            <p className="text-slate-400 mb-6">
              Cross-genre competitive showdowns - RPG vs FPS, Fantasy vs Sci-Fi
            </p>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 mb-6">
              Weekly Tournament Active
            </Badge>
            
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <Swords className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-white font-semibold">RPG Legion</p>
                <p className="text-sm text-slate-400">457 players</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <Trophy className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-white font-semibold">FPS Squad</p>
                <p className="text-sm text-slate-400">412 players</p>
              </div>
            </div>

            <Button className="mt-6 bg-purple-600 hover:bg-purple-700">
              Join Genre Battle
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}