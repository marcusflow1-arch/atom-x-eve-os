import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Trophy, Clock, Users } from 'lucide-react';

export default function TournamentOverlayContent() {
  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Monthly Championship</h3>
              <p className="text-slate-300">Prize Pool: 50,000 AGP + Exclusive Items</p>
            </div>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <Clock className="w-5 h-5 text-blue-400 mb-2" />
              <p className="text-sm text-slate-400">Starts in</p>
              <p className="text-lg font-bold text-white">2d 14h</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <Users className="w-5 h-5 text-green-400 mb-2" />
              <p className="text-sm text-slate-400">Registered</p>
              <p className="text-lg font-bold text-white">128/256</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <Trophy className="w-5 h-5 text-yellow-400 mb-2" />
              <p className="text-sm text-slate-400">Entry Fee</p>
              <p className="text-lg font-bold text-white">500 AGP</p>
            </div>
          </div>

          <Button className="w-full bg-purple-600 hover:bg-purple-700">
            Register for Tournament
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <h4 className="text-white font-semibold mb-4">Tournament Rules</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>• Single elimination bracket</li>
            <li>• Best of 3 matches</li>
            <li>• Finals are best of 5</li>
            <li>• No spectators during matches</li>
            <li>• All items must be within tournament regulations</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}