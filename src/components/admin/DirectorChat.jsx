import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, Image, Loader2, X, CheckCircle2, 
  Clipboard, ChevronDown, ChevronUp, Camera, Sparkles, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const FINALIZE_KEYWORDS = ['finalize', 'done', 'commit', 'execute', 'go ahead', 'that\'s everything', 'that is everything', 'ok done', 'okay done'];

/**
 * DirectorChat — An embedded AI chat for the Reactor Editor / Attachment Editor / Engine.
 * 
 * Workflow:
 * 1. User chats and sends screenshots describing what they want (FX placement, timelines, bone attachments, etc.)
 * 2. AI analyzes screenshots + text to understand the request
 * 3. When user says "finalize" / "done", the AI compiles a task summary
 * 4. User confirms → the compiled instructions are dispatched as a global event for the main Base44 chat to pick up
 * 
 * Props:
 *  - context: string — describes what editor this chat is embedded in (e.g. "Reactor Editor", "Attachment Editor")
 *  - editorState: object — current state snapshot from the editor (selected model, bone, animation, time, etc.)
 *  - onTaskCompiled: (taskSummary: string) => void — called when the user confirms the compiled task
 */
const STORAGE_KEY_PREFIX = 'director_chat_';

function loadPersistedMessages(context) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + context);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistMessages(context, messages) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + context, JSON.stringify(messages));
  } catch { /* storage full — ignore */ }
}

export default function DirectorChat({ context = 'Editor', editorState = {}, onTaskCompiled }) {
  const [messages, setMessages] = useState(() => loadPersistedMessages(context));
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [attachedImages, setAttachedImages] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [compiledTask, setCompiledTask] = useState(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Persist messages whenever they change
  useEffect(() => {
    persistMessages(context, messages);
  }, [messages, context]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Upload a screenshot
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachedImages(prev => [...prev, file_url]);
    } catch (err) {
      console.error('Screenshot upload failed:', err);
    }
    // Reset the input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (idx) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== idx));
  };

  // Check if user message is a finalize command
  const isFinalizeCommand = (text) => {
    const lower = text.toLowerCase().trim();
    return FINALIZE_KEYWORDS.some(kw => lower.includes(kw));
  };

  // Build conversation history for the LLM
  const buildPromptHistory = (msgs) => {
    return msgs.map(m => `[${m.role === 'user' ? 'USER' : 'ASSISTANT'}]: ${m.text}`).join('\n');
  };

  // Send a message
  const handleSend = async () => {
    const text = input.trim();
    if (!text && attachedImages.length === 0) return;

    const userMsg = {
      role: 'user',
      text: text || '(screenshot attached)',
      images: [...attachedImages],
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentImages = [...attachedImages];
    setAttachedImages([]);
    setIsThinking(true);

    try {
      // Check if this is a finalize command
      if (isFinalizeCommand(text)) {
        // Compile all conversation into a task summary
        const fullHistory = buildPromptHistory([...messages, userMsg]);
        const stateJson = JSON.stringify(editorState, null, 2);

        const compileResult = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a 3D game engine director assistant embedded in the "${context}".

The user has been describing what they want through chat messages and screenshots. They have now said "${text}" which means they want you to compile everything into a clear, actionable task summary.

CONVERSATION HISTORY:
${fullHistory}

CURRENT EDITOR STATE:
${stateJson}

INSTRUCTIONS:
1. Compile ALL the user's requests from the conversation into a single, structured task summary.
2. Include specific details: bone names, animation times, positions, rotations, effect types, damage values, etc.
3. Reference any screenshots they sent and what they showed.
4. Format it as a clear set of numbered action items that can be executed.
5. Start with "TASK SUMMARY FOR ${context.toUpperCase()}:" and list each action.
6. Be precise — include exact values, bone names, time codes, etc.
7. End with "READY TO EXECUTE" on its own line.`,
          file_urls: currentImages.length > 0 ? currentImages : undefined,
          response_json_schema: {
            type: 'object',
            properties: {
              task_summary: { type: 'string' },
              action_count: { type: 'number' },
              requires_screenshot_analysis: { type: 'boolean' },
            }
          }
        });

        const summary = compileResult.task_summary || 'Could not compile task summary.';
        setCompiledTask(summary);
        setAwaitingConfirmation(true);

        setMessages(prev => [...prev, {
          role: 'assistant',
          text: `I've compiled your instructions:\n\n${summary}\n\n**Ready to send to Base44 for execution.** Should I proceed? (Say "yes" to confirm)`,
          timestamp: new Date().toISOString(),
          isCompiled: true,
        }]);
      } else if (awaitingConfirmation && ['yes', 'confirm', 'proceed', 'go', 'do it', 'yes continue', 'continue'].some(kw => text.toLowerCase().includes(kw))) {
        // User confirmed — dispatch the compiled task
        if (compiledTask && onTaskCompiled) {
          onTaskCompiled(compiledTask);
        }
        
        // Also dispatch global event for main chat
        window.dispatchEvent(new CustomEvent('directorTaskReady', {
          detail: {
            context,
            task: compiledTask,
            editorState,
            timestamp: new Date().toISOString(),
          }
        }));

        setMessages(prev => [...prev, {
          role: 'assistant',
          text: '✅ Task sent to Base44 chat for execution. You can review and approve the actions there.',
          timestamp: new Date().toISOString(),
        }]);
        setAwaitingConfirmation(false);
        setCompiledTask(null);
      } else {
        // Normal conversation — analyze screenshots and respond
        const history = buildPromptHistory(messages.slice(-10)); // Last 10 messages for context
        const stateJson = JSON.stringify(editorState, null, 2);

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a 3D game engine director assistant embedded in the "${context}".
You help the user place effects, position objects, set animation timings, configure damage reactors, and manage 3D attachments.

CURRENT EDITOR STATE:
${stateJson}

RECENT CONVERSATION:
${history}

USER'S NEW MESSAGE: ${text || '(sent a screenshot for you to analyze)'}

${currentImages.length > 0 ? `The user attached ${currentImages.length} screenshot(s). Analyze what you see in the viewport/timeline and describe:
- What 3D models/characters are visible
- The current animation frame/time
- Where objects or effects are positioned
- Any bone highlights or selected elements
- What the user likely wants based on the screenshot + their message` : ''}

Respond helpfully. If the user is describing placement, acknowledge what they want and ask clarifying questions if needed.
When they're ready to finalize, they'll say "done" or "finalize" and you'll compile everything.
Keep responses concise but specific. Reference actual bone names, time codes, and positions when possible.`,
          file_urls: currentImages.length > 0 ? currentImages : undefined,
        });

        setMessages(prev => [...prev, {
          role: 'assistant',
          text: typeof result === 'string' ? result : (result.response || result.text || JSON.stringify(result)),
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (err) {
      console.error('Director chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Sorry, I had trouble processing that. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true,
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-600/30 transition-all"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Director Chat
        {messages.length > 0 && (
          <span className="w-5 h-5 rounded-full bg-cyan-500 text-white text-[9px] flex items-center justify-center">{messages.length}</span>
        )}
        <ChevronUp className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full border-l border-white/10" style={{ 
      background: 'rgba(8, 12, 20, 0.95)', 
      backdropFilter: 'blur(20px)',
      minWidth: 280,
      maxWidth: 320,
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-[11px]">Director Chat</h3>
            <p className="text-white/30 text-[8px]">{context}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(true)} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setMessages([]); setCompiledTask(null); setAwaitingConfirmation(false); persistMessages(context, []); }} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-white/10" title="Clear chat">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Intro hint */}
      {messages.length === 0 && (
        <div className="px-3 py-4 text-center">
          <Sparkles className="w-8 h-8 text-cyan-500/40 mx-auto mb-2" />
          <p className="text-white/50 text-[11px] leading-relaxed">
            Describe what you want: send screenshots, explain placements, timings, and effects.
            When ready, say <strong className="text-cyan-400">"done"</strong> or <strong className="text-cyan-400">"finalize"</strong> to compile.
          </p>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-2 space-y-2" style={{ scrollbarWidth: 'thin' }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[90%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-cyan-600/20 text-cyan-100 border border-cyan-500/20'
                  : msg.isCompiled
                    ? 'bg-green-600/10 text-green-200 border border-green-500/20'
                    : msg.isError
                      ? 'bg-red-600/10 text-red-300 border border-red-500/20'
                      : 'bg-white/5 text-slate-300 border border-white/5'
              }`}>
                {/* Attached images */}
                {msg.images?.length > 0 && (
                  <div className="flex gap-1 mb-1.5 flex-wrap">
                    {msg.images.map((url, j) => (
                      <img key={j} src={url} alt="Screenshot" className="w-16 h-12 object-cover rounded border border-white/10" />
                    ))}
                  </div>
                )}
                {msg.isCompiled && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 inline mr-1" />}
                <span className="whitespace-pre-wrap">{msg.text}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
              <span className="text-[10px] text-white/40">Analyzing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Attached images preview */}
      {attachedImages.length > 0 && (
        <div className="flex gap-1.5 px-3 py-1.5 border-t border-white/5 flex-wrap">
          {attachedImages.map((url, i) => (
            <div key={i} className="relative group">
              <img src={url} alt="" className="w-12 h-10 object-cover rounded border border-white/10" />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation bar */}
      {awaitingConfirmation && (
        <div className="px-3 py-2 bg-green-600/10 border-t border-green-500/20 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
          <span className="text-green-300 text-[10px] flex-1">Task compiled. Say "yes" to send to Base44.</span>
          <button
            onClick={() => { setAwaitingConfirmation(false); setCompiledTask(null); }}
            className="text-[9px] text-red-400 hover:text-red-300"
          >Cancel</button>
        </div>
      )}

      {/* Input */}
      <div className="px-2 py-2 border-t border-white/10 flex-shrink-0">
        <div className="flex items-end gap-1.5">
          {/* Screenshot button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-cyan-400 transition-colors flex-shrink-0"
            title="Attach screenshot"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Text input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/20 resize-none outline-none focus:border-cyan-500/30"
            rows={1}
            style={{ minHeight: 32, maxHeight: 80 }}
          />

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={isThinking || (!input.trim() && attachedImages.length === 0)}
            className="w-8 h-8 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}