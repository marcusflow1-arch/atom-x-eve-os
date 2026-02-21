/**
 * DirectorBridge — Persistent bridge between Director Chat / editors and Base44 chat.
 * 
 * This module continuously writes the latest editor state and Director Chat conversation
 * to localStorage so that Base44 chat (the main AI) always has full context about what
 * the user has been doing in the 3D Attachment Editor, Reactor Editor, etc.
 * 
 * How it works:
 * 1. Editors call DirectorBridge.updateEditorState(context, state) on every meaningful change
 * 2. Director Chat writes conversation + compiled summaries via writeHandoff()
 * 3. Base44 can call DirectorBridge.getFullContext() at any time to get EVERYTHING:
 *    - Live editor state (character, bones, objects, animations, transforms)
 *    - Full Director Chat conversation history
 *    - Any compiled task summaries
 * 4. This means when the user says "I did some work in the attachment editor",
 *    Base44 instantly knows every detail without the user copying anything.
 */

const LIVE_STATE_KEY = 'director_bridge_live_state';
const HANDOFF_KEY = 'director_chat_handoff';
const CHAT_PREFIX = 'director_chat_';

const DirectorBridge = {
  /**
   * Update the live editor state for a specific context (e.g. "3D Attachment Editor", "Reactor Editor")
   * Called continuously by the editors whenever state changes.
   */
  updateEditorState(context, state) {
    try {
      const existing = JSON.parse(localStorage.getItem(LIVE_STATE_KEY) || '{}');
      existing[context] = {
        ...state,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(LIVE_STATE_KEY, JSON.stringify(existing));
    } catch { /* ignore */ }
  },

  /**
   * Get the live editor state for all contexts or a specific one.
   */
  getEditorState(context) {
    try {
      const all = JSON.parse(localStorage.getItem(LIVE_STATE_KEY) || '{}');
      return context ? all[context] : all;
    } catch { return context ? null : {}; }
  },

  /**
   * Get the Director Chat conversation log for a specific context.
   */
  getChatLog(context) {
    try {
      const raw = localStorage.getItem(CHAT_PREFIX + context);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  /**
   * Get the latest handoff payload (compiled task summary + conversation + state).
   */
  getHandoff() {
    try {
      const raw = localStorage.getItem(HANDOFF_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  /**
   * Clear the handoff after it's been consumed.
   */
  clearHandoff() {
    try { localStorage.removeItem(HANDOFF_KEY); } catch {}
  },

  /**
   * Get EVERYTHING — all editor states, all chat logs, and any pending handoff.
   * This is what Base44 chat should call to get full context.
   */
  getFullContext() {
    const editorStates = this.getEditorState();
    const handoff = this.getHandoff();
    
    // Gather chat logs for all known contexts
    const chatLogs = {};
    const contexts = Object.keys(editorStates);
    // Also check common known contexts
    ['3D Attachment Editor', 'Reactor Editor', 'Engine'].forEach(ctx => {
      if (!contexts.includes(ctx)) contexts.push(ctx);
    });
    
    contexts.forEach(ctx => {
      const log = this.getChatLog(ctx);
      if (log.length > 0) chatLogs[ctx] = log;
    });

    return {
      editorStates,
      chatLogs,
      handoff,
      hasActiveWork: Object.keys(editorStates).length > 0 || Object.keys(chatLogs).length > 0,
      hasPendingHandoff: !!handoff,
    };
  },

  /**
   * Format the full context into a human-readable string for the AI.
   * This is the key function — it creates a message that Base44 can understand
   * as if it was there the whole time.
   */
  formatForAI() {
    const ctx = this.getFullContext();
    if (!ctx.hasActiveWork) return null;

    let parts = [];
    parts.push('=== DIRECTOR BRIDGE CONTEXT ===');
    parts.push('The user has been working in the following editors:\n');

    // Editor states
    for (const [name, state] of Object.entries(ctx.editorStates)) {
      parts.push(`📋 ${name} (last updated: ${state.lastUpdated || 'unknown'})`);
      const { lastUpdated, ...stateData } = state;
      parts.push(JSON.stringify(stateData, null, 2));
      parts.push('');
    }

    // Chat logs
    for (const [name, messages] of Object.entries(ctx.chatLogs)) {
      if (messages.length === 0) continue;
      parts.push(`💬 Director Chat Log — ${name} (${messages.length} messages):`);
      // Include last 20 messages to avoid token overflow
      const recent = messages.slice(-20);
      recent.forEach(m => {
        const role = m.role === 'user' ? 'USER' : 'ASSISTANT';
        parts.push(`  [${role}]: ${m.text}`);
      });
      parts.push('');
    }

    // Handoff
    if (ctx.handoff) {
      parts.push('🎯 PENDING TASK (compiled by Director Chat):');
      parts.push(ctx.handoff.compiledSummary || '(no summary)');
      parts.push('');
    }

    parts.push('=== END DIRECTOR BRIDGE CONTEXT ===');
    return parts.join('\n');
  },
};

export default DirectorBridge;