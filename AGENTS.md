# CLAUDE.md — AI Language Learning App

You are an expert React Native + Expo engineer helping build a production-quality mobile application as a university capstone project. The app must be technically solid, well-structured, and demonstrable to an academic review board — while remaining maintainable and realistic to build within a student project timeline.

Write clean, maintainable, production-quality code. Prioritize clarity and correctness. Avoid over-engineering, but do not cut corners that would undermine the quality expected of a capstone project.

---

## Project Overview

A Duolingo-inspired AI-powered language learning mobile app built with Expo and React Native.

Core features:

- Interactive lessons (video, audio, chat-based AI tutor)
- Vocabulary review and spaced repetition
- XP system and streak tracking
- Language selection and progress analytics
- User authentication with social login support
- Beautiful, polished mobile-first UI

The app must work end-to-end: real authentication, real data persistence, real AI interactions. It should be deployable and demonstrable on a physical device.

---

## Tech Stack

| Layer              | Technology                                     |
| ------------------ | ---------------------------------------------- |
| Framework          | Expo (React Native)                            |
| Language           | TypeScript                                     |
| Routing            | Expo Router                                    |
| Styling            | NativeWind / Tailwind CSS                      |
| State management   | Zustand + AsyncStorage                         |
| Backend / Database | Supabase (Auth, PostgreSQL, Storage, Realtime) |
| AI / Video         | Stream / GetStream + Stream Vision Agents      |
| Secrets / AI calls | Expo API Routes or a lightweight backend       |

Do not introduce new major libraries without a clear reason. If a library would significantly improve the implementation, recommend it and wait for approval before adding it.

---

## Architecture

```
app/
  (auth)/           ← login, register, OAuth callback screens
  (tabs)/           ← main tab navigator after login
  lesson/           ← lesson flow screens
  api/              ← Expo API routes (server-side only: tokens, AI calls)
components/         ← reusable UI components
constants/          ← colors, images, typography, config
data/               ← hardcoded lesson content (typed TS)
hooks/              ← custom hooks (useAuth, useLesson, etc.)
lib/
  supabase.ts       ← Supabase client singleton
  stream.ts         ← Stream client helpers
  api.ts            ← internal API call helpers
  cn.ts             ← NativeWind className utility
store/              ← Zustand stores
types/              ← shared TypeScript types
assets/
  images/
  fonts/
```

### Routing rules

- `app/` is for screens only. Screens compose components and call hooks or stores. No large UI blocks or business logic directly in screens.
- Auth screens live in `(auth)/`. After login, users are redirected to `(tabs)/`.
- Lesson screens live in `lesson/` because they are outside the tab navigator.
- API routes in `app/api/` are server-side only. Never put secrets or AI calls in the client.

---

## Supabase Rules

Supabase is the single source of truth for all persistent data.

### Client setup

Create and export a single Supabase client from `lib/supabase.ts`. Never instantiate the client elsewhere.

```ts
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
```

### Authentication

Use Supabase Auth for all authentication. Supported flows:

- OAuth (Google, Facebook) via `supabase.auth.signInWithOAuth()` — requires a custom dev build, not Expo Go
- Email/password via `supabase.auth.signInWithPassword()`
- Session persistence is handled automatically via AsyncStorage

Never build custom auth logic. Always go through Supabase Auth.

For OAuth on mobile, the redirect URI must use the app's custom scheme (e.g. `myapp://auth/callback`). Register this scheme in `app.json` and in the Supabase dashboard under Authentication → URL Configuration.

### Database

Use Supabase PostgreSQL for all server-side data: user profiles, lesson progress, XP, streaks, and any content that needs to persist across devices.

Always enable Row Level Security (RLS) on every table. Never query Supabase from the client without appropriate RLS policies in place.

Use Supabase Storage for user-uploaded files or audio assets where applicable.

### Environment variables

Store all Supabase credentials in `.env.local`. Never commit secrets.

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Server-side secrets (service role key, AI API keys, Stream secrets) go in `.env.local` but are only accessed inside `app/api/` routes — never in client code.

---

## State Management Rules

| What                                                    | Where                                            |
| ------------------------------------------------------- | ------------------------------------------------ |
| Auth session                                            | Supabase Auth (source of truth) + `useAuth` hook |
| Server data (progress, XP, profile)                     | Supabase DB, fetched via hooks                   |
| Local UI state (current lesson step, animations)        | `useState` / `useReducer`                        |
| Cross-screen client state (selected language, settings) | Zustand                                          |
| Offline-tolerant values (cached XP, streak)             | Zustand + AsyncStorage                           |

Do not duplicate server state in Zustand. Zustand is for client-only state that does not need to live in the database, or for caching values that need to survive offline.

---

## Data Layer Rules

### Lesson content

Use typed TypeScript files in `data/` for hardcoded lesson content (questions, vocabulary, audio references). Do not introduce a CMS unless explicitly requested.

```
data/
  languages.ts
  lessons.ts
  vocabulary.ts
```

All content types must be defined in `types/`.

### User progress

Lesson completion, XP, and streak data must persist to Supabase so users can resume across sessions and devices. Do not rely solely on AsyncStorage for progress that matters.

---

## API Routes (Server-Side)

Use Expo API Routes (`app/api/`) for any operation that requires secrets:

- Generating Stream tokens
- Calling AI APIs (OpenAI, Anthropic, etc.)
- Any server-side business logic

These routes run on the server. Never expose secret keys in the mobile bundle.

---

## UI Rules

### General

- Mobile-first, playful, polished — inspired by Duolingo
- Rounded cards, clear spacing, large touch targets
- Progress indicators and friendly empty states
- Simple animations where they improve the experience

### Styling

Use NativeWind (Tailwind CSS) classes for all styling. Check the installed NativeWind version in `package.json` and follow that version's syntax exactly.

Use `StyleSheet` or inline styles only for the following exceptions:

| Component / Case         | Reason                             |
| ------------------------ | ---------------------------------- |
| `SafeAreaView`           | `className` not reliably supported |
| `Animated.View`          | Animated style values              |
| Dynamic / runtime styles | Computed at runtime                |
| Platform-specific props  | iOS/Android-only behaviour         |
| Complex transforms       | Transform arrays                   |

For `SafeAreaView`, always use inline styles:

```tsx
// ✅ Correct
<SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>

// ❌ Wrong
<SafeAreaView className="flex-1 bg-white">
```

Add reusable class utilities to `global.css` using BEM naming when patterns repeat.

### Images

Centralise all image imports in `constants/images.ts`. Never import image assets directly in screens or components.

```ts
// constants/images.ts
import mascot from '@/assets/images/mascot.png'
export const images = { mascot }

// Usage
<Image source={images.mascot} />
```

### Design replication

When a design reference is provided, match it exactly: layout, spacing, font sizes, colors, border radius, shadows, alignment, proportions. Do not approximate.

---

## TypeScript Rules

- Strict TypeScript throughout. No `any`.
- Define shared types in `types/`. Co-locate component-specific types with the component.
- Use Supabase's generated types where available (`supabase gen types typescript`).

---

## Error Handling

- All Supabase calls must handle errors explicitly. Never ignore the `error` field in Supabase responses.
- API routes must return consistent error responses with appropriate HTTP status codes.
- Show user-friendly error messages in the UI. Never expose raw error objects to the user.
- Network errors and session expiry must be handled gracefully.

---

## Feature Implementation Process

When implementing any feature:

1. Read this file first.
2. Identify all files that need to change.
3. Check whether Supabase schema changes are needed — if so, write the SQL migration first.
4. Keep changes focused. Do not rewrite unrelated code.
5. Follow existing patterns in the codebase.
6. Handle loading and error states, not just the happy path.
7. Test the feature end-to-end before marking it done.
8. Run `npm run lint` and `npm run typecheck` and fix all errors.

---

## Stream / Vision Agent Rules

Use Stream for real-time video lessons and AI teacher sessions.

- Generate Stream user tokens server-side inside `app/api/`. Never expose the Stream secret key on the client.
- Stream Vision Agent sessions are initialised server-side and the session details passed to the client.
- Handle Stream connection errors gracefully in the UI.

---

## Git and Environment

- Keep `.env.local` out of version control. Commit a `.env.example` with placeholder values.
- Commit working, lint-clean code. Do not leave commented-out blocks or debug logs in committed code.

---

## Performance Considerations

- Use `FlashList` instead of `FlatList` for long scrollable lists (lesson lists, vocabulary lists).
- Lazy-load heavy screens where Expo Router supports it.
- Avoid unnecessary re-renders: memoize callbacks and derived values where it makes a measurable difference.
- Supabase queries should be scoped — never fetch more data than the screen needs.

---

## Superpowers

This project uses [Superpowers](https://github.com/obra/superpowers) — an agentic skills framework installed into Claude Code. Superpowers skills trigger automatically; you do not need to invoke them manually.

### How Superpowers fits into this project

Superpowers handles the **development workflow**. This file handles **project-specific context**. They work together — Superpowers tells the agent _how_ to work, AGENTS.md tells it _what_ to build and _how_ to build it.

### Skills and when they activate in this project

| Skill                              | When it activates                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **brainstorming**                  | Before any new feature. Agent clarifies requirements, explores design options, saves a spec before touching code. |
| **writing-plans**                  | After spec is approved. Breaks the feature into 2–5 minute tasks with exact file paths and verification steps.    |
| **subagent-driven-development**    | During implementation. Dispatches subagents per task with two-stage review (spec compliance, then code quality).  |
| **test-driven-development**        | During implementation. Enforces RED → GREEN → REFACTOR. No code written before a failing test exists.             |
| **systematic-debugging**           | When something is broken. Runs a structured root-cause process instead of guessing.                               |
| **requesting-code-review**         | Between tasks. Reviews against the plan and blocks progress on critical issues.                                   |
| **finishing-a-development-branch** | When all tasks are done. Verifies tests pass, presents merge/PR/discard options, cleans up worktrees.             |

### Project-specific Superpowers notes

- During **brainstorming**, always verify the proposed feature aligns with the Supabase schema before approving the spec. Schema changes are expensive to undo.
- During **writing-plans**, every task that touches Supabase must include the SQL migration as its first step.
- During **test-driven-development**, unit test pure logic (store actions, data transforms, validators). For UI and Supabase integration, prefer integration tests over mocks where practical.
- **Do not skip brainstorming** even for small features. Scope creep is the main risk in a capstone project with a fixed deadline.

---

## Communication Style

Be concise. When completing a task, explain:

1. What changed and why
2. Any Supabase schema or RLS changes required
3. How to test the feature on a device

If something is unclear or a better approach exists, say so before implementing.
