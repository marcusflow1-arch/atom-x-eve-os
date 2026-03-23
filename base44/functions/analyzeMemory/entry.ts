import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { content, game_context } = await req.json();

        if (!content) {
            return Response.json({ error: 'Content is required' }, { status: 400 });
        }

        const prompt = `
        Analyze the following gaming memory/moment and provide structured insights.
        
        Memory Content: "${content}"
        Game Context: "${game_context || 'General Gaming'}"

        Please generate:
        1. Skill Upgrades: Suggest 1-3 specific skill upgrades or stat boosts based on the actions described (e.g., "Precision +2" for aiming).
        2. Summary: A catchy, one-sentence highlight reel summary.
        3. Narrative Elements: Identify any story arcs, character development, or recurring themes (e.g., "Underdog Victory", "Revenge Arc").

        Return the response as a JSON object with keys: "skill_upgrades" (array of strings), "summary" (string), "narrative_elements" (array of strings).
        `;

        const aiResponse = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    skill_upgrades: { type: "array", items: { type: "string" } },
                    summary: { type: "string" },
                    narrative_elements: { type: "array", items: { type: "string" } }
                },
                required: ["skill_upgrades", "summary", "narrative_elements"]
            }
        });

        return Response.json(aiResponse);

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});