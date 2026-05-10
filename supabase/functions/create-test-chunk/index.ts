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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const chunkText = `Street Index - San Jose, Santa Clara, Campbell, Saratoga (1938):

San Jose Streets:
Aborn Rd, Acapulco Dr, Adams Ct, Adams Dr, Adelaide Dr, Aero St, Agnew Rd, Ainsworth Dr, Alamo Ave, Alum Rock Ave, Auzerais Ave, Autumn St, Balbach St, Bassett St, Bird Ave, Bouret Rd, Branham Ln, Bush St, Coe Ave, Coleman Ave, Curtner Ave, Delmas Ave, Empire St, First St, Fourth St, Hedding St, Jackson St, Julian St, Market St, Montgomery St, Park Ave, Race St, San Carlos St, San Fernando St, Santa Clara St, Second St, St James St, Stockton Ave, Story Rd, Taylor St, The Alameda, Third St, Tully Rd, White Rd, Willow St

Mountain View - Sunnyvale Streets:
Adobe Creek, Adobe Lane, Afton Ave, Ahwanee Ave, Alamo Pl, Albatross St, Alden Way, Alexander Way

Geographic Features:
Stevens Creek, Adobe Creek, Guadalupe River

Cities and Towns:
Palo Alto, Santa Clara, Stanford, Sunnyvale, Mountain View, Cupertino, Campbell, Saratoga, Los Gatos, San Jose

Notable Landmarks:
Air Base, West Valley College, De Anza College`;

    const contextPrefix = "Source: Thomas Brothers Map of San Jose, Santa Clara, & Vicinity (1938). Type: map.\n\n";
    const textWithContext = contextPrefix + chunkText;

    // Generate embedding
    console.log('Generating embedding...');
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: textWithContext,
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error(`OpenAI API error: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    // Insert into database
    console.log('Inserting chunk...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('historical_chunks')
      .insert({
        source_id: '8e8852b0-c0aa-4298-a90c-e96e5e471f0d',
        chunk_text: chunkText,
        chunk_index: 0,
        embedding: embedding,
        embedding_model: 'text-embedding-3-small',
        section_title: 'Street Index',
        metadata: { manually_created: true, context_added: true },
      });

    if (error) {
      throw error;
    }

    console.log('Test chunk created successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Test chunk created with embedding' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
