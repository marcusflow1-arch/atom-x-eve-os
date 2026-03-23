import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { message, sessionId, useKnowledge, model } = await req.json();
    if (!message || !sessionId) {
      return Response.json({ error: 'message and sessionId required' }, { status: 400 });
    }

    // 1. Gather knowledge context if requested
    let knowledgeContext = '';
    let knowledgeIds = [];

    if (useKnowledge !== false) {
      // Search knowledge bank for relevant entries
      const allKnowledge = await base44.asServiceRole.entities.KnowledgeEntry.list('-created_date', 200);
      
      // Find relevant entries by matching keywords from the user message
      const msgLower = message.toLowerCase();
      const words = msgLower.split(/\s+/).filter(w => w.length > 3);
      
      const scored = allKnowledge.map(entry => {
        let score = 0;
        const searchable = `${entry.source_filename} ${entry.summary} ${(entry.tags || []).join(' ')}`.toLowerCase();
        for (const word of words) {
          if (searchable.includes(word)) score += 1;
        }
        if (entry.is_pinned) score += 3;
        return { entry, score };
      }).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);

      if (scored.length > 0) {
        knowledgeIds = scored.map(s => s.entry.id);
        knowledgeContext = scored.map(s => {
          const e = s.entry;
          return `--- KNOWLEDGE: ${e.source_filename} (${e.category}, domain: ${e.knowledge_domain}) ---
Summary: ${e.summary || ''}
Analysis: ${(e.full_analysis || '').substring(0, 3000)}
Code: ${(e.extracted_code || '').substring(0, 2000)}
---`;
        }).join('\n\n');
      }
    }

    // 2. Gather conversation history
    const history = await base44.asServiceRole.entities.InfraChat.filter(
      { session_id: sessionId }, 'created_date', 20
    );
    
    const conversationHistory = history.map(m => `${m.role}: ${m.content}`).join('\n\n');

    // 3. Build the system prompt
    const systemPrompt = `You are the INFRASTRUCTURE AI for the Atom×Eve game platform built on Base44.
You have deep knowledge of the entire project architecture, entities, pages, and components.

YOUR CAPABILITIES:
- Analyze and explain any part of the codebase or data
- Suggest UI changes, data modifications, architectural improvements
- Generate code snippets for React + Tailwind + Three.js + shadcn/ui
- Modify entity data directly when asked
- Reference knowledge bank entries for game development patterns

PLATFORM CONTEXT:
- Built on Base44 (React + Tailwind + shadcn/ui)
- Uses Three.js for 3D, framer-motion for animations
- Entities: Game, KnowledgeEntry, Model3D, AnimationFBX, EngineBlueprint, Achievement, etc.
- Key pages: LunaTemplate (dashboard), Store, Library, Engine, Community, Clan, Aura
- Components use @/api/base44Client for data, @tanstack/react-query for state

${knowledgeContext ? `\n--- YOUR KNOWLEDGE BANK (from analyzed files) ---\n${knowledgeContext}\n--- END KNOWLEDGE ---\n` : ''}

${conversationHistory ? `\n--- CONVERSATION SO FAR ---\n${conversationHistory}\n---\n` : ''}

When suggesting code changes, always provide the exact file path and code.
When modifying data, describe exactly what entities and fields to change.
Be specific, actionable, and reference the actual project structure.`;

    // 4. Call the LLM
    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\nUser: ${message}`,
      add_context_from_internet: true,
    });

    // 5. Detect if the AI suggested data actions and try to execute them
    const actions = [];
    
    // Auto-execute entity operations if the user asked for data changes
    const createMatch = response.match(/create\s+(?:a\s+)?new?\s+(\w+)\s+(?:entity|record)/i);
    const updateMatch = response.match(/update\s+(\w+)\s+(?:entity|record)\s+(?:with\s+id\s+)?(\w+)?/i);
    
    if (createMatch) {
      actions.push({ type: 'entity_create', target: createMatch[1], description: `Suggested creating ${createMatch[1]} record`, status: 'pending' });
    }
    if (updateMatch) {
      actions.push({ type: 'entity_update', target: updateMatch[1], description: `Suggested updating ${updateMatch[1]}`, status: 'pending' });
    }

    // 6. Save the assistant response
    const assistantMsg = await base44.asServiceRole.entities.InfraChat.create({
      role: 'assistant',
      content: response,
      session_id: sessionId,
      model_used: model || 'default',
      knowledge_context: knowledgeIds,
      actions_taken: actions,
    });

    return Response.json({
      reply: response,
      knowledge_used: knowledgeIds.length,
      actions,
      message_id: assistantMsg.id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});