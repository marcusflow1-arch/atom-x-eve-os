import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Loader2, Bot, User, Sparkles, Brain, Gamepad2, BookOpen,
  Box, Lightbulb, Code2, Zap, Trash2, Mic, MicOff, Settings2,
  ChevronDown, Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { invokeAI, getActiveProviderLabel } from '@/components/ai/useAIChat';
import AIProviderConfig from '@/components/ai/AIProviderConfig';

// ─── AI Model Definitions ───────────────────────────
const AI_MODELS = [
  { id: 'auto', label: 'Auto', description: 'Automatically picks the best model for the task', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { id: 'opus-4-6', label: 'Opus 4.6', description: 'Most capable — deep reasoning, complex builds', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { id: 'sonnet-4', label: 'Sonnet 4', description: 'Balanced — fast + smart for most tasks', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { id: 'haiku-3', label: 'Haiku 3', description: 'Fast — quick answers, simple modifications', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
];

// ─── Voice Hook ─────────────────────────────────────
function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);
  const onResultRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }
      if (final) {
        setTranscript(prev => (prev + ' ' + final).trim());
        setInterimTranscript('');
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') setIsListening(false);
    };

    recognition.onend = () => {
      // If still supposed to be listening, restart (handles timeout)
      if (recognitionRef.current?._shouldListen) {
        try { recognition.start(); } catch {}
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    return () => {
      recognition._shouldListen = false;
      try { recognition.stop(); } catch {}
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript('');
    setInterimTranscript('');
    setIsListening(true);
    recognitionRef.current._shouldListen = true;
    try { recognitionRef.current.start(); } catch {}
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current._shouldListen = false;
    try { recognitionRef.current.stop(); } catch {}
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const isSupported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  return { isListening, transcript, interimTranscript, startListening, stopListening, clearTranscript, isSupported };
}

// ─── Knowledge Context Builder ──────────────────────
function buildKnowledgeContext(gameKnowledge, knowledgeEntries, maxTokens = 8000) {
  let ctx = '';
  let budget = maxTokens;

  const gameRef = knowledgeEntries.filter(e => e.knowledge_domain === 'game_reference');
  const engineBuild = knowledgeEntries.filter(e => e.knowledge_domain === 'engine_building');
  const general = knowledgeEntries.filter(e => !e.knowledge_domain || e.knowledge_domain === 'general');
  const pinned = knowledgeEntries.filter(e => e.is_pinned);

  if (gameKnowledge.length > 0) {
    ctx += `\n=== GAME REFERENCE KNOWLEDGE (${gameKnowledge.length} games studied) ===\n`;
    for (const g of gameKnowledge.slice(0, 5)) {
      const block = `GAME: ${g.game_name} | Tech: ${g.tech_stack?.join(', ') || 'unknown'}\nArchitecture: ${g.architecture_summary?.substring(0, 600) || 'N/A'}\nGameplay: ${g.gameplay_systems?.substring(0, 400) || 'N/A'}\n\n`;
      if (budget - block.length < 0) break;
      ctx += block; budget -= block.length;
    }
  }
  if (pinned.length > 0) {
    ctx += `\n=== PINNED (${pinned.length}) ===\n`;
    for (const e of pinned.slice(0, 10)) {
      const block = `[${e.category}] ${e.source_filename}: ${e.summary?.substring(0, 300) || ''}\n`;
      if (budget - block.length < 0) break;
      ctx += block; budget -= block.length;
    }
  }
  for (const [label, list, limit] of [['ENGINE BUILD', engineBuild, 15], ['GAME REF', gameRef, 15], ['GENERAL', general, 10]]) {
    if (list.length > 0 && budget > 300) {
      ctx += `\n=== ${label} (${list.length}) ===\n`;
      for (const e of list.slice(0, limit)) {
        const block = `[${e.category}] ${e.source_filename}: ${e.summary?.substring(0, 200) || ''}\n`;
        if (budget - block.length < 0) break;
        ctx += block; budget -= block.length;
      }
    }
  }
  return ctx;
}

// ─── Main Component ─────────────────────────────────
export default function EngineAIChat({ sceneApi }) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId] = useState(() => 'session_' + Date.now());
  const [selectedModel, setSelectedModel] = useState('auto');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const modelPickerRef = useRef(null);

  // Voice
  const voice = useVoiceInput();

  // Close model picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target)) setShowModelPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync voice transcript into input
  useEffect(() => {
    if (voice.transcript) {
      setInput(voice.transcript);
    }
  }, [voice.transcript]);

  const { data: gameKnowledge = [] } = useQuery({
    queryKey: ['game-knowledge'],
    queryFn: () => base44.entities.GameKnowledge.list('-created_date', 50),
  });
  const { data: knowledgeEntries = [] } = useQuery({
    queryKey: ['knowledge-entries'],
    queryFn: () => base44.entities.KnowledgeEntry.list('-created_date', 500),
  });
  const { data: blueprints = [] } = useQuery({
    queryKey: ['engine-blueprints'],
    queryFn: () => base44.entities.EngineBlueprint.list('-created_date', 50),
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Welcome
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `I'm integrated into the Engine. I have access to your 3D scene, ${knowledgeEntries.length} knowledge entries, ${gameKnowledge.length} studied games, and ${blueprints.length} blueprints.\n\nUse **voice** or type to tell me what to build. Switch AI models with the selector below. I can:\n\n• **Add objects** to the 3D scene\n• **Create blueprints** (Unreal-style)\n• **Generate Three.js code**\n• **Reference studied games**\n• **Build complete systems**\n\nWhat do you want me to build?`,
        actions_taken: [],
      }]);
    }
  }, [knowledgeEntries.length, gameKnowledge.length, blueprints.length]);

  const executeSceneAction = useCallback((action) => {
    if (!sceneApi) return;
    if (action.type === 'add_primitive') {
       sceneApi.addPrimitive(action.data?.shape || 'cube', {
          position: action.data?.position,
          scale: action.data?.scale,
          color: action.data?.color
       });
    }
    else if (action.type === 'add_model' && action.data?.url) {
       sceneApi.addModel(action.data.url, {
          position: action.data?.position,
          scale: action.data?.scale,
          animation_url: action.data?.animation_url
       });
    }
    else if (action.type === 'create_terrain') {
       sceneApi.createTerrain({
          size: action.data?.size || 50,
          color: action.data?.color,
          addFoliage: action.data?.addFoliage !== false
       });
    }
  }, [sceneApi]);

  const handleSend = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || isThinking) return;

    // Stop voice if active
    if (voice.isListening) voice.stopListening();
    voice.clearTranscript();

    setMessages(prev => [...prev, { role: 'user', content: text, actions_taken: [] }]);
    setInput('');
    setIsThinking(true);

    try {
      await base44.entities.EngineChatMessage.create({
        role: 'user', content: text, session_id: sessionId, actions_taken: [], knowledge_used: [],
      });

      const knowledgeCtx = buildKnowledgeContext(gameKnowledge, knowledgeEntries);

      let sceneCtx = 'Scene: 3D viewport with Three.js. ';
      if (sceneApi?.scene) {
        const objects = [];
        sceneApi.scene.traverse(child => {
          if (child.isMesh && child.name !== 'ground') objects.push(`${child.name} at (${child.position.x.toFixed(1)}, ${child.position.y.toFixed(1)}, ${child.position.z.toFixed(1)})`);
        });
        sceneCtx += `Objects: ${objects.length > 0 ? objects.join(', ') : 'StarterCube only'}. `;
      }

      let bpCtx = blueprints.length > 0 ? `\nBlueprints: ${blueprints.map(b => `${b.name} (${b.blueprint_type})`).join(', ')}` : '';
      const historyForPrompt = messages.slice(-10).map(m => `${m.role === 'user' ? 'USER' : 'ENGINE AI'}: ${m.content.substring(0, 500)}`).join('\n');

      const modelInfo = AI_MODELS.find(m => m.id === selectedModel);
      const modelNote = selectedModel === 'auto' 
        ? 'You are running in AUTO mode — adapt your depth based on task complexity.' 
        : `You are running as ${modelInfo?.label}. ${modelInfo?.description}.`;

      const prompt = `You are the ATOM×EVE Engine AI — INTEGRATED into a STANDALONE 3D ENGINE.
${modelNote}

SYSTEM INSTRUCTION:
This is a standalone engine accessing files from the Admin Page (Model3D, AnimationFBX).
When the user asks to create something (e.g. "Create a terrain with trees", "Put C1 model in viewer"):
1. DO NOT just create a blueprint. Blueprints are code/logic.
2. YOU MUST EXECUTE the creation in the 3D viewer immediately.
3. If asked for a specific model (e.g. "C1", "YBot"), find it in the knowledge/assets and spawn it.
4. If asked for animations, apply them to the model in the viewer.
5. If asked for terrain/environment, spawn the meshes.

You are an ACTION-FIRST engine.
- "Create X" -> Spawn X in viewer.
- "Give it animation Y" -> Apply animation Y in viewer.
- "Make a level" -> Spawn terrain + props in viewer.

Blueprints are only for LOGIC (like C# scripts). Visuals must happen in the viewer.

STATE:
${sceneCtx}${bpCtx}

KNOWLEDGE:
${knowledgeCtx}

CONVERSATION:
${historyForPrompt}
USER: ${text}

Respond with JSON:
{"message":"Your response","actions":[{"type":"add_model","description":"Spawning C1","data":{"url":"..."}}],"blueprint":null,"generated_code":null,"knowledge_references":[]}

ACTION TYPES:
- add_primitive ({shape: "cube"|"sphere"|"cylinder"|"plane", position:{x,y,z}, scale:{x,y,z}, color:"#..."})
- add_model ({url: "...", position:{x,y,z}, scale:{x,y,z}, animation_url: "..."})
- create_terrain ({size: 50, color: "#...", addFoliage: true})
- modify_scene ({description})

ALWAYS valid JSON.`;

      const jsonSchema = {
          type: 'object',
          properties: {
            message: { type: 'string' },
            actions: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, description: { type: 'string' }, data: { type: 'object' } } } },
            blueprint: { type: 'object', properties: { name: { type: 'string' }, blueprint_type: { type: 'string' }, description: { type: 'string' }, nodes: { type: 'array', items: { type: 'object' } }, variables: { type: 'array', items: { type: 'object' } } } },
            generated_code: { type: 'object', properties: { name: { type: 'string' }, code: { type: 'string' }, description: { type: 'string' } } },
            knowledge_references: { type: 'array', items: { type: 'string' } }
          },
          required: ['message']
        };

      const response = await invokeAI({
        systemPrompt: prompt.split('\nUSER:')[0],
        userMessage: text,
        jsonSchema,
      });

      const actions = response.actions || [];
      for (const action of actions) executeSceneAction(action);

      if (response.blueprint?.name) {
        await base44.entities.EngineBlueprint.create({
          name: response.blueprint.name,
          blueprint_type: response.blueprint.blueprint_type || 'custom',
          description: response.blueprint.description || '',
          nodes: response.blueprint.nodes || [],
          variables: response.blueprint.variables || [],
          generated_code: response.generated_code?.code || '',
          tags: [], is_active: false,
        });
        queryClient.invalidateQueries({ queryKey: ['engine-blueprints'] });
      }

      const assistantMsg = {
        role: 'assistant', content: response.message || 'Done.',
        actions_taken: actions, generated_code: response.generated_code, blueprint: response.blueprint,
      };
      setMessages(prev => [...prev, assistantMsg]);

      await base44.entities.EngineChatMessage.create({
        role: 'assistant', content: response.message || 'Done.',
        session_id: sessionId, actions_taken: actions, knowledge_used: response.knowledge_references || [],
      });
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err?.message || 'Something went wrong'}. Try again.`, actions_taken: [] }]);
    }
    setIsThinking(false);
  };

  // Voice: send on stop if there's a transcript
  const handleVoiceToggle = () => {
    if (voice.isListening) {
      voice.stopListening();
      // Send after a short delay to let final transcript settle
      setTimeout(() => {
        const finalText = voice.transcript || input;
        if (finalText.trim()) handleSend(finalText.trim());
      }, 300);
    } else {
      setInput('');
      voice.clearTranscript();
      voice.startListening();
    }
  };

  const currentModel = AI_MODELS.find(m => m.id === selectedModel);
  const gameRefCount = knowledgeEntries.filter(e => e.knowledge_domain === 'game_reference').length;
  const engineBuildCount = knowledgeEntries.filter(e => e.knowledge_domain === 'engine_building').length;
  const [showProviderConfig, setShowProviderConfig] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold text-xs">ENGINE AI</span>
          </div>
          <div className="flex items-center gap-1">
            {voice.isListening && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span className="text-red-300 text-[8px] font-bold">LIVE</span>
              </div>
            )}
            <Button size="icon" variant="ghost" onClick={() => setMessages([])} className="h-6 w-6 text-slate-500 hover:text-white">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Model Selector */}
        <div className="relative mb-2" ref={modelPickerRef}>
          <button
            onClick={() => setShowModelPicker(!showModelPicker)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all text-[10px] font-bold ${currentModel?.bg || 'bg-white/5 border-white/10'}`}
          >
            <div className="flex items-center gap-1.5">
              <Settings2 className={`w-3 h-3 ${currentModel?.color || 'text-white/60'}`} />
              <span className={currentModel?.color || 'text-white/60'}>{currentModel?.label || 'Auto'}</span>
              <span className="text-white/30 font-normal">— {currentModel?.description?.substring(0, 40)}</span>
            </div>
            <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showModelPicker && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
              >
                {AI_MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() => { setSelectedModel(model.id); setShowModelPicker(false); }}
                    className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-all hover:bg-white/5 ${selectedModel === model.id ? 'bg-white/5' : ''}`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${selectedModel === model.id ? 'bg-current' : 'bg-white/20'} ${model.color}`} />
                    <div>
                      <div className={`text-[11px] font-bold ${model.color}`}>{model.label}</div>
                      <div className="text-[9px] text-white/40">{model.description}</div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Provider indicator + config toggle */}
        <div className="flex items-center justify-between mb-2">
          <AIProviderConfig compact />
          <button onClick={() => setShowProviderConfig(!showProviderConfig)} className="text-[9px] text-slate-500 hover:text-white transition-colors">
            {showProviderConfig ? 'Hide Keys' : 'API Keys'}
          </button>
        </div>
        <AnimatePresence>
          {showProviderConfig && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-2">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 max-h-[300px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                <AIProviderConfig />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Knowledge Stats */}
        <div className="flex gap-1 flex-wrap">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
            <Gamepad2 className="w-2.5 h-2.5 text-orange-400" />
            <span className="text-orange-300 text-[8px]">{gameKnowledge.length} games</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">
            <BookOpen className="w-2.5 h-2.5 text-red-400" />
            <span className="text-red-300 text-[8px]">{gameRefCount} ref</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
            <Code2 className="w-2.5 h-2.5 text-cyan-400" />
            <span className="text-cyan-300 text-[8px]">{engineBuildCount} build</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
            <Zap className="w-2.5 h-2.5 text-purple-400" />
            <span className="text-purple-300 text-[8px]">{blueprints.length} bp</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3" style={{ scrollbarWidth: 'thin' }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-white" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                msg.role === 'user' ? 'bg-blue-600/20 border border-blue-500/30 text-white' : 'bg-slate-800/60 border border-slate-700 text-slate-200'
              }`}>
                <div className="text-[11px] leading-relaxed prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                {msg.actions_taken?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                    {msg.actions_taken.map((a, j) => (
                      <div key={j} className="flex items-center gap-1.5 text-[9px] text-emerald-400">
                        <Zap className="w-2.5 h-2.5" /><span>{a.description || a.type}</span>
                      </div>
                    ))}
                  </div>
                )}
                {msg.generated_code?.code && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1 text-[9px] text-cyan-400 mb-1"><Code2 className="w-2.5 h-2.5" /><span>{msg.generated_code.name || 'Generated Code'}</span></div>
                    <pre className="text-[9px] text-slate-400 font-mono bg-black/30 rounded p-2 max-h-[120px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>{msg.generated_code.code.substring(0, 1000)}</pre>
                  </div>
                )}
                {msg.blueprint?.name && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1.5 text-[9px] text-purple-400">
                      <Sparkles className="w-2.5 h-2.5" /><span>Blueprint: <strong>{msg.blueprint.name}</strong> ({msg.blueprint.blueprint_type})</span>
                    </div>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3 h-3 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isThinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
              <span className="text-[10px] text-slate-400">Building with {currentModel?.label}...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Voice Transcript Overlay */}
      <AnimatePresence>
        {voice.isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-3 mb-1 rounded-lg bg-red-500/5 border border-red-500/20 p-2"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-red-300 text-[9px] font-bold uppercase tracking-wider">Listening...</span>
            </div>
            <p className="text-white text-[11px] min-h-[18px]">
              {voice.transcript || voice.interimTranscript || <span className="text-white/30 italic">Speak now...</span>}
            </p>
            {voice.interimTranscript && (
              <p className="text-white/40 text-[10px] italic">{voice.interimTranscript}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <div className="p-3 border-t border-white/10">
        <div className="flex gap-1.5">
          {/* Voice Button */}
          {voice.isSupported && (
            <button
              onClick={handleVoiceToggle}
              disabled={isThinking}
              className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${
                voice.isListening
                  ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
              } ${isThinking ? 'opacity-30 cursor-not-allowed' : ''}`}
              title={voice.isListening ? 'Stop & Send' : 'Start Voice'}
            >
              {voice.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          {/* Text Input */}
          <input
            ref={inputRef}
            value={voice.isListening ? (voice.transcript + (voice.interimTranscript ? ' ' + voice.interimTranscript : '')) : input}
            onChange={(e) => { if (!voice.isListening) setInput(e.target.value); }}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={voice.isListening ? 'Listening...' : 'Tell me what to build...'}
            className={`flex-1 bg-slate-800/50 border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all ${
              voice.isListening ? 'border-red-500/30 bg-red-500/5' : 'border-slate-700 focus:border-cyan-500/50'
            }`}
            readOnly={voice.isListening}
          />

          {/* Send Button */}
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={isThinking || (!(input.trim()) && !voice.transcript)}
            className="h-9 w-9 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-30 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[8px] text-slate-600">
            {voice.isListening ? 'Tap mic to stop & send' : 'Voice or type • All knowledge banks active'}
          </p>
          <div className={`text-[8px] font-bold ${currentModel?.color || 'text-white/30'}`}>
            {currentModel?.label}
          </div>
        </div>
      </div>
    </div>
  );
}