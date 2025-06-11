
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, currentLocation } = await req.json();

    // Build context based on location if provided
    let locationContext = "";
    if (currentLocation) {
      locationContext = `The user is currently near coordinates ${currentLocation.lat}, ${currentLocation.lng} in the San Francisco Bay Area. `;
    }

    const systemPrompt = `You are BayLore, an AI guide specializing in San Francisco Bay Area history and culture. You help users discover the historical significance of locations, landmarks, streets, neighborhoods, and cultural sites throughout the Bay Area.

${locationContext}

STAY ON TOPIC: Only answer questions related to Bay Area history, culture, geography, architecture, and local heritage. This includes:
- Historical landmarks and their origins
- Street, neighborhood, and city naming history
- Architectural and cultural history
- Immigration and demographic history
- Economic history (Gold Rush, tech development, etc.)
- Transportation history (cable cars, bridges, BART, etc.)
- Geographic and geological history
- Local traditions and cultural sites

For questions unrelated to Bay Area history and culture, politely redirect users back to relevant topics. Keep responses informative but conversational, and when possible, suggest nearby historical points of interest.

Be helpful, engaging, and focus on the rich stories that make the Bay Area unique.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response generated successfully');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in bay-area-chat function:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate response' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
