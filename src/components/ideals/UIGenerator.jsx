import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, MicOff, Sparkles, Image as ImageIcon, Download, Loader2, Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';

export default function UIGenerator() {
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [loading, setLoading] = useState(false);
    const [designs, setDesigns] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    
    // Voice Recognition
    const recognitionRef = useRef(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleGenerate = async () => {
        if (!input.trim()) return;
        
        setLoading(true);
        setDesigns([]); // Clear previous results or keep them? Let's clear for new search.
        try {
            const res = await base44.functions.invoke('generateUIDesigns', { prompt: input });
            if (res.data && res.data.designs) {
                setDesigns(res.data.designs);
            } else {
                console.error("No designs returned");
            }
        } catch (error) {
            console.error("Generation failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `ui-design-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            console.error("Download failed, opening in new tab", e);
            window.open(url, '_blank');
        }
    };

    const handleDownload = async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `ui-design-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            console.error("Download failed, opening in new tab", e);
            window.open(url, '_blank');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center space-y-4 mb-8">
                <h2 className="text-3xl font-bold text-white">AI UI Generator</h2>
                <p className="text-slate-400">
                    Describe your interface or use voice commands. Powered by ChatGPT, Gemini, and Claude.
                </p>
            </div>

            {/* Search / Input Area */}
            <div className="max-w-3xl mx-auto relative">
                <div className="relative flex items-center">
                    <Search className="absolute left-4 text-slate-400 w-5 h-5" />
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        placeholder="Describe the UI you want to generate... (e.g., 'Cyberpunk inventory screen')"
                        className="pl-12 pr-24 h-16 text-lg bg-slate-900/50 border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                    <div className="absolute right-2 flex gap-2">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={toggleListening}
                            className={`w-10 h-10 rounded-xl transition-colors ${isListening ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white'}`}
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </Button>
                        <Button
                            size="icon"
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-12 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6" />
                    <h3 className="text-xl font-semibold text-white mb-2">Generating UI Concepts</h3>
                    <p className="text-slate-400">Orchestrating multi-model design synthesis...</p>
                </div>
            )}

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {designs.map((design, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-all"
                        >
                            {/* Image */}
                            <div className="aspect-video relative overflow-hidden cursor-pointer" onClick={() => setSelectedImage(design)}>
                                <img 
                                    src={design.url} 
                                    alt="UI Design" 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <Button size="icon" variant="secondary" className="rounded-full" onClick={(e) => { e.stopPropagation(); setSelectedImage(design); }}>
                                        <Maximize2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
                                        {design.source}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-2" title={design.description}>
                                    {design.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {!loading && designs.length === 0 && (
                <div className="text-center py-20 opacity-50">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <p className="text-lg text-slate-400">Ready to generate. Try "Futuristic HUD for a racing game"</p>
                </div>
            )}

            {/* Fullscreen Preview Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <div className="relative max-w-6xl w-full max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                            <img 
                                src={selectedImage.url} 
                                alt="Preview" 
                                className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
                            />
                            <div className="mt-6 flex items-center gap-4">
                                <div className="text-left">
                                    <h3 className="text-xl font-bold text-white">{selectedImage.source} Design</h3>
                                    <p className="text-slate-400 text-sm max-w-xl">{selectedImage.description}</p>
                                </div>
                                <Button className="ml-auto" onClick={() => handleDownload(selectedImage.url)}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </Button>
                                <Button variant="secondary" onClick={() => setSelectedImage(null)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}