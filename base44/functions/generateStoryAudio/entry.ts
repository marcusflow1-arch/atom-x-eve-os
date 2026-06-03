import "https://deno.land/x/xhr@0.1.0/mod.ts";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
// Using a more cost-effective voice and shorter text chunks
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Voice: Rachel

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!ELEVENLABS_API_KEY) {
    console.error("ElevenLabs API key not set.");
    return new Response(JSON.stringify({ error: "Audio generation is not configured." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Request body must include 'text'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Truncate text to reduce cost - take only first 500 characters for testing
    const truncatedText = text.length > 500 ? text.substring(0, 500) + "..." : text;

    console.log(`Generating audio for text length: ${truncatedText.length} characters`);

    const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text: truncatedText,
        model_id: "eleven_turbo_v2_5", // current low-latency model
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!elevenLabsResponse.ok) {
        const errorText = await elevenLabsResponse.text();
        console.error("ElevenLabs API Error:", errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { detail: { message: errorText } };
        }
        
        const errorMessage = errorData.detail?.message || errorData.error || "Failed to generate audio from ElevenLabs.";
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: elevenLabsResponse.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const audioData = await elevenLabsResponse.arrayBuffer();
    return new Response(audioData, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });

  } catch (error) {
    console.error("Error in generateStoryAudio function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});