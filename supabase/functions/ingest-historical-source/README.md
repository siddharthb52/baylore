# Ingest Historical Source Function

This Edge Function processes historical sources (maps, photos, documents) by:
1. Extracting text using GPT-4 Vision (OCR)
2. Chunking the text into searchable pieces
3. Generating embeddings for each chunk
4. Storing chunks in the `historical_chunks` table

## Usage

### Prerequisites
- Source must be uploaded to `historical_images` bucket
- Source record must exist in `historical_sources` table
- `OPENAI_API_KEY` must be set in Supabase Edge Functions settings

### Invoke the Function

```typescript
const { data, error } = await supabase.functions.invoke('ingest-historical-source', {
  body: {
    source_id: '8e8852b0-c0aa-4298-a90c-e96e3e471f0d'
  }
});
```

### Response

```json
{
  "success": true,
  "source_id": "8e8852b0-c0aa-4298-a90c-e96e3e471f0d",
  "source_title": "Thomas Brothers Map of San Jose, Santa Clara, & Vicinity",
  "chunks_created": 23,
  "extracted_text_length": 4567
}
```

## How It Works

### 1. OCR Extraction (GPT-4 Vision)
- Sends the image to GPT-4 Vision with specialized prompts
- For maps: Extracts street names, place labels, legend info
- For documents: Extracts all readable text with structure

### 2. Chunking Strategy
- Splits text by sections (double newlines)
- Target chunk size: ~512 tokens (~2000 characters)
- Includes overlap between chunks (last sentence repeated)
- Preserves section titles for context

### 3. Embedding Generation
- Uses OpenAI `text-embedding-3-small` (1536 dimensions)
- One embedding per chunk
- Stored as `vector(1536)` in Postgres

### 4. Database Storage
- Inserts all chunks into `historical_chunks` table
- Links back to source via `source_id`
- Includes metadata: section titles, chunk index, embedding model

## Testing

Test with your 1938 map:

```typescript
const result = await supabase.functions.invoke('ingest-historical-source', {
  body: { source_id: '8e8852b0-c0aa-4298-a90c-e96e3e471f0d' }
});

console.log(result);
```

## Cost Estimate

For one large map:
- GPT-4 Vision: ~$0.01-0.05 per image
- Embeddings: ~$0.0001 per chunk (20 chunks = $0.002)
- **Total: ~$0.01-0.05 per source**

## Notes

- Large images work better (high resolution = better OCR)
- Processing time: 30-90 seconds depending on image size
- Function automatically handles chunking and embeddings
- Run this once per historical source
