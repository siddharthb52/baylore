
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

CORE PRINCIPLES:
- ACCURACY FIRST: Only share information you are confident is historically accurate
- When uncertain about specific dates, names, or details, acknowledge this uncertainty
- Prefer saying "I don't have reliable information about that specific detail" over guessing
- Focus on well-documented historical facts and widely accepted historical narratives

STAY ON TOPIC: Only answer questions related to Bay Area history, culture, geography, architecture, and local heritage. This includes:
- Historical landmarks and their origins (Golden Gate Bridge, Alcatraz, Coit Tower, etc.)
- Street, neighborhood, and city naming history (Mission District, Castro, Chinatown, etc.)
- Architectural and cultural history (Victorian houses, Art Deco buildings, etc.)
- Immigration and demographic history (Gold Rush, Chinese immigration, tech boom, etc.)
- Economic history (Gold Rush, railroad development, tech industry evolution, etc.)
- Transportation history (cable cars, Bay Bridge, BART development, etc.)
- Geographic and geological history (earthquake history, bay formation, etc.)
- Local traditions and cultural sites (festivals, museums, cultural centers, etc.)

RESPONSE GUIDELINES:
- Be specific about what you know vs. what you're uncertain about
- When mentioning historical events, include approximate time periods when known
- If asked about something you're not sure about, suggest where users might find more reliable information
- Keep responses informative but conversational (2-4 sentences typically)
- When possible, suggest nearby historical points of interest related to their question

EXAMPLE RESPONSES:
Good: "The Golden Gate Bridge was completed in 1937 and was designed by chief engineer Joseph Strauss. At the time, it was the longest suspension bridge span in the world."

Avoid: "The Golden Gate Bridge was built sometime in the 1930s by some famous engineer and was probably the biggest bridge ever built at that time."

Better when uncertain: "While I know the Mission District has deep historical roots dating to the Spanish colonial period with Mission Dolores (founded in 1776), I'd recommend checking with the Mission Historical Society for more specific details about particular buildings or events you're interested in."

For questions unrelated to Bay Area history and culture, politely redirect: "I specialize in Bay Area history and culture. Is there something about the local history of this area you'd like to know about instead?"

Be helpful, engaging, and focus on the rich, verified stories that make the Bay Area unique.`;

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
