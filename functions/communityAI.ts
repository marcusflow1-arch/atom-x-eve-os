import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const base44 = createClientFromRequest(req);
        const { action, data } = await req.json();

        if (!action) {
            return Response.json({ error: "Missing action" }, { status: 400, headers: corsHeaders });
        }

        if (action === 'generate_achievement_post') {
            const { achievement, game, user_name } = data;
            
            const prompt = `
                Generate an exciting and engaging social media style post for a gamer who just unlocked an achievement.
                
                User: ${user_name}
                Game: ${game}
                Achievement: ${achievement.title}
                Description: ${achievement.description}
                Rarity: ${achievement.rarity}
                
                The post should be celebratory, mention the difficulty if it's high rarity, and encourage friends to try it.
                Keep it under 280 characters. Add relevant emojis.
            `;

            const content = await base44.integrations.Core.InvokeLLM({
                prompt: prompt
            });

            return Response.json({ content }, { headers: corsHeaders });
        }

        if (action === 'moderate_content') {
            const { text } = data;
            const prompt = `
                Analyze the following text for toxicity, hate speech, or harassment.
                Text: "${text}"
                
                Return a JSON object with:
                - "is_safe": boolean
                - "reason": string (if unsafe)
            `;

            const response = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        is_safe: { type: "boolean" },
                        reason: { type: "string" }
                    },
                    required: ["is_safe"]
                }
            });

            return Response.json(response, { headers: corsHeaders });
        }

        if (action === 'get_trending_topics') {
            // In a real app, this would analyze recent posts from the DB.
            // For now, we'll generate trending topics based on a "current gaming trends" simulation or recent mock data.
            const prompt = `
                Generate 5 trending gaming topics or hashtags for a community feed.
                Return a JSON object with "trends": array of strings.
            `;
             const response = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        trends: { type: "array", items: { type: "string" } }
                    }
                }
            });
            return Response.json(response, { headers: corsHeaders });
        }

        return Response.json({ error: "Invalid action" }, { status: 400, headers: corsHeaders });

    } catch (error) {
        console.error("Error in communityAI:", error);
        return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
});