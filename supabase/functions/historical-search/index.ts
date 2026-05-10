import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HistoricalChunk {
  id: string;
  source_id: string;
  chunk_text: string;
  section_title: string | null;
  similarity: number;
}

interface HistoricalSource {
  id: string;
  title: string;
  type: string;
  year_start: number | null;
  thumbnail_url: string | null;
  original_file_url: string | null;
}

// Generate embedding for user query
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: query,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI Embeddings API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Search historical chunks using vector similarity
async function searchHistoricalChunks(
  supabase: ReturnType<typeof createClient>,
  queryEmbedding: number[],
  matchThreshold: number = 0.5,
  matchCount: number = 10
): Promise<HistoricalChunk[]> {
  const { data, error } = await supabase.rpc('match_historical_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    console.error('Error searching chunks:', error);
    throw error;
  }

  return data || [];
}

// Get source details for chunks
async function getSourcesForChunks(
  supabase: ReturnType<typeof createClient>,
  chunks: HistoricalChunk[]
): Promise<Map<string, HistoricalSource>> {
  const sourceIds = [...new Set(chunks.map(c => c.source_id))];
  
  const { data, error } = await supabase
    .from('historical_sources')
    .select('id, title, type, year_start, thumbnail_url, original_file_url')
    .in('id', sourceIds);

  if (error) {
    console.error('Error fetching sources:', error);
    throw error;
  }

  const sourcesMap = new Map<string, HistoricalSource>();
  (data || []).forEach(source => {
    sourcesMap.set(source.id, source as HistoricalSource);
  });

  return sourcesMap;
}

// Generate answer using GPT-4 with retrieved context
async function generateAnswer(query: string, chunks: HistoricalChunk[], sources: Map<string, HistoricalSource>): Promise<string> {
  // Build context from chunks
  const context = chunks.map((chunk, idx) => {
    const source = sources.get(chunk.source_id);
    const sourceInfo = source ? `${source.title} (${source.year_start || 'date unknown'})` : 'Unknown source';
    return `[Source ${idx + 1}: ${sourceInfo}]
${chunk.section_title ? `Section: ${chunk.section_title}\n` : ''}${chunk.chunk_text}`;
  }).join('\n\n---\n\n');

  const systemPrompt = `You are a historical researcher assistant specializing in Bay Area history. 
You answer questions using ONLY the provided historical sources. 

RULES:
- Base your answer strictly on the provided context
- Cite sources using [Source N] notation
- If the context doesn't contain enough information to answer fully, say so
- Be specific about dates, locations, and details when available
- If asked about something not in the sources, clearly state that

The sources provided are historical documents, maps, and records from the San Francisco Bay Area.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context from historical sources:\n\n${context}\n\n---\n\nQuestion: ${query}` }
      ],
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more factual responses
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, match_threshold, match_count } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'query is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Search query:', query);

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Generate embedding for user query
    console.log('Generating query embedding...');
    const queryEmbedding = await generateQueryEmbedding(query);

    // Step 2: Search for similar chunks
    console.log('Searching historical chunks...');
    const chunks = await searchHistoricalChunks(
      supabase,
      queryEmbedding,
      match_threshold || 0.5, // Lowered from 0.7 to be less strict
      match_count || 10
    );

    console.log(`Found ${chunks.length} matching chunks`);

    if (chunks.length === 0) {
      return new Response(
        JSON.stringify({
          response: "I couldn't find any relevant historical information to answer that question. The historical archives may not contain information about this topic yet.",
          sources: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Get source details
    console.log('Fetching source details...');
    const sources = await getSourcesForChunks(supabase, chunks);

    // Step 4: Generate answer using GPT-4
    console.log('Generating answer...');
    const answer = await generateAnswer(query, chunks, sources);

    // Step 5: Format source citations
    const sourceCitations = Array.from(sources.values()).map(source => ({
      id: source.id,
      title: source.title,
      type: source.type,
      year: source.year_start,
      thumbnail_url: source.thumbnail_url,
      original_file_url: source.original_file_url,
    }));

    console.log('Search completed successfully');

    return new Response(
      JSON.stringify({
        response: answer,
        sources: sourceCitations,
        chunks_searched: chunks.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in historical-search function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to search historical sources',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
