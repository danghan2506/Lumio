# Design Specification: Project README.md for Lumio

**Date:** 2026-08-18  
**Topic:** Comprehensive Project Documentation & README.md  
**Status:** Approved  

---

## 1. Executive Summary
Lumio is a production-grade, AI-powered language learning mobile application built with Expo (React Native) and TypeScript. The application combines interactive lessons, gamified quiz/translation practices, and real-time 1-on-1 AI video tutoring powered by Stream Video and a dedicated Python Vision Agent.

The purpose of `README.md` is to serve as the definitive entry point for developers and reviewers, presenting an overview of Lumio's features, architecture, technical stack, environment setup, and testing workflow in English with a polished product and engineering presentation.

---

## 2. Document Structure & Content Sections

### 2.1 Hero & Branding
- **Title & Badge Bar:**
  - App Name: Lumio
  - Tagline: *"Light up a new language."*
  - Badges: Expo SDK 54, React Native 0.81, TypeScript 5.9, Supabase, Stream Video, Tailwind CSS / NativeWind, Jest.
- **Short Overview:** Concise explanation of Lumio's mission, user experience, and core differentiators (real-time video agent + gamified daily habits).

### 2.2 Key Features
1. **Interactive AI Video Tutor (Stream + Vision Agent):**
   - Live 1-on-1 video/audio conversation practice.
   - Vision-capable AI tutor analyzing speech and visual prompts.
   - Automatic lesson completion synchronization when sessions finish.
2. **Dynamic Practice Activities:**
   - **Translation & Sentence Builder:** Interactive word bank selection, syntax ordering, real-time validation.
   - **Multiple Choice Quizzes:** Rapid knowledge checks with instant feedback and XP rewards.
3. **Gamification & Habit Loop:**
   - XP accumulation, dynamic streaks, mastery statistics, and lesson progression.
4. **Persistent Cloud Architecture:**
   - Supabase Auth (social/email auth) + PostgreSQL with Row-Level Security (RLS).
5. **Mobile-First UI / UX:**
   - Crafted with NativeWind (Tailwind CSS v4), custom typography (`Fredoka`, `Plus Jakarta Sans`), and Reanimated micro-interactions.

### 2.3 System Architecture & Data Flow
- **Mermaid Architecture Diagram:**
  - Mobile Client (React Native + Expo Router)
  - Backend API Routes (`app/api/stream/*`)
  - Supabase Cloud (Postgres DB, RLS, Storage, Auth)
  - Stream Video Edge Network (WebRTC Video/Audio Calls)
  - Python Vision Agent (`vision-agent/agent.py` running with OpenAI / Vision LLM)
- **Tech Stack Summary Table:**
  - Framework: Expo SDK 54 / React Native 0.81 / React 19
  - Navigation: Expo Router v6
  - Styling: NativeWind v5 / Tailwind CSS v4
  - State: Zustand + AsyncStorage
  - Database & Auth: Supabase (PostgreSQL + RLS)
  - Video & AI: `@stream-io/video-react-native-sdk` + Python Vision Agent (`uv`)
  - Quality Assurance: Jest, `@testing-library/react-native`, ESLint, TypeScript

### 2.4 Project Structure
- Tree diagram illustrating major directories:
  - `app/`: Expo Router screens and API routes
  - `components/`: Modular UI, learn, and practice components
  - `hooks/`: Custom state and data hooks (`useMultipleChoiceQuiz`, `useTranslationQuiz`, `useStreamLessonCall`, etc.)
  - `lib/`: Supabase, Stream, and utility helpers
  - `types/`: Shared TypeScript domain definitions
  - `vision-agent/`: Python Stream Vision Agent service
  - `supabase/`: Database schemas and migrations
  - `__tests__/`: Unit and integration test suites

### 2.5 Getting Started & Setup Guide
1. **Prerequisites:**
   - Node.js >= 18, npm
   - Python >= 3.10 + `uv`
   - Android Studio / Xcode / Expo Go
2. **Environment Variables Configuration:**
   - Root `.env.local` template (Supabase URL/Anon key, Stream API key/secret)
   - `vision-agent/.env` template (Stream credentials, OpenAI API key)
3. **Installation & Running:**
   - Install dependencies: `npm install`
   - Run mobile app: `npx expo start` or `npm run android` / `npm run ios`
   - Run Vision Agent: `cd vision-agent && uv run agent.py`
   - Supabase database initialization note.

### 2.6 Testing & Verification
- Test commands:
  - `npm test`: Runs full Jest test suite
  - `npm run typecheck`: Runs strict TypeScript verification
  - `npm run lint`: Runs ESLint checks
  - Python tests: `cd vision-agent && uv run pytest`

### 2.7 License
- MIT License.

---

## 3. Spec Self-Review
- **Placeholder Scan:** No placeholders or "TBD"s. All paths, commands, and features match current codebase structure.
- **Internal Consistency:** Tech stack, packages, and paths correspond accurately to `package.json`, `app.json`, `vision-agent/pyproject.toml`, and codebase layout.
- **Scope Check:** Clear, cohesive single-file documentation update.
- **Ambiguity Check:** Explicit step-by-step instructions for running both mobile client and Python agent.
