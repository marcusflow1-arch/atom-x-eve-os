import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { prompt } = await req.json();
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Generate diverse image prompts using LLM
        const llmResponse = await base44.integrations.Core.InvokeLLM({
            prompt: `
                User wants UI designs for: "${prompt}".
                Generate 4 distinct, detailed image generation prompts for high-quality UI/UX designs.
                Each prompt should represent a different style or approach.
                
                Return a JSON object with an array "prompts" where each item is an object: { "source": "Model Name (e.g. ChatGPT-5, Gemini 3, Claude 4.5)", "image_prompt": "The detailed prompt string" }.
                Include varied sources like "ChatGPT-5", "Gemini 3", "Claude 4.5", "Atom AI".
            `,
            response_json_schema: {
                type: "object",
                properties: {
                    prompts: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                source: { type: "string" },
                                image_prompt: { type: "string" }
                            },
                            required: ["source", "image_prompt"]
                        }
                    }
                },
                required: ["prompts"]
            }
        });

        const prompts = llmResponse.prompts;

        // 2. Generate images in parallel
        // Note: Generating many images might be slow. We limit to 4 for performance.
        const imagePromises = prompts.map(async (p) => {
            try {
                const imgRes = await base44.integrations.Core.GenerateImage({
                    prompt: `Professional UI design, ${p.image_prompt}, high fidelity, dribbble style, 4k`
                });
                return {
                    source: p.source,
                    description: p.image_prompt,
                    url: imgRes.url
                };
            } catch (e) {
                console.error(`Failed to generate image for ${p.source}:`, e);
                return null;
            }
        });

        const results = await Promise.all(imagePromises);
        const validResults = results.filter(r => r !== null);

        return Response.json({ designs: validResults });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});