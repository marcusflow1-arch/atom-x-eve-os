import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Lightbulb, Volume2, Play, Pause, Zap, BrainCircuit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';

export default function AIAssistantPanel({ achievement, game }) {
    const [isLoading, setIsLoading] = useState(false);
    const [tips, setTips] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const audioRef = React.useRef(null);

    const fetchTips = async () => {
        setIsLoading(true);
        try {
            const response = await base44.functions.invoke('achievementAI', {
                action: 'get_tips',
                achievement,
                game
            });
            setTips(response.data);
        } catch (error) {
            console.error("Error fetching tips:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVoiceGuide = async () => {
        if (audioUrl) {
            toggleAudio();
            return;
        }

        setIsLoading(true);
        try {
            // Fetch blob directly
            const response = await fetch(`${base44.functions.url}/achievementAI`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // If needed, auth headers would go here but usually client SDK handles it. 
                    // However, since we need blob, we might need to do it manually or check if SDK supports blob response.
                    // SDK invoke returns JSON usually. Let's try raw fetch or a workaround.
                    // Actually, standard SDK invoke parses JSON.
                    // We can use the raw fetch for audio.
                },
                body: JSON.stringify({
                    action: 'get_voice_guide',
                    achievement,
                    game
                })
            });

            if (!response.ok) throw new Error('Failed to fetch audio');
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            setIsPlaying(true);
        } catch (error) {
            console.error("Error generating voice guide:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAudio = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    useEffect(() => {
        if (audioUrl && audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
        }
    }, [audioUrl]);

    return (
        <Card className="bg-slate-900/80 border-blue-500/30 overflow-hidden">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
                            <Bot className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="font-bold text-white">AI Strategy Assistant</h3>
                    </div>
                    <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-500/30">
                        Beta
                    </Badge>
                </div>

                {!tips ? (
                    <div className="text-center py-6">
                        <p className="text-slate-400 mb-4 text-sm">
                            Analyze this achievement to get personalized strategies and difficulty adjustments.
                        </p>
                        <Button 
                            onClick={fetchTips} 
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <BrainCircuit className="w-4 h-4 mr-2" />
                                    Generate Strategy
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-blue-900/10 rounded-lg p-4 border border-blue-500/20">
                            <h4 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Strategy Guide
                            </h4>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {tips.strategy}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-purple-900/10 rounded-lg p-4 border border-purple-500/20">
                                <h4 className="text-purple-300 font-semibold mb-2 flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4" /> Quick Tips
                                </h4>
                                <ul className="space-y-2">
                                    {tips.quick_tips?.map((tip, i) => (
                                        <li key={i} className="text-slate-300 text-xs flex items-start gap-2">
                                            <span className="text-purple-500 mt-0.5">•</span>
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="bg-orange-900/10 rounded-lg p-4 border border-orange-500/20">
                                <h4 className="text-orange-300 font-semibold mb-2 flex items-center gap-2">
                                    <BrainCircuit className="w-4 h-4" /> Difficulty Adjustments
                                </h4>
                                <p className="text-slate-300 text-xs leading-relaxed">
                                    {tips.difficulty_adjustment}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                            <p className="text-xs text-slate-500">AI-generated content may vary.</p>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleVoiceGuide}
                                disabled={isLoading}
                                className="border-blue-500/30 hover:bg-blue-900/20"
                            >
                                {isLoading && !tips ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : isPlaying ? (
                                    <Pause className="w-4 h-4 mr-2 text-blue-400" />
                                ) : (
                                    <Play className="w-4 h-4 mr-2 text-blue-400" />
                                )}
                                {isPlaying ? 'Pause Voice Guide' : 'Play Voice Guide'}
                            </Button>
                        </div>
                        
                        {audioUrl && (
                            <audio 
                                ref={audioRef} 
                                src={audioUrl} 
                                onEnded={() => setIsPlaying(false)}
                                className="hidden" 
                            />
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}