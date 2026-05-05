
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ChatRole = 'user' | 'assistant';

interface ChatContextMessage {
  role?: string;
  content?: string;
}

interface LandmarkContext {
  title?: string;
  latitude?: number;
  longitude?: number;
  summary?: string;
  category?: string;
  year_built?: number | null;
  architect?: string | null;
  historical_significance?: string | null;
  fun_facts?: string[] | null;
  website_url?: string | null;
}

interface LocationContext {
  lat?: number;
  lng?: number;
}

const sanitizeConversationHistory = (conversationHistory: unknown): Array<{ role: ChatRole; content: string }> => {
  if (!Array.isArray(conversationHistory)) return [];

  return conversationHistory
    .slice(-10)
    .map((message: ChatContextMessage) => {
      const role = message.role === 'assistant' ? 'assistant' : message.role === 'user' ? 'user' : null;
      const content = typeof message.content === 'string' ? message.content.trim() : '';

      if (!role || !content) return null;

      return { role, content };
    })
    .filter((message): message is { role: ChatRole; content: string } => message !== null);
};

const buildLocationContext = (currentLocation: LocationContext | null | undefined): string => {
  if (
    typeof currentLocation?.lat !== 'number' ||
    typeof currentLocation?.lng !== 'number'
  ) {
    return '';
  }

  return `CURRENT MAP LOCATION:\nThe user has selected map coordinates ${currentLocation.lat}, ${currentLocation.lng} in the San Francisco Bay Area. Use this for nearby historical suggestions when relevant, but do not treat coordinates as more specific than the selected landmark context. Do not infer an exact address from coordinates alone.`;
};

const buildSelectedLandmarkContext = (selectedLandmark: LandmarkContext | null | undefined): string => {
  if (!selectedLandmark?.title) {
    return 'CURRENTLY SELECTED LANDMARK:\nNo landmark is currently selected. Any landmark mentioned in conversation history is from an earlier turn and should not be treated as the current landmark.';
  }

  const details = [
    `Title: ${selectedLandmark.title}`,
    selectedLandmark.category ? `Category: ${selectedLandmark.category}` : null,
    typeof selectedLandmark.year_built === 'number' ? `Year built: ${selectedLandmark.year_built}` : null,
    selectedLandmark.architect ? `Architect/designer: ${selectedLandmark.architect}` : null,
    typeof selectedLandmark.latitude === 'number' && typeof selectedLandmark.longitude === 'number'
      ? `Coordinates: ${selectedLandmark.latitude}, ${selectedLandmark.longitude}`
      : null,
    selectedLandmark.summary ? `Summary: ${selectedLandmark.summary}` : null,
    selectedLandmark.historical_significance
      ? `Historical significance: ${selectedLandmark.historical_significance}`
      : null,
    selectedLandmark.fun_facts?.length
      ? `Fun facts: ${selectedLandmark.fun_facts.join(' | ')}`
      : null,
    selectedLandmark.website_url ? `Reference URL: ${selectedLandmark.website_url}` : null,
  ].filter(Boolean);

  return `CURRENTLY SELECTED LANDMARK:\nThis is the only current selected landmark. It supersedes any different landmark mentioned in conversation history.\n${details.join('\n')}`;
};

const isCurrentViewQuestion = (message: string): boolean => {
  const normalizedMessage = message.toLowerCase();

  return [
    /what .*am i .*looking at/,
    /what .*landmark .*looking at/,
    /what .*is .*this (landmark|place|location|site)/,
    /which .*landmark/,
    /where .*am i/,
  ].some((pattern) => pattern.test(normalizedMessage));
};

const buildCurrentLandmarkAnswer = (selectedLandmark: LandmarkContext): string => {
  const title = selectedLandmark.title;
  const descriptor = [
    selectedLandmark.category,
    typeof selectedLandmark.year_built === 'number' ? `built in ${selectedLandmark.year_built}` : null,
  ].filter(Boolean).join(', ');

  const intro = descriptor
    ? `You're looking at ${title}, a ${descriptor}.`
    : `You're looking at ${title}.`;

  if (selectedLandmark.summary) {
    return `${intro} ${selectedLandmark.summary}`;
  }

  if (selectedLandmark.historical_significance) {
    return `${intro} ${selectedLandmark.historical_significance}`;
  }

  return `${intro} I do not have more detailed app context for this landmark yet.`;
};

const buildNoCurrentLandmarkAnswer = (currentLocation: LocationContext | null | undefined): string => {
  if (
    typeof currentLocation?.lat === 'number' &&
    typeof currentLocation?.lng === 'number'
  ) {
    return `No landmark is currently selected. The map has coordinates selected near ${currentLocation.lat}, ${currentLocation.lng}, but I do not have a specific landmark selected to identify.`;
  }

  return 'No landmark is currently selected. Select a marker on the map and I can identify it for you.';
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured. Set OPENAI_API_KEY in Supabase Dashboard → Edge Functions → Settings.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, currentLocation, selectedLandmark, conversationHistory } = await req.json();
    const userMessage = typeof message === 'string' ? message.trim() : '';

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isCurrentViewQuestion(userMessage)) {
      const responseText = selectedLandmark?.title
        ? buildCurrentLandmarkAnswer(selectedLandmark)
        : buildNoCurrentLandmarkAnswer(currentLocation);

      return new Response(JSON.stringify({ response: responseText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const appContext = [
      buildSelectedLandmarkContext(selectedLandmark),
      buildLocationContext(currentLocation),
    ].filter(Boolean).join('\n\n');

    const chatMessages = sanitizeConversationHistory(conversationHistory);
    if (chatMessages.length === 0 || chatMessages[chatMessages.length - 1].content !== userMessage) {
      chatMessages.push({ role: 'user', content: userMessage });
    }

    const systemPrompt = `You are BayLore, an AI guide specializing in San Francisco Bay Area history and culture. You help users discover the historical significance of locations, landmarks, streets, neighborhoods, and cultural sites throughout the Bay Area.

${appContext ? `AVAILABLE APP CONTEXT:\n${appContext}` : 'AVAILABLE APP CONTEXT:\nNo map or landmark context was provided for this turn.'}

CORE PRINCIPLES:
- ACCURACY FIRST: Only share information you are confident is historically accurate
- When uncertain about specific dates, names, or details, acknowledge this uncertainty
- Prefer saying "I don't have reliable information about that specific detail" over guessing
- Focus on well-documented historical facts and widely accepted historical narratives
- Use recent conversation history to understand follow-up questions, pronouns, and user intent
- Treat AVAILABLE APP CONTEXT as the current app state. For questions about the current selection, current map view, or "this" place, it overrides any older landmark, map location, or selection mentioned in conversation history
- If CURRENTLY SELECTED LANDMARK is provided and the user asks what they are looking at, what this landmark/place is, or asks about "this" location, answer from the selected landmark first and name it explicitly
- If no landmark is currently selected, do not identify an older landmark from conversation history as the current landmark
- Use CURRENT MAP LOCATION as secondary context; never answer with only coordinates when a selected landmark is available
- Do not pretend the provided app context is a primary historical source; treat it as app/database context

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
          ...chatMessages
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
