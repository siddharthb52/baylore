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

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 8080) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Setup Notes

- **Map & landmarks** – Work out of the box; the project uses built-in Supabase credentials.
- **AI Chat** – Requires `OPENAI_API_KEY` in your Supabase project: Edge Functions → Settings → add `OPENAI_API_KEY`.

For full setup details, troubleshooting, and local Edge Function development, see [ANALYSIS.md](./ANALYSIS.md).

## Demo


<img width="1914" height="775" alt="baylore-home-pic" src="https://github.com/user-attachments/assets/0e899afd-1de6-4e86-b803-08dea0441dd4" />

<img width="1903" height="778" alt="baylore-sunnyvale" src="https://github.com/user-attachments/assets/f16decc4-a52d-4504-b090-dc3cda12e70f" />

<img width="1919" height="783" alt="image" src="https://github.com/user-attachments/assets/88c94e8e-b7d9-4499-b8ae-18d35c00f94e" />

