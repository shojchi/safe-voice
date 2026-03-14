# Safe Voice - Project Documentation & Architecture

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
- **Forms:** `@hookform/resolvers`
- **Utilities:** `uuid`, `date-fns`, `clsx`, `tailwind-merge`, `class-variance-authority`
- **Dev Tools:** `firebase-tools`, `@tailwindcss/postcss`, `@tailwindcss/typography`, `tw-animate-css`

## 3. Core Features & Routing

- **`/` (Home Dashboard):** Entry point with 6 navigation tiles: Crime/Suspicious Activity, Hazard/Disaster, Hazard Map, Investigator, Patrol Officer, and QR Code.
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
- **`/map` (Live Report Map):**
  - Displays both hazard/disaster and non-anonymous crime reports on an interactive Leaflet map.
  - Includes timeframe filtering (30m, 1h, 3h, 5h, 12h, 24h) and categorized map markers (Fire, Water, Weather, Traffic, Crime).
  - Anonymous crime reports are filtered out from the map display via the API route.
  - Polls the server every 10 seconds for near-real-time updates.
- **`/share` (Community QR Code):**
  - Generates a generic QR code linking to the app's homepage.
  - Full header layout with navigation and City of Montgomery branding.
  - Includes a print-optimized layout with a print-only footer.
  - Designed for printing posters, decals, or flyers to share the app with the community.

## 4. Directory Structure

```text
/
├── app/
│   ├── actions.ts                 # Server actions (saveStatement, assignCadNumber, fetchCases, etc.)
│   ├── globals.css                # Tailwind v4 import
│   ├── layout.tsx                 # Root layout with metadata and favicon
│   ├── page.tsx                   # Main landing dashboard (6 navigation tiles)
│   ├── investigator/              # Crime investigator routes
│   │   ├── page.tsx               # Case list with TEMPORARY badges
│   │   └── [caseId]/page.tsx      # Case details (crime + hazard specific views)
│   ├── map/                       # Live report map route (crime + hazard)
│   │   └── page.tsx
│   ├── officer/                   # Patrol officer route
│   │   └── page.tsx               # QR code generation for on-scene witness links
│   ├── report/                    # Public reporting portal
│   │   └── page.tsx               # Audio recording, AI processing, anonymity choice
│   ├── share/                     # Community QR code route
│   │   └── page.tsx               # Branded QR code for app sharing with print support
│   ├── witness/                   # Witness statement routes
│   │   ├── page.tsx               # Case ID entry page
│   │   └── [caseId]/page.tsx      # Audio recording with anonymity choice
│   └── api/
│       └── reports/route.ts       # API route for fetching map reports (filters anonymous crime)
├── components/
│   └── HazardMap.tsx              # Dynamic React-Leaflet map component
├── hooks/
│   └── use-mobile.ts             # Mobile detection hook
├── lib/
│   ├── db.ts                      # Mock database, schemas, seed data, case grouping logic
│   └── utils.ts                   # Utility functions (cn class merger)
├── public/
│   └── images/                    # Logo and favicon assets
├── .env.example                   # Environment variable templates
├── eslint.config.mjs              # ESLint configuration
├── metadata.json                  # App metadata
├── next.config.ts                 # Next.js configuration
├── package.json                   # Dependencies
├── postcss.config.mjs             # PostCSS config (Tailwind v4)
└── tsconfig.json                  # TypeScript configuration
```

## 5. Data Models (from `lib/db.ts`)

Currently, the app uses an in-memory mock database. When porting to a real backend (like Supabase, Firebase, or Postgres), use these interfaces:

```typescript
export interface Statement {
  id: string;
  caseId: string;
  type: "crime" | "hazard";
  location?: { lat: number; lng: number };
  transcript: string;
  structuredData: any; // Contains suspect/vehicle info OR hazard details (see §6 for full schema)
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
4. Otherwise, a new temporary case is created with an auto-generated name (based on `shortTitle`, `humanReadableLocation`, and time from the AI-extracted structured data).

Temporary cases can later be promoted to permanent cases via `assignCadNumber()` (a server action wrapper around the internal `updateCaseNumber()` function in `lib/db.ts`).

## 6. AI Integration Details

The project uses the `@google/genai` SDK.

- **Model:** `gemini-3-flash-preview`
- **Input:** Base64 encoded audio (`audio/webm` or `audio/mp4`) + Text Prompt.
- **Output:** Enforced JSON schema (`responseMimeType: "application/json"`).
- **Prompts:** Located in `app/report/page.tsx` and `app/witness/[caseId]/page.tsx`. The AI acts as an "expert police investigator" or "expert incident commander" depending on the report type.
- **Anonymity-aware:** Crime report structured data includes `isAnonymous`, `reporterName`, and `reporterPhone` fields based on the user's anonymity choice.
- **Additional AI-extracted fields:** Both crime and hazard schemas include `incidentType` (categorized as one of: Vehicle Crash, Violence / Assault, Theft / Burglary, Gunshot, Suspicious Activity, Fire / Hazard, Road Blockage, Other), `shortTitle` (1–3 word incident title), and `humanReadableLocation` (concise street or intersection name). These are used for auto-case naming in `findOrCreateTemporaryCase`.

## 7. Environment Variables

The app is designed to run in multiple environments: locally via Antigravity, in Google AI Studio, and deployed to production via Vercel.

```env
# Server-side API key (injected by AI Studio at runtime)
GEMINI_API_KEY="your_gemini_api_key_here"

# Primary client-side API key (used by AI Studio runtime)
NEXT_PUBLIC_USER_GEMINI_API_KEY="your_gemini_api_key_here"

# Fallback client-side API key (used for local dev / Vercel deployment)
NEXT_PUBLIC_GEMINI_API_KEY="your_gemini_api_key_here"

# App URL (injected by AI Studio with the Cloud Run service URL)
APP_URL="your_app_url_here"
```

The client-side code checks `NEXT_PUBLIC_USER_GEMINI_API_KEY` first, then falls back to `NEXT_PUBLIC_GEMINI_API_KEY`. Set whichever is appropriate for your environment.

See [`.env.example`](.env.example) for the full template.

## 8. Known Quirks & Workarounds

- **Leaflet SSR Issue:** Leaflet requires the `window` object. The `HazardMap` component MUST be imported dynamically with `ssr: false` in Next.js (see `app/map/page.tsx`).
- **Audio MIME Types:** Safari and Chrome handle MediaRecorder MIME types differently. The recording logic in `/report` and `/witness/[caseId]` includes fallbacks for `audio/webm`, `audio/mp4`, and `audio/aac`.

## 9. Next Steps / Roadmap

1. Replace the in-memory `lib/db.ts` with a real database (e.g., PostgreSQL via Prisma or Supabase).
2. Add authentication (e.g., NextAuth/Clerk) to protect the `/investigator` and `/officer` routes.
3. Upgrade map from 10-second polling to real-time WebSockets for instant updates.
4. Expand the `Case` model with `title`, `priority`, `updatedAt`, and other fields when moving to a real database.
