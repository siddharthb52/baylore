/// <reference types="https://deno.land/v1/deno.d.ts" />

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { runDiscoveryGraph } from "./graph.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, exampleLandmarks, targetCount } = await req.json();

    if (!city || !exampleLandmarks || !Array.isArray(exampleLandmarks)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Provide: { city: string, exampleLandmarks: Landmark[], targetCount?: number }' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting landmark discovery for ${city}...`);

    // Run the LangGraph agent
    const result = await runDiscoveryGraph({
      city,
      exampleLandmarks,
      targetCount: targetCount || 10, // Use provided targetCount or default to 10
    });

    console.log(`Discovery complete: ${result.verifiedCount} verified, ${result.rejectedLandmarks.length} rejected`);

    return new Response(
      JSON.stringify({
        success: true,
        verified: result.verifiedCount,
        rejected: result.rejectedLandmarks.length,
        landmarks: result.discoveredLandmarks,
        rejectedDetails: result.rejectedLandmarks,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in discover-landmarks-agent:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to discover landmarks' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
