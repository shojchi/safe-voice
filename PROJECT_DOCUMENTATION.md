# Safe Voice - Project Documentation & Architecture

This document serves as the primary context file for porting the "Safe Voice" project between different AI coding environments (like AI Studio and Antigravity). It contains the complete architectural overview, tech stack, data models, and feature breakdown.

## 1. Project Overview
**Safe Voice** is an AI-powered, anonymous reporting system designed for public safety and emergency response. It allows citizens to submit audio reports of crimes or hazards. The system uses the Google Gemini API to transcribe the audio, extract structured data (suspect details, hazard types, locations), evaluate credibility, and flag critical information.

## 2. Tech Stack
* **Framework:** Next.js 15.x (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS v4
* **Icons:** `lucide-react`
* **Map Integration:** `leaflet` & `react-leaflet`
* **AI Integration:** `@google/genai` (Gemini 3.1 Flash Preview for audio processing and structured JSON output)
* **Animations:** `motion` (Framer Motion)

## 3. Core Features & Routing
* **`/` (Home Dashboard):** Entry point with navigation to the Public Portal, Investigator Dashboard, and Live Hazard Map.
* **`/report` (Public Report Portal):** 
  * Allows users to select between "Crime/Suspicious Activity" and "Hazard/Disaster".
  * Captures audio via the browser's MediaRecorder API.
  * Sends audio directly to Gemini to extract a transcript and structured JSON data.
* **`/investigator` & `/investigator/[caseId]` (Investigator Dashboard):**
  * Displays aggregated crime reports.
  * Shows AI-generated credibility scores, corroborated/conflicting details, and extracted entities (suspect, vehicle, timeline).
* **`/map` (Live Hazard Map):**
  * Displays hazard/disaster reports on an interactive Leaflet map.
  * Includes timeframe filtering (e.g., Last 30m, Last 24h) and categorized map markers (Fire, Water, Weather, Traffic).

## 4. Directory Structure
```text
/
├── app/
│   ├── actions.ts                 # Server actions for DB operations (saveStatement, fetchReports)
│   ├── globals.css                # Tailwind imports
│   ├── layout.tsx                 # Root layout with fonts (Inter, JetBrains Mono)
│   ├── page.tsx                   # Main landing dashboard
│   ├── investigator/              # Crime investigator routes
│   │   ├── page.tsx               # Case list
│   │   └── [caseId]/page.tsx      # Specific case details & statements
│   ├── map/                       # Live hazard map route
│   │   └── page.tsx               
│   ├── report/                    # Public reporting portal
│   │   └── page.tsx               # Audio recording & AI processing
│   └── api/
│       └── reports/route.ts       # API route for fetching map reports
├── components/
│   └── HazardMap.tsx              # Dynamic React-Leaflet map component
├── lib/
│   └── db.ts                      # Mock database, schemas, and initial seed data
├── public/                        # Static assets
├── .env.example                   # Environment variable templates
├── package.json                   # Dependencies
└── tailwind.config.ts / postcss   # Tailwind v4 configuration
```

## 5. Data Models (from `lib/db.ts`)
Currently, the app uses an in-memory mock database. When porting to a real backend (like Supabase, Firebase, or Postgres), use these interfaces:

```typescript
export type ReportType = "crime" | "hazard";

export interface Statement {
  id: string;
  caseId: string;
  type: ReportType;
  location?: { lat: number; lng: number };
  transcript: string;
  structuredData: any; // Contains suspect/vehicle info OR hazard details
  credibilityScore: number;
  corroboratedDetails: string[];
  conflictingDetails: string[];
  createdAt: string;
}

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  status: "open" | "closed" | "investigating";
  priority: "high" | "medium" | "low";
  createdAt: string;
  updatedAt: string;
}
```

## 6. AI Integration Details
The project uses the `@google/genai` SDK.
* **Model:** `gemini-3-flash-preview`
* **Input:** Base64 encoded audio (`audio/webm` or `audio/mp4`) + Text Prompt.
* **Output:** Enforced JSON schema (`responseMimeType: "application/json"`).
* **Prompts:** Located in `app/report/page.tsx`. The AI acts as an "expert police investigator" or "expert incident commander" depending on the report type.

## 7. Environment Variables
To run this project in any environment, the following environment variables are required:
```env
# Required for the audio-to-text and structuring features
NEXT_PUBLIC_GEMINI_API_KEY="your_gemini_api_key_here"

# Optional: For self-referential absolute URLs if needed
APP_URL="http://localhost:3000"
```

## 8. Known Quirks & Workarounds
* **Leaflet SSR Issue:** Leaflet requires the `window` object. The `HazardMap` component MUST be imported dynamically with `ssr: false` in Next.js (see `app/map/page.tsx`).
* **Audio MIME Types:** Safari and Chrome handle MediaRecorder MIME types differently. The recording logic in `/report` includes fallbacks for `audio/webm`, `audio/mp4`, and `audio/aac`.

## 9. Next Steps / Roadmap for Antigravity
If continuing development in Antigravity, recommended next steps are:
1. Replace the in-memory `lib/db.ts` with a real database (e.g., PostgreSQL via Prisma or Supabase).
2. Add authentication (e.g., NextAuth/Clerk) to protect the `/investigator` routes.
3. Implement real-time WebSockets for the `/map` so it updates instantly without polling.
