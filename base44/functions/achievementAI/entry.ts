import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { action, achievement, game } = await req.json();
    if (!action || !achievement) return Response.json({ error: 'Missing required parameters' }, { status: 400 });

    if (action === 'get_tips') {
      const prompt = `You are an expert gaming assistant. Provide personalized tips and strategies for unlocking this achievement. Achievement: ${achievement.title}. Description: ${achievement.description}. Game: ${game || achievement.game}. Also suggest dynamic difficulty adjustments if the player is struggling. Return JSON with strategy, difficulty_adjustment, and quick_tips.`;
      return Response.json(await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: { type: 'object', properties: { strategy: { type: 'string' }, difficulty_adjustment: { type: 'string' }, quick_tips: { type: 'array', items: { type: 'string' } } }, required: ['strategy', 'difficulty_adjustment', 'quick_tips'] } }));
    }

    if (action === 'get_voice_guide') {
      if (!ELEVENLABS_API_KEY) return Response.json({ error: 'ElevenLabs API key not set' }, { status: 500 });
      const scriptResponse = await base44.integrations.Core.InvokeLLM({ prompt: `Write a short, engaging, 3-sentence voice script guiding a player on how to unlock this achievement: "${achievement.title}: ${achievement.description}" in the game "${game || achievement.game}". Keep it encouraging and tactical.` });
      const text = typeof scriptResponse === 'string' ? scriptResponse : JSON.stringify(scriptResponse);
      const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'xi-api-key': ELEVENLABS_API_KEY, 'Accept': 'audio/mpeg' }, body: JSON.stringify({ text, model_id: 'eleven_monolingual_v1', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }) });
      if (!elevenLabsResponse.ok) throw new Error(`ElevenLabs error: ${await elevenLabsResponse.text()}`);
      return new Response(await elevenLabsResponse.arrayBuffer(), { headers: { 'Content-Type': 'audio/mpeg' } });
    }

    // Achievement ownership can no longer be minted by this AI helper.
    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('achievementAI error:', error);
    return Response.json({ error: error?.message || 'Achievement AI failed' }, { status: 500 });
  }
});
