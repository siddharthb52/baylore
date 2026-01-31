# BayLore

Explore the historical significance of locations, landmarks, and cultural sites throughout the San Francisco Bay Area.

## Features

- **Interactive Map** – Leaflet-based map with landmark pinpoints
- **Landmark Popups** – Historical info, dates, and visuals
- **AI Chatbot** – Ask questions about Bay Area history, landmarks, and famous figures
- **Map Toggle** – Switch between symbol icons and actual pictures for landmarks

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn-ui, React Leaflet
- **Backend**: Supabase (database + Edge Functions), OpenAI GPT-4o-mini

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

## Setup Notes

- **Map & landmarks** – Work out of the box; the project uses built-in Supabase credentials.
- **AI Chat** – Requires `OPENAI_API_KEY` in your Supabase project: Edge Functions → Settings → add `OPENAI_API_KEY`.

For full setup details, troubleshooting, and local Edge Function development, see [ANALYSIS.md](./ANALYSIS.md).
