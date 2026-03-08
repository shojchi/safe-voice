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

- **`/` (Home Dashboard):** Entry point with navigation tiles for all six personas: Crime Report, Hazard Report, Patrol Officer, Witness, Investigator, Hazard Map, and Community QR Code.
  - Crime and Hazard tiles deep-link to `/report?type=crime` and `/report?type=hazard` respectively.
- **`/report` (Public Report Portal):**
  - Allows users to select between "Crime/Suspicious Activity" and "Hazard/Disaster".
  - Supports URL parameter `?type=crime` or `?type=hazard` for direct deep linking.
  - **Anonymity choice flow (crime reports only):** Users choose between "Report Anonymously" and "Provide My Details" before recording.
  - **Contact form:** Non-anonymous reporters provide name and phone number.
  - Captures audio via the browser's MediaRecorder API.
  - Sends audio directly to Gemini to extract a transcript and structured JSON data.
  - Wraps content in a `<Suspense>` boundary for `useSearchParams` support.
- **`/officer` (Patrol Officer Dashboard):**
  - Allows officers to enter a CAD incident number and generate a secure QR code.
  - The QR code links to `/witness/[caseId]` for on-scene anonymous statement collection.
  - Includes copy-to-clipboard and print functionality for the generated link.
- **`/witness` & `/witness/[caseId]` (Witness Statement):**
  - `/witness` — Entry page where a witness can manually enter a Case ID or link code.
  - `/witness/[caseId]` — Audio recording page tied to a specific case.
  - **Anonymity choice flow:** Witnesses choose between anonymous and identified reporting.
  - **Contact form:** Non-anonymous witnesses provide name and phone number.
  - Statements are AI-processed and saved to the case.
- **`/investigator` & `/investigator/[caseId]` (Investigator Dashboard):**
  - Displays aggregated crime reports with a "TEMPORARY" badge for auto-created cases.
  - Shows AI-generated credibility scores, corroborated/conflicting details, and extracted entities.
  - **Crime reports:** Shows suspect description, vehicle, timeline, and location details.
  - **Hazard reports:** Shows specialized fields — hazard category, fire direction, wind speed/direction, trapped individuals, road blockages, and visibility.
- **`/map` (Live Hazard Map):**
  - Displays hazard/disaster reports on an interactive Leaflet map.
  - Includes timeframe filtering (e.g., Last 30m, Last 24h) and categorized map markers (Fire, Water, Weather, Traffic).
  - Anonymous crime reports are filtered out from the map display.
- **`/share` (Community QR Code):**
  - Generates a generic QR code linking to the app's homepage.
  - Full header layout with navigation.
  - Designed for printing posters, decals, or flyers to share the app with the community.

## 4. Directory Structure

```text
/
├── app/
│   ├── actions.ts                 # Server actions (saveStatement, assignCadNumber, fetchCases, etc.)
│   ├── globals.css                # Tailwind v4 import
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Main landing dashboard (7 navigation tiles)
│   ├── investigator/              # Crime investigator routes
│   │   ├── page.tsx               # Case list with TEMPORARY badges
│   │   └── [caseId]/page.tsx      # Case details (crime + hazard specific views)
│   ├── map/                       # Live hazard map route
│   │   └── page.tsx
│   ├── officer/                   # Patrol officer route
│   │   └── page.tsx               # QR code generation for on-scene witness links
│   ├── report/                    # Public reporting portal
│   │   └── page.tsx               # Audio recording, AI processing, anonymity choice
│   ├── share/                     # Community QR code route
│   │   └── page.tsx               # Generic QR code for app sharing
│   ├── witness/                   # Witness statement routes
│   │   ├── page.tsx               # Case ID entry page
│   │   └── [caseId]/page.tsx      # Audio recording with anonymity choice
│   └── api/
│       └── reports/route.ts       # API route for fetching map reports (filters anonymous)
├── components/
│   └── HazardMap.tsx              # Dynamic React-Leaflet map component
├── hooks/
│   └── use-mobile.ts             # Mobile detection hook
├── lib/
│   ├── db.ts                      # Mock database, schemas, seed data, case grouping logic
│   └── utils.ts                   # Utility functions (cn class merger)
├── public/                        # Static assets
├── .env.example                   # Environment variable templates
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
  isTemporary?: boolean;
  location?: { lat: number; lng: number };
}
```

### Auto-Case Grouping (`findOrCreateTemporaryCase`)

When a public report is submitted (without an explicit case ID), the system automatically groups it:

1. Searches for existing open, temporary cases created within the last **30 minutes**.
2. Uses **Haversine distance** to find cases within **500 meters** of the new report's location.
3. If a match is found, the report is added to the existing case.
4. Otherwise, a new temporary case is created with an auto-generated name (based on incident type, location, and time).

Temporary cases can later be promoted to permanent cases via `assignCadNumber()` (used by patrol officers assigning official CAD numbers).

## 6. AI Integration Details

The project uses the `@google/genai` SDK.

- **Model:** `gemini-3-flash-preview`
- **Input:** Base64 encoded audio (`audio/webm` or `audio/mp4`) + Text Prompt.
- **Output:** Enforced JSON schema (`responseMimeType: "application/json"`).
- **Prompts:** Located in `app/report/page.tsx` and `app/witness/[caseId]/page.tsx`. The AI acts as an "expert police investigator" or "expert incident commander" depending on the report type.
- **Anonymity-aware:** Crime report structured data includes `isAnonymous`, `reporterName`, and `reporterPhone` fields based on the user's anonymity choice.

## 7. Environment Variables

The app is designed to run in multiple environments: locally via Antigravity, in Google AI Studio, and deployed to production via Vercel.

```env
# Primary API key (used by AI Studio runtime)
NEXT_PUBLIC_USER_GEMINI_API_KEY="your_gemini_api_key_here"

# Fallback API key (used for local dev / Vercel deployment)
NEXT_PUBLIC_GEMINI_API_KEY="your_gemini_api_key_here"
```

The client-side code checks `NEXT_PUBLIC_USER_GEMINI_API_KEY` first, then falls back to `NEXT_PUBLIC_GEMINI_API_KEY`. Set whichever is appropriate for your environment.

See [`.env.example`](.env.example) for the full template.

## 8. Known Quirks & Workarounds

- **Leaflet SSR Issue:** Leaflet requires the `window` object. The `HazardMap` component MUST be imported dynamically with `ssr: false` in Next.js (see `app/map/page.tsx`).
- **Audio MIME Types:** Safari and Chrome handle MediaRecorder MIME types differently. The recording logic in `/report` and `/witness/[caseId]` includes fallbacks for `audio/webm`, `audio/mp4`, and `audio/aac`.

## 9. Next Steps / Roadmap

1. Replace the in-memory `lib/db.ts` with a real database (e.g., PostgreSQL via Prisma or Supabase).
2. Add authentication (e.g., NextAuth/Clerk) to protect the `/investigator` and `/officer` routes.
3. Implement real-time WebSockets for the `/map` so it updates instantly without polling.
4. Expand the `Case` model with `title`, `priority`, `updatedAt`, and other fields when moving to a real database.
