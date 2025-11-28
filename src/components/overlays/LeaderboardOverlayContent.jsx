import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Trophy, Star, Users } from 'lucide-react'; // FIXED: Added Users import

export default function LeaderboardOverlayContent() {
  const leaders = [
    { rank: 1, username: 'DragonSlayer99', score: 15420, badge: 'Legendary' },
    { rank: 2, username: 'CyberNinja', score: 14230, badge: 'Master' },
    { rank: 3, username: 'MysticMage', score: 13840, badge: 'Master' },
    { rank: 4, username: 'ShadowBlade', score: 12560, badge: 'Expert' },
    { rank: 5, username: 'IceWarrior', score: 11920, badge: 'Expert' }
  ];

  return (
    <Tabs defaultValue="global" className="w-full">
      <TabsList className="grid w-full grid-cols-5 bg-slate-800">
        <TabsTrigger value="global">Global</TabsTrigger>
        <TabsTrigger value="friends">Friends</TabsTrigger>
        <TabsTrigger value="genre">Genre</TabsTrigger>
        <TabsTrigger value="weekly">Weekly</TabsTrigger>
        <TabsTrigger value="alltime">All-Time</TabsTrigger>
      </TabsList>

      <TabsContent value="global" className="space-y-3">
        {leaders.map((player) => (
          <Card 
            key={player.rank} 
            className={`bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors cursor-pointer ${
              player.rank <= 3 ? 'border-yellow-500/30' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                  player.rank === 1 ? 'bg-yellow-500 text-yellow-900' :
                  player.rank === 2 ? 'bg-slate-400 text-slate-900' :
                  player.rank === 3 ? 'bg-amber-600 text-amber-900' :
                  'bg-slate-700 text-white'
                }`}>
                  {player.rank <= 3 ? (
                    <Crown className="w-6 h-6" />
                  ) : (
                    player.rank
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-semibold">{player.username}</p>
                    <Badge className={
                      player.badge === 'Legendary' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                      player.badge === 'Master' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                      'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    }>
                      {player.badge}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span>{player.score.toLocaleString()} points</span>
                  </div>
                </div>

                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="friends">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Connect with friends to see their rankings</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="genre">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Genre-specific leaderboards coming soon</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="weekly">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <Star className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Weekly rankings reset every Monday</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="alltime">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <Crown className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">All-time legends - since launch</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}