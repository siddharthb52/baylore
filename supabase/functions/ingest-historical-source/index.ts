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

interface HistoricalSource {
  id: string;
  title: string;
  type: string;
  year_start: number | null;
  description: string | null;
  original_file_url: string | null;
  metadata: Record<string, unknown>;
}

interface Chunk {
  text: string;
  index: number;
  section_title?: string;
  page_number?: number;
}

// Extract text from image using GPT-4 Vision
async function extractTextFromImage(imageUrl: string, sourceType: string): Promise<string> {
  console.log('Starting OCR extraction for:', imageUrl);
  
  const prompt = sourceType === 'map' 
    ? `Extract EVERY SINGLE piece of readable text from this historical map. You MUST be exhaustive and complete.

CRITICAL REQUIREMENTS:
- Extract EVERY street name from any street index - do not abbreviate, do not skip entries, do not use placeholders like "[more entries]"
- If there are 500 streets, list all 500 streets with their grid coordinates
- Extract ALL city and place names visible on the map
- Extract ALL labels for landmarks, buildings, or geographic features
- Extract ALL legend or key information
- Extract ANY dates, publishers, or descriptive text

DO NOT use phrases like:
- "more entries"
- "additional streets"
- "etc."
- "and so on"
- "[abbreviated]"

If a section has many entries, LIST THEM ALL. This is critical for search functionality.

Format the output as structured text with clear sections. Your goal is COMPLETE extraction, not a summary.`
    : `Extract EVERY SINGLE piece of readable text from this historical document/image. You MUST be exhaustive and complete.

CRITICAL REQUIREMENTS:
- Extract ALL body text, headings, and captions - do not abbreviate or summarize
- Extract ALL names, dates, and locations mentioned
- Extract ALL labels or annotations
- Preserve the general structure and organization of the text

DO NOT use phrases like "more entries", "additional text", "etc.", or "[abbreviated]"

Your goal is COMPLETE extraction, not a summary. If the document has 50 paragraphs, extract all 50 paragraphs.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
      body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
      max_tokens: 16000, // Increased to allow for exhaustive extraction
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI Vision API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Chunk text into searchable pieces
function chunkText(text: string, chunkSize: number = 512): Chunk[] {
  const chunks: Chunk[] = [];
  
  // Split by double newlines to get sections
  const sections = text.split(/\n\n+/);
  
  let currentChunk = '';
  let chunkIndex = 0;
  let currentSection = '';
  
  for (const section of sections) {
    // Check if this looks like a section header (short line, possibly with colons)
    const isHeader = section.length < 100 && (section.includes(':') || section.match(/^[A-Z\s]+$/));
    
    if (isHeader && currentChunk) {
      // Save previous chunk before starting new section
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex++,
        section_title: currentSection || undefined,
      });
      currentChunk = '';
      currentSection = section.trim();
    }
    
    // Estimate token count (rough: 1 token ≈ 4 characters)
    const estimatedTokens = (currentChunk + section).length / 4;
    
    if (estimatedTokens > chunkSize && currentChunk) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex++,
        section_title: currentSection || undefined,
      });
      
      // Start new chunk with some overlap (last sentence)
      const sentences = currentChunk.split(/\. /);
      const overlap = sentences.length > 1 ? sentences[sentences.length - 1] : '';
      currentChunk = overlap + ' ' + section;
    } else {
      currentChunk += '\n\n' + section;
    }
  }
  
  // Save final chunk
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunkIndex++,
      section_title: currentSection || undefined,
    });
  }
  
  return chunks;
}

// Generate embedding for a text chunk
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI Embeddings API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
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

    const { source_id } = await req.json();

    if (!source_id) {
      return new Response(
        JSON.stringify({ error: 'source_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the historical source
    console.log('Fetching source:', source_id);
    const { data: source, error: fetchError } = await supabase
      .from('historical_sources')
      .select('*')
      .eq('id', source_id)
      .single();

    if (fetchError || !source) {
      return new Response(
        JSON.stringify({ error: 'Source not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const historicalSource = source as HistoricalSource;

    if (!historicalSource.original_file_url) {
      return new Response(
        JSON.stringify({ error: 'Source has no file URL to process' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Extract text using OCR
    console.log('Extracting text from image...');
    const extractedText = await extractTextFromImage(
      historicalSource.original_file_url,
      historicalSource.type
    );

    // Step 2: Chunk the text
    console.log('Chunking text...');
    const chunks = chunkText(extractedText);
    console.log(`Created ${chunks.length} chunks`);

    // Step 3: Generate embeddings and insert chunks
    console.log('Generating embeddings and inserting chunks...');
    const chunksToInsert: Array<{
      source_id: string;
      chunk_text: string;
      chunk_index: number;
      embedding: number[];
      embedding_model: string;
      section_title?: string;
      page_number?: number;
      metadata: Record<string, unknown>;
    }> = [];

    // Build context prefix for embeddings
    const contextPrefix = `Source: ${historicalSource.title}${historicalSource.year_start ? ` (${historicalSource.year_start})` : ''}. Type: ${historicalSource.type}.\n\n`;

    for (const chunk of chunks) {
      // Add context to the text before embedding
      const textWithContext = contextPrefix + chunk.text;
      const embedding = await generateEmbedding(textWithContext);
      
      chunksToInsert.push({
        source_id: source_id,
        chunk_text: chunk.text, // Store original text without context
        chunk_index: chunk.index,
        embedding: embedding, // But embedding includes context
        embedding_model: 'text-embedding-3-small',
        section_title: chunk.section_title,
        page_number: chunk.page_number,
        metadata: { context_added: true },
      });
    }

    // Batch insert all chunks
    const { error: insertError } = await supabase
      .from('historical_chunks')
      .insert(chunksToInsert);

    if (insertError) {
      console.error('Error inserting chunks:', insertError);
      throw insertError;
    }

    console.log('Successfully ingested source');

    return new Response(
      JSON.stringify({
        success: true,
        source_id: source_id,
        source_title: historicalSource.title,
        chunks_created: chunks.length,
        extracted_text_length: extractedText.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ingest-historical-source function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to ingest historical source',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
