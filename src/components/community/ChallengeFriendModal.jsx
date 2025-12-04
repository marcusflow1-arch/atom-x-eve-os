import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Swords, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ChallengeFriendModal({ achievement, isOpen, onClose }) {
    const [friendName, setFriendName] = useState('');
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChallenge = async () => {
        setIsLoading(true);
        try {
            // Create a challenge post
            await base44.entities.Post.create({
                title: `Challenge: ${achievement.title}`,
                content: `${note || "I challenge you to unlock this achievement!"} \n\nTarget: ${friendName}`,
                type: 'challenge',
                community: 'general', // or specific challenge community
                game_title: achievement.game,
                achievement_id: achievement.id,
                achievement_data: achievement,
                challenge_target_user_id: friendName, // Using name as ID proxy for now
                score: 0
            });
            onClose();
        } catch (error) {
            console.error("Failed to send challenge:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-orange-400">
                        <Swords className="w-5 h-5" />
                        Challenge a Friend
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <h4 className="font-bold text-white">{achievement.title}</h4>
                        <p className="text-sm text-slate-400">{achievement.description}</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Friend's Username</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input 
                                value={friendName}
                                onChange={(e) => setFriendName(e.target.value)}
                                placeholder="Enter username..."
                                className="pl-9 bg-slate-950 border-slate-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Challenge Note</Label>
                        <Input 
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Bet you can't beat my time..."
                            className="bg-slate-950 border-slate-700"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button 
                        onClick={handleChallenge}
                        disabled={!friendName || isLoading}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Swords className="w-4 h-4 mr-2" />}
                        Send Challenge
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}