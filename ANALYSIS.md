# BayLore - Repository Analysis & Setup Guide

## Project Overview

**BayLore** is an interactive web application that helps users explore the historical significance of locations, landmarks, and cultural sites throughout the San Francisco Bay Area. The application features:

- **Interactive Map**: Leaflet-based map with landmark pinpoints
- **Landmark Popups**: Visual displays with historical information, dates, and history chunks
- **AI Chatbot**: GPT-4 powered chatbot for asking questions about Bay Area history, landmarks, and famous figures
- **Map Toggle**: Switch between symbol icons and actual pictures for landmarks

## Technology Stack

### Frontend
- **Vite** - Build tool and dev server
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn-ui** - UI component library (Radix UI based)
- **React Leaflet** - Map integration
- **React Router** - Routing
- **TanStack Query** - Data fetching and caching

### Backend
- **Supabase** - Backend-as-a-Service
  - Database (PostgreSQL)
  - Edge Functions (Deno runtime)
- **OpenAI API** - GPT-4o-mini for AI chat functionality

## Project Structure

```
baylore-0349e88c/
├── src/
│   ├── components/          # React components
│   │   ├── ChatInterface.tsx
│   │   ├── Header.tsx
│   │   ├── LandmarkPopup.tsx
│   │   ├── MapContainer.tsx
│   │   ├── MapToggleControl.tsx
│   │   └── ui/              # shadcn-ui components
│   ├── hooks/               # Custom React hooks
│   │   ├── useLandmarks.ts
│   │   └── useMapMarkers.ts
│   ├── integrations/
│   │   └── supabase/        # Supabase client & types
│   ├── pages/               # Page components
│   │   ├── Index.tsx        # Main page
│   │   └── NotFound.tsx
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
├── supabase/
│   ├── config.toml          # Supabase configuration
│   └── functions/
│       └── bay-area-chat/   # Edge Function for AI chat
│           └── index.ts
├── public/                  # Static assets
├── package.json
├── vite.config.ts
└── tailwind.config.ts
```

## Setup & Installation

### Prerequisites

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **npm** or **bun** (package manager)
3. **Supabase CLI** (for local development of Edge Functions) - [Install Guide](https://supabase.com/docs/guides/cli)
4. **OpenAI API Key** (for AI chat functionality)

### Step 1: Install Dependencies

Navigate to the project directory and install dependencies:

```bash
cd baylore-0349e88c
npm install
# OR if using bun:
bun install
```

### Step 2: Configure Supabase

The project is already configured to use a Supabase project:
- **Project ID**: `aocqfveoztmwntoexkpj`
- **URL**: `https://aocqfveoztmwntoexkpj.supabase.co`
- **Public Key**: Already configured in `src/integrations/supabase/client.ts`

If you need to use a different Supabase project:
1. Update `supabase/config.toml` with your project ID
2. Update `src/integrations/supabase/client.ts` with your Supabase URL and anon key

### Step 3: Configure OpenAI API Key (for Edge Function)

The AI chat feature requires an OpenAI API key. To set it up:

**Option A: Using Supabase Dashboard (Production)**
1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **Settings**
3. Add environment variable: `OPENAI_API_KEY` = `your-api-key-here`

**Option B: Using Supabase CLI (Local Development)**
1. Create a `.env` file in the `supabase/functions/bay-area-chat/` directory:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```
2. Or set it when running the function locally:
   ```bash
   supabase functions serve bay-area-chat --env-file supabase/.env.local
   ```

### Step 4: Run the Application

#### Development Mode

Start the Vite development server:

```bash
npm run dev
# OR
bun run dev
```

The application will be available at:
- **Local**: `http://localhost:8080`
- **Network**: `http://[your-ip]:8080` (accessible from other devices on your network)

#### Production Build

Build for production:

```bash
npm run build
# OR
bun run build
```

Preview the production build:

```bash
npm run preview
# OR
bun run preview
```

### Step 5: Run Supabase Edge Functions (Local Development)

If you want to test the Edge Function locally:

1. **Start Supabase locally** (requires Docker):
   ```bash
   supabase start
   ```

2. **Serve the Edge Function locally**:
   ```bash
   supabase functions serve bay-area-chat --env-file supabase/.env.local
   ```

3. The function will be available at: `http://localhost:54321/functions/v1/bay-area-chat`

**Note**: For production, the Edge Function is automatically deployed to Supabase when you push to your repository (if CI/CD is configured) or manually via:
```bash
supabase functions deploy bay-area-chat
```

## Available Scripts

- `npm run dev` - Start development server (port 8080)
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Key Features Implementation

### 1. Interactive Map
- Uses **Leaflet** and **React Leaflet** for map rendering
- Displays landmarks with custom markers
- Supports location selection and landmark popups

### 2. AI Chatbot
- Powered by **OpenAI GPT-4o-mini**
- Implemented as a Supabase Edge Function
- Context-aware based on user's current map location
- Specialized in Bay Area history and culture

### 3. Landmark System
- Landmarks stored in Supabase database
- Custom icons and images for each landmark
- Popup windows with historical information

## Environment Variables

### Frontend
No environment variables required for frontend (Supabase credentials are hardcoded in client.ts).

### Backend (Edge Function)
- `OPENAI_API_KEY` - Required for AI chat functionality

## Development Notes

- The app uses **Vite** with React SWC plugin for fast HMR
- Port is configured to **8080** in `vite.config.ts`
- Uses path aliases: `@/` maps to `./src/`
- TypeScript strict mode enabled
- ESLint configured for code quality

## Troubleshooting

### Port Already in Use
If port 8080 is already in use, modify `vite.config.ts`:
```typescript
server: {
  port: 3000, // or any available port
}
```

### Supabase Connection Issues
- Verify the Supabase URL and anon key in `src/integrations/supabase/client.ts`
- Check if your Supabase project is active
- Ensure CORS is properly configured in Supabase

### AI Chat Not Working
- Verify `OPENAI_API_KEY` is set in Supabase Edge Function environment
- Check Edge Function logs in Supabase dashboard
- Ensure the function is deployed: `supabase functions deploy bay-area-chat`

### Map Not Loading
- Check browser console for Leaflet/CSS loading errors
- Ensure Leaflet CSS is imported in your main CSS file
- Verify map tile provider (default is OpenStreetMap)

## Next Steps

1. **Set up your OpenAI API key** in Supabase Edge Functions
2. **Install dependencies**: `npm install`
3. **Run the dev server**: `npm run dev`
4. **Open browser**: Navigate to `http://localhost:8080`
5. **Test the application**: Click on the map, explore landmarks, and try the AI chat

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Leaflet Documentation](https://leafletjs.com/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

