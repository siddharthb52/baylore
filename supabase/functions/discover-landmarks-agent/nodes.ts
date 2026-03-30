/// <reference types="https://deno.land/v1/deno.d.ts" />

// Agent node implementations
import { getPlannerPrompt, getDiscoveryPrompt, getEnrichmentPrompt, getCriticPrompt } from "./prompts.ts";
import { searchWikipedia, getWikimediaImage, isInBayArea, verifyUrl } from "./tools.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface LandmarkDiscoveryState {
  city: string;
  exampleLandmarks: any[];
  targetCount: number;
  candidateNames: string[];
  discoveredLandmarks: any[];
  rejectedLandmarks: Array<{ name: string; reason: string }>;
  currentCandidate?: any;
  currentDecision?: { decision: string; reasoning: string; feedback?: string };
  verifiedCount: number;
  iterationCount: number;
}

async function callOpenAI(prompt: string, systemPrompt?: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * PLANNER NODE: Creates strategy and generates candidate landmark names
 */
export async function plannerNode(state: LandmarkDiscoveryState): Promise<Partial<LandmarkDiscoveryState>> {
  console.log(`[PLANNER] Planning discovery strategy for ${state.city}...`);

  const prompt = getPlannerPrompt(state.city, state.exampleLandmarks, state.targetCount);
  const response = await callOpenAI(prompt);

  // Parse JSON array from response
  let candidateNames: string[] = [];
  try {
    // Extract JSON array from response (might be wrapped in markdown code blocks)
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      candidateNames = JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('[PLANNER] Failed to parse candidate names:', error);
    throw new Error('Failed to generate candidate list');
  }

  console.log(`[PLANNER] Generated ${candidateNames.length} candidates`);

  return {
    candidateNames,
    iterationCount: 0,
  };
}

/**
 * DISCOVERY NODE: Searches Wikipedia and gathers raw data for one candidate
 */
export async function discoveryNode(state: LandmarkDiscoveryState): Promise<Partial<LandmarkDiscoveryState>> {
  if (!state.candidateNames || state.candidateNames.length === 0) {
    console.log('[DISCOVERY] No more candidates');
    return {};
  }

  const candidateName = state.candidateNames[0];
  console.log(`[DISCOVERY] Researching: ${candidateName}`);

  // Search Wikipedia
  const wikiData = await searchWikipedia(candidateName);

  if (!wikiData) {
    console.log(`[DISCOVERY] No Wikipedia data found for ${candidateName}`);
    return {
      candidateNames: state.candidateNames.slice(1),
      rejectedLandmarks: [
        ...state.rejectedLandmarks,
        { name: candidateName, reason: 'No Wikipedia page found' }
      ],
    };
  }

  // Get image from Wikimedia
  const image = await getWikimediaImage(candidateName);

  // Validate coordinates
  if (wikiData.coordinates) {
    if (!isInBayArea(wikiData.coordinates.lat, wikiData.coordinates.lon)) {
      console.log(`[DISCOVERY] ${candidateName} is outside Bay Area bounds`);
      return {
        candidateNames: state.candidateNames.slice(1),
        rejectedLandmarks: [
          ...state.rejectedLandmarks,
          { name: candidateName, reason: 'Coordinates outside Bay Area' }
        ],
      };
    }
  }

  // CHECK FOR DUPLICATE BEFORE DOING EXPENSIVE ENRICHMENT
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: existing } = await supabase
    .from('landmarks_proposed')
    .select('id')
    .eq('title', wikiData.title)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`[DISCOVERY] ${wikiData.title} already exists - skipping enrichment`);
    return {
      candidateNames: state.candidateNames.slice(1),
      rejectedLandmarks: [
        ...state.rejectedLandmarks,
        { name: wikiData.title, reason: 'Duplicate - already in database' }
      ],
    };
  }

  const rawData = {
    title: wikiData.title,
    latitude: wikiData.coordinates?.lat,
    longitude: wikiData.coordinates?.lon,
    raw_extract: wikiData.extract,
    image_url: image?.url,
    source_url: wikiData.pageUrl,
  };

  console.log(`[DISCOVERY] Successfully gathered data for ${candidateName}`);

  return {
    candidateNames: state.candidateNames.slice(1),
    currentCandidate: rawData,
    iterationCount: state.iterationCount + 1,
  };
}

/**
 * ENRICHMENT NODE: Generates engaging summary, fun facts, and categorizes
 */
export async function enrichmentNode(state: LandmarkDiscoveryState): Promise<Partial<LandmarkDiscoveryState>> {
  if (!state.currentCandidate) {
    return {};
  }

  console.log(`[ENRICHMENT] Enriching: ${state.currentCandidate.title}`);

  const prompt = getEnrichmentPrompt(state.currentCandidate, state.exampleLandmarks);
  const response = await callOpenAI(prompt);

  // Parse enriched data
  let enrichedData: any;
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      enrichedData = JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('[ENRICHMENT] Failed to parse enriched data:', error);
    return {
      rejectedLandmarks: [
        ...state.rejectedLandmarks,
        { name: state.currentCandidate.title, reason: 'Failed to enrich data' }
      ],
      currentCandidate: undefined,
    };
  }

  const enrichedLandmark = {
    ...state.currentCandidate,
    ...enrichedData,
    source_urls: [state.currentCandidate.source_url],
  };

  console.log(`[ENRICHMENT] Enriched ${state.currentCandidate.title}`);

  return {
    currentCandidate: enrichedLandmark,
  };
}

/**
 * CRITIC NODE: Evaluates quality and decides ACCEPT/REFINE/REJECT
 */
export async function criticNode(state: LandmarkDiscoveryState): Promise<Partial<LandmarkDiscoveryState>> {
  if (!state.currentCandidate) {
    return {};
  }

  console.log(`[CRITIC] Evaluating: ${state.currentCandidate.title}`);

  const prompt = getCriticPrompt(state.currentCandidate, state.exampleLandmarks);
  const response = await callOpenAI(prompt);

  // Parse decision
  let decision: any;
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      decision = JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('[CRITIC] Failed to parse decision:', error);
    decision = { decision: 'REJECT', reasoning: 'Failed to evaluate' };
  }

  console.log(`[CRITIC] Decision for ${state.currentCandidate.title}: ${decision.decision}`);

  return {
    currentDecision: decision,
  };
}

/**
 * ROUTER NODE: Routes based on critic decision and SAVES TO DATABASE immediately
 */
export async function routerNode(state: LandmarkDiscoveryState): Promise<Partial<LandmarkDiscoveryState>> {
  if (!state.currentDecision || !state.currentCandidate) {
    return {};
  }

  const { decision, reasoning } = state.currentDecision;

  if (decision === 'ACCEPT') {
    console.log(`[ROUTER] Accepting ${state.currentCandidate.title}`);
    
    const verifiedLandmark = {
      ...state.currentCandidate,
      status: 'verified',
      verification_notes: reasoning,
    };

    // SAVE TO DATABASE IMMEDIATELY (with duplicate check)
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Check if landmark already exists (should have been caught in Discovery, but double-check)
    const { data: existing, error: checkError } = await supabase
      .from('landmarks_proposed')
      .select('id, title')
      .eq('title', verifiedLandmark.title)
      .limit(1);

    if (checkError) {
      console.error('[ROUTER] Error checking for duplicates:', checkError);
    }

    if (existing && existing.length > 0) {
      console.log(`[ROUTER] Skipping ${verifiedLandmark.title} - already exists (missed in Discovery)`);
      return {
        rejectedLandmarks: [
          ...state.rejectedLandmarks,
          { name: verifiedLandmark.title, reason: 'Duplicate - already exists in database' }
        ],
        currentCandidate: undefined,
        currentDecision: undefined,
      };
    }

    // Insert new landmark
    const { error } = await supabase
      .from('landmarks_proposed')
      .insert({
        title: verifiedLandmark.title,
        latitude: verifiedLandmark.latitude,
        longitude: verifiedLandmark.longitude,
        summary: verifiedLandmark.summary,
        category: verifiedLandmark.category,
        year_built: verifiedLandmark.year_built || null,
        architect: verifiedLandmark.architect || null,
        historical_significance: verifiedLandmark.historical_significance || null,
        fun_facts: verifiedLandmark.fun_facts || [],
        image_url: verifiedLandmark.image_url || null,
        website_url: null,
        status: 'verified',
        source_urls: verifiedLandmark.source_urls || [],
        verification_notes: reasoning,
        fetch_metadata: {
          agent_version: '1.0',
          city: state.city,
        },
      });

    if (error) {
      console.error('[ROUTER] Error inserting to database:', error);
    } else {
      console.log(`[ROUTER] Successfully saved ${verifiedLandmark.title} to database`);
    }

    return {
      discoveredLandmarks: [...state.discoveredLandmarks, verifiedLandmark],
      verifiedCount: state.verifiedCount + 1,
      currentCandidate: undefined,
      currentDecision: undefined,
    };
  } else if (decision === 'REJECT') {
    console.log(`[ROUTER] Rejecting ${state.currentCandidate.title}: ${reasoning}`);
    return {
      rejectedLandmarks: [
        ...state.rejectedLandmarks,
        { name: state.currentCandidate.title, reason: reasoning }
      ],
      currentCandidate: undefined,
      currentDecision: undefined,
    };
  } else {
    // REFINE - for now, just reject (can implement refinement loop later)
    console.log(`[ROUTER] Refine requested for ${state.currentCandidate.title}, treating as reject for now`);
    return {
      rejectedLandmarks: [
        ...state.rejectedLandmarks,
        { name: state.currentCandidate.title, reason: `Needs refinement: ${reasoning}` }
      ],
      currentCandidate: undefined,
      currentDecision: undefined,
    };
  }
}
