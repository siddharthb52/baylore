// LangGraph-inspired state machine (manual implementation since Deno doesn't have LangGraph npm package)
import { plannerNode, discoveryNode, enrichmentNode, criticNode, routerNode } from "./nodes.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

/**
 * Run the discovery graph (manual state machine)
 */
export async function runDiscoveryGraph(input: {
  city: string;
  exampleLandmarks: any[];
  targetCount: number;
}): Promise<LandmarkDiscoveryState> {
  
  // Initialize state
  let state: LandmarkDiscoveryState = {
    city: input.city,
    exampleLandmarks: input.exampleLandmarks,
    targetCount: input.targetCount,
    candidateNames: [],
    discoveredLandmarks: [],
    rejectedLandmarks: [],
    verifiedCount: 0,
    iterationCount: 0,
  };

  console.log(`[GRAPH] Starting discovery for ${input.city}, target: ${input.targetCount}`);

  // Step 1: PLANNER
  state = { ...state, ...(await plannerNode(state)) };

  // Main loop: Discovery → Enrichment → Critic → Router
  const maxIterations = 30; // Safety limit
  let iterations = 0;

  while (state.verifiedCount < state.targetCount && state.candidateNames.length > 0 && iterations < maxIterations) {
    iterations++;
    console.log(`[GRAPH] Iteration ${iterations}: ${state.verifiedCount}/${state.targetCount} verified, ${state.candidateNames.length} candidates remaining`);

    // DISCOVERY
    const discoveryUpdate = await discoveryNode(state);
    state = { ...state, ...discoveryUpdate };

    // If discovery didn't produce a candidate, continue to next
    if (!state.currentCandidate) {
      continue;
    }

    // ENRICHMENT
    const enrichmentUpdate = await enrichmentNode(state);
    state = { ...state, ...enrichmentUpdate };

    // If enrichment failed, continue to next
    if (!state.currentCandidate) {
      continue;
    }

    // CRITIC
    const criticUpdate = await criticNode(state);
    state = { ...state, ...criticUpdate };

    // ROUTER
    const routerUpdate = await routerNode(state);
    state = { ...state, ...routerUpdate };
  }

  console.log(`[GRAPH] Discovery complete: ${state.verifiedCount} verified, ${state.rejectedLandmarks.length} rejected`);
  console.log(`[GRAPH] All landmarks were saved to database incrementally during the process`);

  return state;
}
