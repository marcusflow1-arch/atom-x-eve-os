import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Loader2, Bot, User, Sparkles, Brain, Gamepad2, BookOpen,
  Box, Lightbulb, Code2, Zap, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';

/**
 * This is the core AI integration panel. It gives ME (Base44 AI) direct access
 * to the 3D scene, all knowledge banks, and blueprint system so I can build
 * things when you ask me to — using everything I've learned.
 */

function buildKnowledgeContext(gameKnowledge, knowledgeEntries, maxTokens = 8000) {
  let ctx = '';
  let budget = maxTokens;

  // 1. Game reference knowledge (how games are built)
  const gameRef = knowledgeEntries.filter(e => e.knowledge_domain === 'game_reference');
  const engineBuild = knowledgeEntries.filter(e => e.knowledge_domain === 'engine_building');
  const general = knowledgeEntries.filter(e => !e.knowledge_domain || e.knowledge_domain === 'general');

  // Pinned entries first
  const pinned = knowledgeEntries.filter(e => e.is_pinned);

  if (gameKnowledge.length > 0) {
    ctx += `\n=== GAME REFERENCE KNOWLEDGE (${gameKnowledge.length} games studied) ===\n`;
    for (const g of gameKnowledge.slice(0, 5)) {
      const block = `GAME: ${g.game_name} | Tech: ${g.tech_stack?.join(', ') || 'unknown'}\nArchitecture: ${g.architecture_summary?.substring(0, 600) || 'N/A'}\nGameplay Systems: ${g.gameplay_systems?.substring(0, 400) || 'N/A'}\nSystems Map: ${g.systems_map?.substring(0, 400) || 'N/A'}\n\n`;
      if (budget - block.length < 0) break;
      ctx += block;
      budget -= block.length;
    }
  }

  if (pinned.length > 0) {
    ctx += `\n=== PINNED KNOWLEDGE (${pinned.length} entries) ===\n`;
    for (const e of pinned.slice(0, 10)) {
      const block = `[${e.category}] ${e.source_filename}: ${e.summary?.substring(0, 300) || ''}\n`;
      if (budget - block.length < 0) break;
      ctx += block;
      budget -= block.length;
    }
  }

  if (engineBuild.length > 0) {
    ctx += `\n=== ENGINE BUILDING KNOWLEDGE (${engineBuild.length} entries) ===\n`;
    for (const e of engineBuild.slice(0, 15)) {
      const block = `[${e.category}] ${e.source_filename}: ${e.summary?.substring(0, 200) || ''}\n`;
      if (budget - block.length < 0) break;
      ctx += block;
      budget -= block.length;
    }
  }

  if (gameRef.length > 0) {
    ctx += `\n=== GAME REFERENCE FILES (${gameRef.length} entries) ===\n`;
    for (const e of gameRef.slice(0, 15)) {
      const block = `[${e.category}] ${e.source_filename}: ${e.summary?.substring(0, 200) || ''}\n`;
      if (budget - block.length < 0) break;
      ctx += block;
      budget -= block.length;
    }
  }

  if (general.length > 0 && budget > 500) {
    ctx += `\n=== GENERAL KNOWLEDGE (${general.length} entries) ===\n`;
    for (const e of general.slice(0, 10)) {
      const block = `[${e.category}] ${e.source_filename}: ${e.summary?.substring(0, 150) || ''}\n`;
      if (budget - block.length < 0) break;
      ctx += block;
      budget -= block.length;
    }
  }

  return ctx;
}

export default function EngineAIChat({ sceneApi }) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId] = useState(() => 'session_' + Date.now());
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

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

  // Load previous session messages
  const { data: savedMessages = [] } = useQuery({
    queryKey: ['engine-chat', sessionId],
    queryFn: () => base44.entities.EngineChatMessage.filter({ session_id: sessionId }, '-created_date', 50),
    enabled: false, // Only load manually
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `I'm integrated into the Engine now. I have access to your 3D scene, all ${knowledgeEntries.length} knowledge entries, ${gameKnowledge.length} studied games, and ${blueprints.length} blueprints.\n\nTell me what to build. I'll use everything I've learned to construct it — objects, systems, blueprints, entire environments. I can:\n\n• **Add objects** to the 3D scene (primitives, models)\n• **Create blueprints** (Unreal-style visual logic)\n• **Generate Three.js code** from knowledge patterns\n• **Reference game architectures** I've studied\n• **Build systems** (combat, movement, AI behavior)\n\nWhat do you want me to build?`,
        actions_taken: [],
      }]);
    }
  }, [knowledgeEntries.length, gameKnowledge.length, blueprints.length]);

  const executeSceneAction = useCallback((action) => {
    if (!sceneApi) return;
    switch (action.type) {
      case 'add_primitive':
        sceneApi.addPrimitive(action.data?.shape || 'cube');
        break;
      case 'add_model':
        if (action.data?.url) sceneApi.addModel(action.data.url);
        break;
      default:
        break;
    }
  }, [sceneApi]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isThinking) return;

    const userMsg = { role: 'user', content: text, actions_taken: [] };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      // Save user message
      await base44.entities.EngineChatMessage.create({
        role: 'user', content: text, session_id: sessionId, actions_taken: [], knowledge_used: [],
      });

      // Build knowledge context
      const knowledgeCtx = buildKnowledgeContext(gameKnowledge, knowledgeEntries);

      // Build scene context
      let sceneCtx = 'Scene: 3D viewport with Three.js. ';
      if (sceneApi?.scene) {
        const objects = [];
        sceneApi.scene.traverse(child => {
          if (child.isMesh && child.name !== 'ground') {
            objects.push(`${child.name} at (${child.position.x.toFixed(1)}, ${child.position.y.toFixed(1)}, ${child.position.z.toFixed(1)})`);
          }
        });
        sceneCtx += `Objects in scene: ${objects.length > 0 ? objects.join(', ') : 'StarterCube only'}. `;
      }

      // Build blueprint context
      let bpCtx = '';
      if (blueprints.length > 0) {
        bpCtx = `\nExisting Blueprints: ${blueprints.map(b => `${b.name} (${b.blueprint_type})`).join(', ')}`;
      }

      // Conversation history
      const historyForPrompt = messages.slice(-10).map(m => `${m.role === 'user' ? 'USER' : 'ENGINE AI'}: ${m.content.substring(0, 500)}`).join('\n');

      const prompt = `You are the ATOM×EVE Engine AI — you are INTEGRATED into a 3D game engine built with Three.js + React. You ARE the engine's intelligence. You have direct access to the 3D scene and can manipulate it.

YOUR CAPABILITIES:
- Add 3D objects to the scene (primitives: cube, sphere, cylinder, plane)
- Create Unreal-style Blueprints (visual scripting nodes stored in DB)
- Generate Three.js JavaScript code for any game system
- Reference ALL knowledge you've learned from uploaded game projects
- Build complete game systems: combat, AI, movement, inventory, etc.

CURRENT STATE:
${sceneCtx}
${bpCtx}

KNOWLEDGE BANKS (separated by domain):
${knowledgeCtx}

CONVERSATION:
${historyForPrompt}
USER: ${text}

RESPONSE FORMAT:
You must respond with a JSON object (ALWAYS valid JSON):
{
  "message": "Your conversational response explaining what you're doing/built",
  "actions": [
    {
      "type": "add_primitive",
      "description": "Added a cube to the scene",
      "data": { "shape": "cube" }
    }
  ],
  "blueprint": null,
  "generated_code": null,
  "knowledge_references": []
}

ACTION TYPES:
- "add_primitive": { shape: "cube"|"sphere"|"cylinder"|"plane" }
- "add_model": { url: "model_url" }
- "create_blueprint": { name, blueprint_type, description, nodes, variables }
- "generate_code": { name, code, description }
- "modify_scene": { description }

If the user asks you to build something complex, break it down. Create blueprints, generate code, add objects. Use your game knowledge to inform HOW you build things — reference real patterns from games you've studied.

If user asks about something you don't have knowledge for yet, say so and suggest what files/games to upload to learn.

ALWAYS respond with valid JSON. The "message" field is what gets displayed to the user.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            actions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  description: { type: 'string' },
                  data: { type: 'object' }
                }
              }
            },
            blueprint: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                blueprint_type: { type: 'string' },
                description: { type: 'string' },
                nodes: { type: 'array', items: { type: 'object' } },
                variables: { type: 'array', items: { type: 'object' } }
              }
            },
            generated_code: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                code: { type: 'string' },
                description: { type: 'string' }
              }
            },
            knowledge_references: { type: 'array', items: { type: 'string' } }
          },
          required: ['message']
        }
      });

      // Execute scene actions
      const actions = response.actions || [];
      for (const action of actions) {
        executeSceneAction(action);
      }

      // Create blueprint if requested
      if (response.blueprint?.name) {
        await base44.entities.EngineBlueprint.create({
          name: response.blueprint.name,
          blueprint_type: response.blueprint.blueprint_type || 'custom',
          description: response.blueprint.description || '',
          nodes: response.blueprint.nodes || [],
          variables: response.blueprint.variables || [],
          generated_code: response.generated_code?.code || '',
          tags: [],
          is_active: false,
        });
        queryClient.invalidateQueries({ queryKey: ['engine-blueprints'] });
      }

      const assistantMsg = {
        role: 'assistant',
        content: response.message || 'Done.',
        actions_taken: actions,
        generated_code: response.generated_code,
        blueprint: response.blueprint,
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Save assistant message
      await base44.entities.EngineChatMessage.create({
        role: 'assistant',
        content: response.message || 'Done.',
        session_id: sessionId,
        actions_taken: actions,
        knowledge_used: response.knowledge_references || [],
      });

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err?.message || 'Something went wrong'}. Try again.`,
        actions_taken: [],
      }]);
    }

    setIsThinking(false);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const gameRefCount = knowledgeEntries.filter(e => e.knowledge_domain === 'game_reference').length;
  const engineBuildCount = knowledgeEntries.filter(e => e.knowledge_domain === 'engine_building').length;

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
          <Button size="icon" variant="ghost" onClick={clearChat} className="h-6 w-6 text-slate-500 hover:text-white">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

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
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-white" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-blue-600/20 border border-blue-500/30 text-white'
                  : 'bg-slate-800/60 border border-slate-700 text-slate-200'
              }`}>
                <div className="text-[11px] leading-relaxed prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {/* Show actions taken */}
                {msg.actions_taken?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                    {msg.actions_taken.map((a, j) => (
                      <div key={j} className="flex items-center gap-1.5 text-[9px] text-emerald-400">
                        <Zap className="w-2.5 h-2.5" />
                        <span>{a.description || a.type}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Show generated code */}
                {msg.generated_code?.code && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1 text-[9px] text-cyan-400 mb-1">
                      <Code2 className="w-2.5 h-2.5" />
                      <span>{msg.generated_code.name || 'Generated Code'}</span>
                    </div>
                    <pre className="text-[9px] text-slate-400 font-mono bg-black/30 rounded p-2 max-h-[120px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                      {msg.generated_code.code.substring(0, 1000)}
                    </pre>
                  </div>
                )}

                {/* Show blueprint created */}
                {msg.blueprint?.name && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1.5 text-[9px] text-purple-400">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Blueprint created: <strong>{msg.blueprint.name}</strong> ({msg.blueprint.blueprint_type})</span>
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
              <span className="text-[10px] text-slate-400">Building...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Tell me what to build..."
            className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="h-9 w-9 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-30"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-[8px] text-slate-600 mt-1.5 text-center">
          I use all knowledge banks + game studies to inform my builds
        </p>
      </div>
    </div>
  );
}