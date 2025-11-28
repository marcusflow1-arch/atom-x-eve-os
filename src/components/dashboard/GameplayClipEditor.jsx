import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Pause, Square, Upload, Download, Scissors, FileVideo, Youtube, Twitch, Facebook,
  Save, Film, Edit3, Share2, Trash2, Plus, Volume2, Settings, Tag, Clock, Layers,
  Palette, Type, Image as ImageIcon, Video, Mic, RadioTower, KeyRound, X,
  Radio, Eye, Lock, Users as UsersIcon, Camera, Send, ExternalLink, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GameplayClipEditor() {
  const [activeFunction, setActiveFunction] = useState('record');
  const [isRecording, setIsRecording] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedClips, setRecordedClips] = useState([
    { id: 1, title: 'Epic Boss Fight', duration: '0:45', thumbnail: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=300&h=200&fit=crop', date: '2024-01-20' },
    { id: 2, title: 'Perfect Speedrun', duration: '2:30', thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=200&fit=crop', date: '2024-01-19' }
  ]);
  const [editingClip, setEditingClip] = useState(null);
  const [designingClip, setDesigningClip] = useState(null);
  const [publishingClip, setPublishingClip] = useState(null);
  const [isStreamExpanded, setIsStreamExpanded] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamCategory, setStreamCategory] = useState('');
  const [streamPrivacy, setStreamPrivacy] = useState('public');
  const [chatMessages, setChatMessages] = useState([
    { user: 'Viewer1', message: 'Great stream!', timestamp: '10:32' },
    { user: 'Gamer123', message: 'Amazing gameplay', timestamp: '10:33' }
  ]);

  const recordingRef = useRef(null);
  
  const functions = [
    { id: 'record', label: 'Record', icon: Film, color: 'bg-red-600' },
    { id: 'edit', label: 'Edit', icon: Edit3, color: 'bg-blue-600' },
    { id: 'design', label: 'Design', icon: Palette, color: 'bg-purple-600' },
    { id: 'publish', label: 'Publish', icon: Share2, color: 'bg-green-600' },
    { id: 'golive', label: 'Go Live', icon: Radio, color: 'bg-pink-600' }
  ];

  const platforms = [
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000' },
    { id: 'tiktok', name: 'TikTok', icon: Video, color: '#000000' },
    { id: 'twitch', name: 'Twitch', icon: Twitch, color: '#9146FF' },
    { id: 'twitter', name: 'Twitter/X', icon: Share2, color: '#1DA1F2' }
  ];

  // Recording timer effect
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = () => {
    setIsRecording(true);
    // Recording logic would go here
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Save recording and add to clips
    const newClip = {
      id: recordedClips.length + 1,
      title: `Recording ${recordedClips.length + 1}`,
      duration: formatTime(recordingTime),
      thumbnail: 'https://images.unsplash.com/photo-1542751371-331572b78519?w=300&h=200&fit=crop',
      date: new Date().toISOString().split('T')[0]
    };
    setRecordedClips(prev => [newClip, ...prev]);
    setRecordingTime(0);
  };

  const startStreaming = () => {
    setIsStreaming(true);
  };

  const stopStreaming = () => {
    setIsStreaming(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const publishToPllatform = (platform, clip) => {
    // Publishing logic would go here
    console.log(`Publishing ${clip.title} to ${platform}`);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/50 rounded-xl overflow-hidden">
      <style>{`
        .clip-editor-3d {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
          backdrop-filter: blur(10px);
          border: 1px solid rgba(59, 130, 246, 0.2);
          box-shadow: 
            0 10px 25px rgba(0, 0, 0, 0.3),
            inset 0 1px 3px rgba(255, 255, 255, 0.1);
        }
        
        .function-tab {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        
        .function-tab:hover {
          transform: translateY(-2px) rotateX(5deg);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }
        
        .function-tab.active {
          transform: translateY(-3px) rotateX(10deg);
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
        }
        
        .record-button {
          position: relative;
          overflow: hidden;
        }
        
        .record-button::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(239, 68, 68, 0.3), transparent 70%);
          transform: scale(0);
          animation: recordPulse 2s ease-in-out infinite;
        }
        
        .record-button.recording::before {
          transform: scale(1);
        }
        
        @keyframes recordPulse {
          0%, 100% { transform: scale(0); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0; }
        }
        
        .clip-card {
          transform-style: preserve-3d;
          transition: all 0.3s ease;
        }
        
        .clip-card:hover {
          transform: translateY(-5px) rotateX(5deg) rotateY(-2deg);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
        }
        
        .live-indicator {
          animation: livePulse 2s ease-in-out infinite;
        }
        
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        
        .chat-message {
          animation: chatSlideIn 0.3s ease-out;
        }
        
        @keyframes chatSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .platform-button {
          position: relative;
          overflow: hidden;
          transform-style: preserve-3d;
          transition: all 0.3s ease;
        }
        
        .platform-button:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        .platform-button::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s;
        }
        
        .platform-button:hover::after {
          transform: translateX(100%);
        }
      `}</style>

      {/* Function Selector */}
      <div className="flex gap-2 p-4 bg-slate-800/50 border-b border-slate-700/50">
        {functions.map((func) => (
          <button
            key={func.id}
            onClick={() => setActiveFunction(func.id)}
            className={`function-tab flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium ${
              activeFunction === func.id
                ? `${func.color} text-white shadow-lg active`
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50 bg-slate-800/30'
            }`}
          >
            <func.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{func.label}</span>
          </button>
        ))}
      </div>

      {/* Function Content */}
      <div className="flex-grow overflow-hidden p-4">
        <AnimatePresence mode="wait">
          {/* RECORD SUBTAB */}
          {activeFunction === 'record' && (
            <motion.div
              key="record"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <div className={`record-button w-24 h-24 mx-auto rounded-full border-4 flex items-center justify-center transition-all cursor-pointer ${
                isRecording 
                  ? 'border-red-500 bg-red-500/20 recording' 
                  : 'border-slate-600 hover:border-red-500/50 hover:bg-red-500/10'
              }`} onClick={isRecording ? stopRecording : startRecording}>
                {isRecording ? (
                  <Square className="w-8 h-8 text-red-400" />
                ) : (
                  <Film className="w-8 h-8 text-slate-400" />
                )}
              </div>
              
              {isRecording && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-red-400 font-mono text-2xl live-indicator"
                >
                  REC {formatTime(recordingTime)}
                </motion.div>
              )}
              
              <motion.p 
                className="text-slate-400"
                animate={{ opacity: isRecording ? 1 : 0.7 }}
              >
                {isRecording ? 'Recording in progress...' : 'Click the button to start recording'}
              </motion.p>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-400">Quality</p>
                  <p className="text-white font-medium">1080p 60fps</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-400">Audio</p>
                  <p className="text-white font-medium">Game + Mic</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* EDIT SUBTAB */}
          {activeFunction === 'edit' && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              {!editingClip ? (
                <>
                  <h3 className="text-lg font-bold text-white mb-4">Your Recorded Clips</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recordedClips.map((clip, index) => (
                      <motion.div
                        key={clip.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="clip-card bg-slate-800/50 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => setEditingClip(clip)}
                      >
                        <img src={clip.thumbnail} alt={clip.title} className="w-full h-32 object-cover" />
                        <div className="p-3">
                          <h4 className="font-semibold text-white">{clip.title}</h4>
                          <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>{clip.duration}</span>
                            <span>{clip.date}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingClip(null)}
                      className="text-slate-400"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <h3 className="text-lg font-bold text-white">Editing: {editingClip.title}</h3>
                  </div>

                  <div className="bg-black/50 rounded-lg h-48 flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <Video className="w-12 h-12 mx-auto mb-2" />
                      <p>Video Preview</p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Scissors className="w-4 h-4 mr-2" />
                      Trim
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                      <Volume2 className="w-4 h-4 mr-2" />
                      Audio
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Thumbnail
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-purple-600 hover:bg-purple-700 ml-auto"
                      onClick={() => {
                        setDesigningClip(editingClip);
                        setActiveFunction('design');
                        setEditingClip(null);
                      }}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save & Design
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* DESIGN SUBTAB */}
          {activeFunction === 'design' && (
            <motion.div
              key="design"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {!designingClip ? (
                <div className="text-center py-8">
                  <Palette className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Select a Clip to Design</h3>
                  <p className="text-slate-400">Choose a clip from the Edit tab to add overlays and effects</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDesigningClip(null)}
                      className="text-slate-400"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <h3 className="text-lg font-bold text-white">Designing: {designingClip.title}</h3>
                  </div>

                  <div className="bg-black/50 rounded-lg h-48 flex items-center justify-center relative">
                    <div className="text-center text-slate-400">
                      <Video className="w-12 h-12 mx-auto mb-2" />
                      <p>Design Preview</p>
                    </div>
                    {/* Overlay examples */}
                    <div className="absolute top-4 left-4 bg-blue-500/20 border border-blue-500/50 rounded px-2 py-1 text-xs text-blue-300">
                      Sample Text Overlay
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Type className="w-4 h-4 mr-2" />
                      Add Text
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Add Sticker
                    </Button>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      <Mic className="w-4 h-4 mr-2" />
                      Voiceover
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setPublishingClip(designingClip);
                        setActiveFunction('publish');
                        setDesigningClip(null);
                      }}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save & Publish
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* PUBLISH SUBTAB */}
          {activeFunction === 'publish' && (
            <motion.div
              key="publish"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {publishingClip && (
                <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-white mb-2">Publishing: {publishingClip.title}</h3>
                  <div className="flex gap-4">
                    <img src={publishingClip.thumbnail} alt={publishingClip.title} className="w-20 h-12 object-cover rounded" />
                    <div className="flex-grow space-y-2">
                      <Input placeholder="Add title..." className="bg-slate-700 border-slate-600 text-white text-sm" />
                      <Textarea placeholder="Description..." className="bg-slate-700 border-slate-600 text-white text-sm h-20 resize-none" />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {platforms.map((platform) => (
                  <motion.button
                    key={platform.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="platform-button flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 text-left"
                    style={{ borderColor: platform.color + '30' }}
                    onClick={() => publishingClip && publishToPllatform(platform.name, publishingClip)}
                  >
                    <platform.icon className="w-6 h-6" style={{ color: platform.color }} />
                    <div>
                      <p className="font-medium text-white">{platform.name}</p>
                      <p className="text-xs text-slate-400">Publish to {platform.name}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {!publishingClip && (
                <div className="text-center py-8">
                  <Share2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Select a Clip to Publish</h3>
                  <p className="text-slate-400">Choose a clip from the Design tab to share with the world</p>
                </div>
              )}
            </motion.div>
          )}

          {/* GO LIVE SUBTAB */}
          {activeFunction === 'golive' && (
            <motion.div
              key="golive"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`space-y-4 ${isStreamExpanded ? 'fixed inset-0 z-50 bg-slate-900 p-4' : ''}`}
            >
              {isStreamExpanded && (
                <Button
                  onClick={() => setIsStreamExpanded(false)}
                  className="absolute top-4 right-4 z-10"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Stream Controls</h3>
                {!isStreamExpanded && (
                  <Button
                    onClick={() => setIsStreamExpanded(true)}
                    size="sm"
                    variant="outline"
                    className="border-slate-600"
                  >
                    Expand
                  </Button>
                )}
              </div>

              <div className={`grid ${isStreamExpanded ? 'grid-cols-3' : 'grid-cols-1'} gap-4`}>
                {/* Stream Preview */}
                <div className={`${isStreamExpanded ? 'col-span-2' : ''} space-y-4`}>
                  <div className={`bg-black/50 rounded-lg flex items-center justify-center relative ${
                    isStreamExpanded ? 'h-96' : 'h-48'
                  }`}>
                    {isStreaming ? (
                      <>
                        <div className="absolute top-4 left-4 live-indicator bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                          LIVE
                        </div>
                        <div className="text-center text-white">
                          <Camera className="w-12 h-12 mx-auto mb-2" />
                          <p className="font-medium">Streaming: {streamTitle || 'Untitled Stream'}</p>
                          <p className="text-sm text-slate-300">{streamCategory || 'Just Chatting'}</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-slate-400">
                        <Camera className="w-12 h-12 mx-auto mb-2" />
                        <p>Stream Preview</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Input
                      placeholder="Stream title..."
                      value={streamTitle}
                      onChange={(e) => setStreamTitle(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={streamCategory} onValueChange={setStreamCategory}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cyberpunk">Cyberpunk 2088</SelectItem>
                          <SelectItem value="elderscrolls">Elder Scrolls</SelectItem>
                          <SelectItem value="justchatting">Just Chatting</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={streamPrivacy} onValueChange={setStreamPrivacy}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              Public
                            </div>
                          </SelectItem>
                          <SelectItem value="private">
                            <div className="flex items-center gap-2">
                              <Lock className="w-4 h-4" />
                              Private
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={isStreaming ? stopStreaming : startStreaming}
                      className={`w-full ${isStreaming ? 'bg-slate-600 hover:bg-slate-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                      size="lg"
                    >
                      {isStreaming ? (
                        <>
                          <Square className="w-5 h-5 mr-2" />
                          End Stream
                        </>
                      ) : (
                        <>
                          <Radio className="w-5 h-5 mr-2" />
                          Go Live
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Chat */}
                {(isStreamExpanded || isStreaming) && (
                  <div className="bg-slate-800/50 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-slate-400">Chat Active</span>
                      <span className="text-xs bg-slate-700 px-2 py-1 rounded-full text-slate-300 ml-auto">
                        {chatMessages.length} viewers
                      </span>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto space-y-2 mb-3 max-h-48">
                      {chatMessages.map((msg, index) => (
                        <div key={index} className="chat-message text-sm">
                          <span className="text-blue-400 font-medium">{msg.user}:</span>
                          <span className="text-slate-300 ml-2">{msg.message}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Say something..." 
                        className="bg-slate-700 border-slate-600 text-white text-sm flex-grow"
                      />
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}