# Sequence Diagrams

These PlantUML sources describe Lumio's target architecture in English. They are suitable for a capstone report and remain grounded in the existing Supabase RPCs and Stream API routes.

> **Implementation note:** Diagrams 02 and 03 are target/proposed flows. The persistence functions already exist in `lib/api.ts` and the Supabase migration, but the current UI does not yet call them. Diagrams 01 and 04 reflect flows implemented in the current application.

## 1. Email/Password Authentication and Initial Routing

**Purpose:** Explain how a learner signs in or registers, receives a persisted Supabase session, and is routed either to language selection or the authenticated tab navigator.

The authentication form sends validated credentials through the Supabase client. After a successful session is persisted locally, the root auth-state listener reads the persisted language-selection state. New learners are directed to language selection, while returning learners proceed to the main application.

Source: `01-email-password-authentication.puml`

## 2. Target Language Selection Persistence

**Purpose:** Explain how the selected target language is stored consistently across devices and retained locally for startup routing.

The intended flow persists the learner's choice through the authenticated `set_active_language` RPC. The transaction validates the language, deactivates the previously active language, and activates the selected one in `user_languages`. The application then stores the same selection locally and opens the learning dashboard.

Source: `02-language-selection-persistence.puml`

## 3. Target Lesson Completion, XP, and Streak Update

**Purpose:** Explain how completion data produces idempotent progress and daily learning activity updates.

After the learner completes the final activity, the lesson screen submits the final state and XP total to `record_lesson_progress`. The database function prevents duplicate XP and completion increments, then atomically updates `lesson_progress` and `daily_activity`. The screen refreshes the learner's progress summary and presents the completion result.

Source: `03-lesson-completion-xp-streak.puml`

## 4. AI Teacher Audio Session Initialization

**Purpose:** Explain the secure creation of a Stream audio call and the subsequent AI teacher session.

The mobile client obtains an authenticated Stream session through the server-side session route before connecting to the audio call. After the learner joins, the agent route validates the request, builds authoritative lesson context from Supabase, configures the Stream call for the teacher, and starts a Vision Agent session. On exit, the client stops the agent session and disconnects from the call.

Source: `04-ai-teacher-stream-session.puml`
