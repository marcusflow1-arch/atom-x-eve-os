import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Loader2, Brain, Trash2, Database, Globe, Sparkles, 
  Copy, Check, ChevronDown, Settings2, Zap 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '@/components/error/ErrorToast';
import ReactMarkdown from 'react-markdown';
import { infraChat } from '@/functions/infraChat';

const AI_MODELS = [
  { id: 'default', label: 'Auto (Best Available)', icon: Sparkles, color: 'text-cyan-400' },
  { id: 'opus-4.6', label: 'Opus 4.6', icon: Brain, color: 'text-purple-400' },
  { id: 'sonnet-4.5', label: 'Sonnet 4.5', icon: Zap, color: 'text-blue-400' },
  { id: 'gemini-3-pro', label: 'Gemini 3 Pro', icon: Globe, color: 'text-green-400' },
  { id: 'gpt-chatgpt', label: 'ChatGPT', icon: Sparkles, color: 'text-emerald-400' },
];

function ChatMessage({ msg }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
        isUser
          ? 'bg-indigo-600/30 border border-indigo-500/30 text-white'
          : 'bg-slate-800/60 border border-slate-700 text-slate-200'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            {!isUser && <Brain className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isUser ? 'You' : 'Infrastructure AI'}
            </span>
            {msg.model_used && !isUser && (
              <Badge className="text-[8px] bg-slate-700 text-slate-400">{msg.model_used}</Badge>
            )}
          </div>
          {!isUser && (
            <Button size="icon" variant="ghost" onClick={handleCopy} className="h-6 w-6 text-slate-500 hover:text-white">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
          {isUser ? (
            <p className="mb-0">{msg.content}</p>
          ) : (
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          )}
        </div>

        {/* Knowledge context */}
        {msg.knowledge_context?.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <Database className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] text-amber-400/70">{msg.knowledge_context.length} knowledge entries used</span>
          </div>
        )}

        {/* Actions taken */}
        {msg.actions_taken?.length > 0 && (
          <div className="mt-2 space-y-1">
            {msg.actions_taken.map((a, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[9px]">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-yellow-400/70">{a.description}</span>
                <Badge className={`text-[7px] ${
                  a.status === 'success' ? 'bg-green-500/20 text-green-400' :
                  a.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                  'bg-slate-700 text-slate-400'
                }`}>{a.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function InfrastructurePanel() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState('default');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [useKnowledge, setUseKnowledge] = useState(true);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const [sessionId] = useState(() => {
    const saved = localStorage.getItem('infra_session_id');
    if (saved) return saved;
    const id = 'infra_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('infra_session_id', id);
    return id;
  });

  // Fetch chat history
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['infra-chat', sessionId],
    queryFn: () => base44.entities.InfraChat.filter({ session_id: sessionId }, 'created_date', 100),
  });

  // Knowledge bank count
  const { data: knowledgeCount = [] } = useQuery({
    queryKey: ['knowledge-count'],
    queryFn: () => base44.entities.KnowledgeEntry.list('-created_date', 1),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput('');
    setSending(true);

    try {
      // Save user message
      await base44.entities.InfraChat.create({
        role: 'user',
        content: msg,
        session_id: sessionId,
      });
      queryClient.invalidateQueries({ queryKey: ['infra-chat', sessionId] });

      // Call backend
      const res = await infraChat({
        message: msg,
        sessionId,
        useKnowledge,
        model: selectedModel,
      });

      queryClient.invalidateQueries({ queryKey: ['infra-chat', sessionId] });
    } catch (err) {
      showError('AI failed: ' + (err?.message || 'Unknown error'));
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearSession = async () => {
    const newId = 'infra_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('infra_session_id', newId);
    window.location.reload();
  };

  const modelInfo = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">Infrastructure AI</h2>
            <p className="text-slate-500 text-[10px]">
              Connected to Knowledge Bank • Full project access • UI + Data changes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Knowledge toggle */}
          <button
            onClick={() => setUseKnowledge(!useKnowledge)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all border ${
              useKnowledge
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            <Database className="w-3 h-3" />
            Knowledge {useKnowledge ? 'ON' : 'OFF'}
          </button>

          {/* Model Picker */}
          <div className="relative">
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
            >
              <modelInfo.icon className={`w-3 h-3 ${modelInfo.color}`} />
              {modelInfo.label}
              <ChevronDown className="w-3 h-3" />
            </button>
            <AnimatePresence>
              {showModelPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute right-0 top-full mt-1 w-52 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden"
                >
                  {AI_MODELS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedModel(m.id); setShowModelPicker(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                        selectedModel === m.id ? 'bg-indigo-600/20 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                      {m.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Clear */}
          <Button size="sm" variant="ghost" onClick={clearSession} className="text-slate-500 hover:text-white h-7 text-[10px]">
            <Trash2 className="w-3 h-3 mr-1" /> New Session
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'thin' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/20 flex items-center justify-center mb-4">
              <Brain className="w-10 h-10 text-indigo-400/60" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Infrastructure AI Ready</h3>
            <p className="text-slate-500 text-sm max-w-md mb-6">
              Connected to your entire project. Ask me to analyze pages, modify data, suggest code changes, 
              or use the Knowledge Bank to build features based on analyzed game files.
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-md">
              {[
                'Show me all entities and their record counts',
                'Analyze the Store page architecture',
                'What game development patterns are in my Knowledge Bank?',
                'Suggest improvements to the 3D Engine page',
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  className="text-left p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-[11px] text-slate-400 hover:text-white hover:border-indigo-500/30 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <ChatMessage key={msg.id} msg={msg} />
            ))}
            {sending && (
              <div className="flex justify-start mb-3">
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span className="text-slate-400 text-sm">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-800 p-4 bg-slate-900/80">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your project, request changes, or query the Knowledge Bank..."
            className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-auto px-4 self-end"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex items-center gap-3 mt-2 text-[9px] text-slate-600">
          <span>Model: <span className={modelInfo.color}>{modelInfo.label}</span></span>
          <span>•</span>
          <span>Knowledge: {useKnowledge ? '✓ Enabled' : '✗ Disabled'}</span>
          <span>•</span>
          <span>Session: {messages.length} messages</span>
        </div>
      </div>
    </section>
  );
}