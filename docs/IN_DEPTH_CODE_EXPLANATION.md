# In-Depth Code Explanation: Discover Landmarks Agent

Complete line-by-line breakdown of every file in the agent system.

---

## File 1: `index.ts` - The Entry Point

**Purpose:** HTTP request handler - the "front door" of the Edge Function

**Full Code with Explanations:**

```typescript
/// <reference types="https://deno.land/v1/deno.d.ts" />
```
- **Line 1:** Type definitions for Deno runtime
- Tells TypeScript about Deno-specific globals like `Deno.env`
- Without this, TypeScript would show errors on `Deno.env.get()`

```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
```
- **Line 3:** Polyfill for `XMLHttpRequest` 
- Makes older HTTP APIs work in Deno
- Needed for some legacy packages

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
```
- **Line 4:** Import Deno's HTTP server
- `serve()` creates an HTTP server that listens for requests
- Version 0.168.0 is pinned for stability

```typescript
import { runDiscoveryGraph } from "./graph.ts";
```
- **Line 5:** Import our agent orchestrator
- `graph.ts` contains the main workflow logic
- Relative import (same directory)

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```
- **Lines 7-10:** CORS headers
- **Why needed?** Browser makes requests from different domain (your app → Supabase)
- `*` allows requests from any origin (could be restricted to your domain)
- Lists allowed headers the client can send

```typescript
serve(async (req) => {
```
- **Line 12:** Start HTTP server
- `serve()` calls this function for every HTTP request
- `async` because we'll make API calls (Wikipedia, OpenAI, Supabase)

```typescript
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
```
- **Lines 14-16:** Handle CORS preflight
- **What's a preflight?** Browser sends OPTIONS request before actual POST
- Checks if server allows cross-origin requests
- We respond with CORS headers to say "yes, allowed"

```typescript
  try {
    const { city, exampleLandmarks, targetCount } = await req.json();
```
- **Lines 18-19:** Parse request body
- `req.json()` reads the request body and parses it as JSON
- Destructures: city (string), exampleLandmarks (array), targetCount (number)

```typescript
    if (!city || !exampleLandmarks || !Array.isArray(exampleLandmarks)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request. Provide: { city: string, exampleLandmarks: Landmark[], targetCount?: number }' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
```
- **Lines 21-26:** Validation
- Check required fields exist and are correct types
- If invalid, return 400 Bad Request with error message
- `...corsHeaders` spreads CORS headers into response

```typescript
    console.log(`Starting landmark discovery for ${city}...`);
```
- **Line 28:** Log to Supabase Edge Function logs
- Visible in Dashboard → Edge Functions → Logs tab
- Helps with debugging

```typescript
    const result = await runDiscoveryGraph({
      city,
      exampleLandmarks,
      targetCount: targetCount || 10,
    });
```
- **Lines 31-35:** Run the agent!
- Calls the main orchestrator from `graph.ts`
- Passes city, examples, and target (defaults to 10 if not provided)
- `await` waits for all discovery to complete

```typescript
    console.log(`Discovery complete: ${result.verifiedCount} verified, ${result.rejectedLandmarks.length} rejected`);
```
- **Line 37:** Log completion
- Shows how many landmarks were accepted vs rejected

```typescript
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
```
- **Lines 39-48:** Return success response
- Sends back: success flag, counts, full landmark data
- Sets Content-Type to JSON
- Includes CORS headers

```typescript
  } catch (error) {
    console.error('Error in discover-landmarks-agent:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to discover landmarks' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```
- **Lines 49-56:** Error handling
- Catches any errors (API failures, crashes, etc.)
- Logs error to Supabase logs
- Returns 500 Internal Server Error with message

**Summary of index.ts:**
- ✅ Validates input
- ✅ Calls the agent
- ✅ Returns results or errors
- ✅ Handles CORS
- **Role:** Request handler, not business logic

---

## File 2: `graph.ts` - The Orchestrator

**Purpose:** Manages the workflow - runs nodes in sequence until target is reached

**Full Code with Explanations:**

```typescript
import { plannerNode, discoveryNode, enrichmentNode, criticNode, routerNode } from "./nodes.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
```
- **Lines 2-3:** Imports
- Imports all 5 agent nodes from `nodes.ts`
- Imports Supabase client (for database access, though now done in nodes)

```typescript
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
```
- **Lines 5-6:** Get Supabase credentials
- `Deno.env.get()` reads environment variables
- `!` tells TypeScript "this will never be undefined"
- **SERVICE_ROLE_KEY** needed for database writes (more powerful than anon key)

```typescript
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
```
- **Line 8:** Create Supabase client
- Used to access database
- Service role bypasses Row Level Security

```typescript
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
```
- **Lines 10-21:** State interface
- **Why important?** This is the "shared memory" passed between all nodes
- Each node reads from state, does work, returns updated state
- `?` means optional (only present during processing)

**State fields explained:**
- `city`: What we're searching for (e.g., "Berkeley, CA")
- `exampleLandmarks`: Quality examples to learn from
- `targetCount`: How many landmarks to find (e.g., 10)
- `candidateNames`: List of landmarks to research (from Planner)
- `discoveredLandmarks`: Accepted landmarks (final output)
- `rejectedLandmarks`: Failed landmarks (for debugging)
- `currentCandidate`: Landmark being processed right now
- `currentDecision`: Critic's ACCEPT/REJECT decision
- `verifiedCount`: How many accepted so far
- `iterationCount`: Loop counter (for debugging)

```typescript
export async function runDiscoveryGraph(input: {
  city: string;
  exampleLandmarks: any[];
  targetCount: number;
}): Promise<LandmarkDiscoveryState> {
```
- **Lines 27-31:** Main function
- Called by `index.ts`
- Takes city, examples, target count
- Returns final state with all discoveries

```typescript
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
```
- **Lines 34-43:** Initialize state
- Starts with empty lists
- Sets input values
- This state object gets passed to every node

```typescript
  console.log(`[GRAPH] Starting discovery for ${input.city}, target: ${input.targetCount}`);
```
- **Line 45:** Log start

```typescript
  state = { ...state, ...(await plannerNode(state)) };
```
- **Line 48:** Run PLANNER node
- **Pattern:** `state = { ...state, ...updateFromNode }`
- Spreads old state, then spreads updates from node (overwrites changed fields)
- After this, `state.candidateNames` will have 15-20 landmark names

```typescript
  const maxIterations = 30;
  let iterations = 0;
```
- **Lines 51-52:** Safety limits
- Prevent infinite loops
- If planner generates bad candidates that all get rejected, stop after 30 tries

```typescript
  while (state.verifiedCount < state.targetCount && state.candidateNames.length > 0 && iterations < maxIterations) {
    iterations++;
    console.log(`[GRAPH] Iteration ${iterations}: ${state.verifiedCount}/${state.targetCount} verified, ${state.candidateNames.length} candidates remaining`);
```
- **Lines 54-56:** Main loop
- **Conditions:**
  1. Haven't reached target yet
  2. Still have candidates to try
  3. Haven't exceeded max iterations
- Logs progress each iteration

```typescript
    const discoveryUpdate = await discoveryNode(state);
    state = { ...state, ...discoveryUpdate };

    if (!state.currentCandidate) {
      continue;
    }
```
- **Lines 59-63:** DISCOVERY node
- Researches next candidate
- If returns no candidate (duplicate, bad coordinates, etc.), skip to next iteration
- `continue` jumps back to top of loop

```typescript
    const enrichmentUpdate = await enrichmentNode(state);
    state = { ...state, ...enrichmentUpdate };

    if (!state.currentCandidate) {
      continue;
    }
```
- **Lines 66-70:** ENRICHMENT node
- Writes summary, fun facts
- If fails, skip to next

```typescript
    const criticUpdate = await criticNode(state);
    state = { ...state, ...criticUpdate };
```
- **Lines 73-74:** CRITIC node
- Evaluates quality
- Sets `state.currentDecision`

```typescript
    const routerUpdate = await routerNode(state);
    state = { ...state, ...routerUpdate };
  }
```
- **Lines 77-78:** ROUTER node
- Decides what to do based on critic
- If ACCEPT: saves to database, increments verifiedCount
- Loop continues until verifiedCount reaches target

```typescript
  console.log(`[GRAPH] Discovery complete: ${state.verifiedCount} verified, ${state.rejectedLandmarks.length} rejected`);
  console.log(`[GRAPH] All landmarks were saved to database incrementally during the process`);

  return state;
}
```
- **Lines 81-85:** Done!
- Logs completion
- Returns final state

**Summary of graph.ts:**
- ✅ Initializes state
- ✅ Runs planner once
- ✅ Loops through discovery → enrichment → critic → router
- ✅ Stops when target reached
- **Role:** Orchestrator, controls flow

---

## State Flow Visualization

Let me show you how state changes through the loop:

### Initial State (after Planner)
```javascript
{
  city: "Berkeley, CA",
  targetCount: 1,
  candidateNames: ["Sather Tower", "Berkeley Art Museum", "Tilden Park", ...], // 15 names
  discoveredLandmarks: [],
  rejectedLandmarks: [],
  verifiedCount: 0,
  iterationCount: 0
}
```

### After Discovery (iteration 1)
```javascript
{
  ...
  candidateNames: ["Berkeley Art Museum", "Tilden Park", ...], // removed "Sather Tower"
  currentCandidate: {
    title: "Sather Tower",
    latitude: 37.8719,
    longitude: -122.2585,
    raw_extract: "Sather Tower is...",
    image_url: "https://...",
    source_url: "https://en.wikipedia.org/wiki/Sather_Tower"
  },
  iterationCount: 1
}
```

### After Enrichment
```javascript
{
  ...
  currentCandidate: {
    title: "Sather Tower",
    latitude: 37.8719,
    longitude: -122.2585,
    summary: "Built in 1914, this 307-foot campanile...",
    fun_facts: ["The tower's bells weigh...", "During earthquakes..."],
    category: "Architecture",
    historical_significance: "...",
    image_url: "https://...",
    source_url: "https://..."
  }
}
```

### After Critic
```javascript
{
  ...
  currentDecision: {
    decision: "ACCEPT",
    reasoning: "Meets quality standards, interesting facts, accurate",
    confidence: 0.9
  }
}
```

### After Router (ACCEPT case)
```javascript
{
  ...
  discoveredLandmarks: [
    { title: "Sather Tower", ... } // added to list
  ],
  verifiedCount: 1, // incremented
  currentCandidate: undefined, // cleared
  currentDecision: undefined // cleared
}
```

Now loop checks: `verifiedCount (1) < targetCount (1)`? NO → EXIT LOOP

---

## Why This Architecture?

**Separation of Concerns:**
- `index.ts` = HTTP handling
- `graph.ts` = Flow control
- `nodes.ts` = Business logic
- `tools.ts` = API calls
- `prompts.ts` = AI instructions

**Benefits:**
- ✅ Easy to debug (know which file has the bug)
- ✅ Easy to modify (change prompts without touching flow)
- ✅ Testable (can test nodes independently)
- ✅ Clear responsibilities

**Alternative (bad):**
All in one file → 500+ lines, impossible to debug, tight coupling

---

Want me to continue with detailed explanations of:
- `nodes.ts` (the 5 agents)
- `tools.ts` (Wikipedia/Wikimedia APIs)
- `prompts.ts` (GPT-4 instructions)
