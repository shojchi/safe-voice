# Safe Voice - Project Documentation & Architecture

This document serves as the primary context file for porting the "Safe Voice" project between different AI coding environments (like AI Studio and Antigravity). It contains the complete architectural overview, tech stack, data models, and feature breakdown.

## 1. Project Overview

**Safe Voice** is an AI-powered, anonymous reporting and witness statement collection system designed for public safety and emergency response. It allows citizens and on-scene witnesses to submit audio reports of crimes or hazards. Officers can generate secure QR-code links for anonymous statement collection at incident scenes. The system uses the Google Gemini API to transcribe audio, extract structured data (suspect details, hazard types, locations), evaluate credibility, and flag critical information.

## 2. Tech Stack

- **Framework:** Next.js 15.x (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Icons:** `lucide-react`
- **Map Integration:** `leaflet` & `react-leaflet`
- **AI Integration:** `@google/genai` (model: `gemini-3-flash-preview` for audio processing and structured JSON output)
- **Animations:** `motion` (Framer Motion)
- **QR Codes:** `qrcode.react`
- **Utilities:** `uuid`, `date-fns`, `clsx`, `tailwind-merge`, `class-variance-authority`

## 3. Core Features & Routing

- **`/` (Home Dashboard):** Entry point with navigation tiles for all six personas: Public Portal, Hazard Map, Patrol Officer, Witness, Investigator, and Community Poster.
- **`/report` (Public Report Portal):**
  - Allows users to select between "Crime/Suspicious Activity" and "Hazard/Disaster".
  - Captures audio via the browser's MediaRecorder API.
  - Sends audio directly to Gemini to extract a transcript and structured JSON data.
- **`/officer` (Patrol Officer Dashboard):**
  - Allows officers to enter a CAD incident number and generate a secure QR code.
  - The QR code links to `/witness/[caseId]` for on-scene anonymous statement collection.
  - Includes copy-to-clipboard and print functionality for the generated link.
- **`/witness` & `/witness/[caseId]` (Witness Statement):**
  - `/witness` — Entry page where a witness can manually enter a Case ID or link code.
  - `/witness/[caseId]` — Audio recording page tied to a specific case. Statements are AI-processed and saved to the case.
- **`/investigator` & `/investigator/[caseId]` (Investigator Dashboard):**
  - Displays aggregated crime reports.
  - Shows AI-generated credibility scores, corroborated/conflicting details, and extracted entities (suspect, vehicle, timeline).
- **`/map` (Live Hazard Map):**
  - Displays hazard/disaster reports on an interactive Leaflet map.
  - Includes timeframe filtering (e.g., Last 30m, Last 24h) and categorized map markers (Fire, Water, Weather, Traffic).
- **`/share` (Community Poster):**
  - Generates a generic QR code linking to the app's homepage.
  - Designed for printing posters, decals, or flyers to share the app with the community.

## 4. Directory Structure

```text
/
├── app/
│   ├── actions.ts                 # Server actions (createNewCase, fetchCases, fetchCaseDetails, fetchStatements, saveStatement)
│   ├── globals.css                # Tailwind v4 import
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Main landing dashboard (6 navigation tiles)
│   ├── investigator/              # Crime investigator routes
│   │   ├── page.tsx               # Case list
│   │   └── [caseId]/page.tsx      # Specific case details & statements
│   ├── map/                       # Live hazard map route
│   │   └── page.tsx
│   ├── officer/                   # Patrol officer route
│   │   └── page.tsx               # QR code generation for on-scene witness links
│   ├── report/                    # Public reporting portal
│   │   └── page.tsx               # Audio recording & AI processing (crime/hazard)
│   ├── share/                     # Community poster route
│   │   └── page.tsx               # Generic QR code for app sharing
│   ├── witness/                   # Witness statement routes
│   │   ├── page.tsx               # Case ID entry page
│   │   └── [caseId]/page.tsx      # Audio recording tied to a specific case
│   └── api/
│       └── reports/route.ts       # API route for fetching map reports
├── components/
│   └── HazardMap.tsx              # Dynamic React-Leaflet map component
├── hooks/
│   └── use-mobile.ts             # Mobile detection hook
├── lib/
│   ├── db.ts                      # Mock database, schemas, and initial seed data
│   └── utils.ts                   # Utility functions (cn class merger)
├── public/                        # Static assets
├── package.json                   # Dependencies
└── postcss.config.mjs             # PostCSS config (Tailwind v4)
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
  createdAt: string;
  status: "open" | "closed";
}
```

> **Note:** The `Case` model is intentionally minimal for the current MVP. Fields like `title`, `priority`, and `updatedAt` are planned for a future iteration when a real database is introduced.

## 6. AI Integration Details

The project uses the `@google/genai` SDK.

- **Model:** `gemini-3-flash-preview`
- **Input:** Base64 encoded audio (`audio/webm` or `audio/mp4`) + Text Prompt.
- **Output:** Enforced JSON schema (`responseMimeType: "application/json"`).
- **Prompts:** Located in `app/report/page.tsx` and `app/witness/[caseId]/page.tsx`. The AI acts as an "expert police investigator" or "expert incident commander" depending on the report type.

## 7. Environment Variables

The app is designed to run in multiple environments: locally via Antigravity, in Google AI Studio, and deployed to production via Vercel.

```env
# Primary API key (used by AI Studio runtime)
NEXT_PUBLIC_USER_GEMINI_API_KEY="your_gemini_api_key_here"

# Fallback API key (used for local dev / Vercel deployment)
NEXT_PUBLIC_GEMINI_API_KEY="your_gemini_api_key_here"
```

The client-side code checks `NEXT_PUBLIC_USER_GEMINI_API_KEY` first, then falls back to `NEXT_PUBLIC_GEMINI_API_KEY`. Set whichever is appropriate for your environment.

## 8. Known Quirks & Workarounds

- **Leaflet SSR Issue:** Leaflet requires the `window` object. The `HazardMap` component MUST be imported dynamically with `ssr: false` in Next.js (see `app/map/page.tsx`).
- **Audio MIME Types:** Safari and Chrome handle MediaRecorder MIME types differently. The recording logic in `/report` and `/witness/[caseId]` includes fallbacks for `audio/webm`, `audio/mp4`, and `audio/aac`.

## 9. Next Steps / Roadmap

1. Replace the in-memory `lib/db.ts` with a real database (e.g., PostgreSQL via Prisma or Supabase).
2. Add authentication (e.g., NextAuth/Clerk) to protect the `/investigator` and `/officer` routes.
3. Implement real-time WebSockets for the `/map` so it updates instantly without polling.
4. Expand the `Case` model with `title`, `priority`, `updatedAt`, and other fields.
