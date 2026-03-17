# Discover Landmarks Agent

LangGraph-based agent that autonomously discovers and validates Bay Area landmarks.

## How it works

**Agent Flow:**
```
START
  ↓
PLANNER → Creates strategy, generates 15-20 candidate landmark names
  ↓
DISCOVERY → Searches Wikipedia, extracts data, gets images (loops)
  ↓
ENRICHMENT → Writes summary, fun facts, categorizes
  ↓
CRITIC → Evaluates quality, decides ACCEPT/REJECT/REFINE
  ↓
ROUTER → Adds to verified list or rejects
  ↓
Loop until 10 verified landmarks
  ↓
Insert to landmarks_proposed table
```

## Usage

### Test the function locally:
```bash
curl -X POST http://localhost:54321/functions/v1/discover-landmarks-agent \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Berkeley, CA",
    "exampleLandmarks": [
      {
        "title": "Golden Gate Bridge",
        "category": "Golden Gate",
        "summary": "Completed in 1937, this iconic suspension bridge spans the Golden Gate strait and was designed by chief engineer Joseph Strauss. At the time of construction, it held the world record for longest suspension bridge span.",
        "fun_facts": [
          "The bridge's International Orange color was originally meant to be temporary primer",
          "It took just over four years to construct, completing ahead of schedule"
        ]
      }
    ]
  }'
```

### Deploy to Supabase:
```bash
supabase functions deploy discover-landmarks-agent
```

### Call from production:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/discover-landmarks-agent \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "city": "Berkeley, CA", "exampleLandmarks": [...] }'
```

## Environment Variables

Set in Supabase Dashboard → Edge Functions → Settings:
- `OPENAI_API_KEY` - Your OpenAI API key

## Files

- `index.ts` - Entry point, handles HTTP requests
- `graph.ts` - State machine orchestration
- `nodes.ts` - Agent node implementations
- `prompts.ts` - LLM prompts for each agent
- `tools.ts` - Wikipedia & Wikimedia API tools

## Output

Returns:
```json
{
  "success": true,
  "verified": 10,
  "rejected": 5,
  "landmarks": [...],
  "rejectedDetails": [...]
}
```

Landmarks are inserted into `landmarks_proposed` table with `status='verified'`.
