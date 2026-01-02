import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Gather App Context
        // We fetch a bit of data to give the AIs context about what the app actually IS
        const [games, clans, streams, achievements] = await Promise.all([
            base44.entities.Game.list({ limit: 5 }),
            base44.entities.Division.list({ limit: 5 }),
            base44.entities.Stream.list({ limit: 5 }),
            base44.entities.Achievement.list({ limit: 5 })
        ]);

        const context = `
            You are an AI architect for the "Atom XE OS" web platform.
            
            Current Platform Context:
            - Platform Type: Web-based Gaming Desktop / OS Simulation
            - Key Games: ${games.map(g => g.title).join(', ') || 'None yet'}
            - Communities/Divisions: ${clans.map(c => c.name).join(', ') || 'None yet'}
            - Active Streams: ${streams.map(s => s.title).join(', ') || 'None yet'}
            - Sample Achievements: ${achievements.map(a => a.title).join(', ') || 'None yet'}
            
            Core Modules: Store, Library, Achievements, Blacksmith (Crafting), Community/Forums, AI Console, Trading Post, Profile.
            
            Goal: Generate innovative, feasible, and exciting feature ideas ("Ideals") to evolve the platform.
        `;

        const promptTemplate = (persona, focus) => `
            ${context}
            
            YOUR IDENTITY: ${persona}
            YOUR FOCUS: ${focus}
            
            Task: Generate 5 unique, high-quality feature ideas for Atom XE OS.
            Return a JSON object with a key "ideas" containing an array of objects, each with "title" and "description".
        `;

        // 2. Parallel Generation from 3 "Engines" using allSettled for robustness
        const results = await Promise.allSettled([
            base44.integrations.Core.InvokeLLM({
                prompt: promptTemplate("Gemini 3 Persona", "Data integration, multimodal interactions, ecosystem connectivity, and real-time adaptability."),
                response_json_schema: { type: "object", properties: { ideas: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } } } } } }
            }),
            base44.integrations.Core.InvokeLLM({
                prompt: promptTemplate("ChatGPT-5 Persona", "Creativity, gamification, social psychology, user engagement, and viral features."),
                response_json_schema: { type: "object", properties: { ideas: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } } } } } }
            }),
            base44.integrations.Core.InvokeLLM({
                prompt: promptTemplate("Claude 4.5 Persona", "Technical robustness, advanced utility, safety, code generation, and complex system architecture."),
                response_json_schema: { type: "object", properties: { ideas: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } } } } } }
            })
        ]);

        const getIdeas = (result) => (result.status === 'fulfilled' && result.value?.ideas) ? result.value.ideas : [];

        const geminiIdeas = getIdeas(results[0]);
        const chatgptIdeas = getIdeas(results[1]);
        const claudeIdeas = getIdeas(results[2]);

        // Fallback if all fail (unlikely, but robust)
        if (geminiIdeas.length === 0 && chatgptIdeas.length === 0 && claudeIdeas.length === 0) {
             return Response.json({ error: "Neural engines failed to synchronize. Please try again." }, { status: 503 });
        }

        // 3. Synthesis Phase
        const synthesisPrompt = `
            You are the "Atom XE Core Synthesis Engine".
            
            I have gathered ideas from three specialized AI sub-routines:
            
            [GEMINI 3 INPUT]: ${JSON.stringify(geminiIdeas)}
            [CHATGPT-5 INPUT]: ${JSON.stringify(chatgptIdeas)}
            [CLAUDE 4.5 INPUT]: ${JSON.stringify(claudeIdeas)}
            
            Your Task:
            1. Analyze all ideas for strength, feasibility, and "cool factor".
            2. Compare and associate related concepts.
            3. Synthesize the BEST 10-15 ideas into a finalized "Ideals" list.
            4. You can merge duplicates or improve ideas by combining aspects of multiple inputs.
            5. Assign an "origin" tag to each (e.g., "Gemini + Claude", "ChatGPT-5", "Synthesis").
            
            Return a JSON object with a key "unified_ideals" containing an array of objects with "title", "description", "origin", and "score" (1-100).
        `;

        const synthesisRes = await base44.integrations.Core.InvokeLLM({
            prompt: synthesisPrompt,
            response_json_schema: { 
                type: "object", 
                properties: { 
                    unified_ideals: { 
                        type: "array", 
                        items: { 
                            type: "object", 
                            properties: { 
                                title: { type: "string" }, 
                                description: { type: "string" }, 
                                origin: { type: "string" },
                                score: { type: "number" }
                            } 
                        } 
                    } 
                } 
            }
        });

        return Response.json({
            sources: {
                gemini: geminiIdeas,
                chatgpt: chatgptIdeas,
                claude: claudeIdeas
            },
            result: synthesisRes.unified_ideals || []
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});