<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SafeVoice

AI-powered anonymous reporting and witness statement collection system for public safety and emergency response.

## Run Locally

**Prerequisites:** Node.js

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```
2. Set your Gemini API key in `.env.local`:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY="your_gemini_api_key_here"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the app:
   ```bash
   npm run dev
   ```

## Deploy to Vercel

Set `NEXT_PUBLIC_GEMINI_API_KEY` as an environment variable in your Vercel project settings.

## AI Studio

View the app in AI Studio: https://ai.studio/apps/c1983080-b69a-476e-a225-55069dd24ff9

## Full Documentation

See [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) for the complete architecture, data models, and feature breakdown.
