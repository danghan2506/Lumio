# Design Spec: Daily XP Cap and Target Upgrade (40 XP)

- **Date:** 2026-10-09
- **Status:** Draft / Pending User Review
- **Author:** Antigravity

---

## 1. Overview & Objectives

In the Lumio language learning application, users earn Experience Points (XP) through AI voice lessons, practice quizzes, and vocabulary flashcard reviews. 

This feature:
1. Upgrades the daily XP target from **20 XP** to **40 XP**.
2. Establishes a hard ceiling (cap) of **40 XP** per calendar day on accumulated activity XP. Any XP earned beyond this limit within a single day will not increase the user's daily XP total.
3. Ensures no gift/reward celebration modal is triggered when completing or exceeding the daily goal—retaining the quiet, inline completion state inside `DailyGoalCard` without disruptive popups.
4. Enforces the daily XP limit at the database level (Supabase PostgreSQL stored procedures) as the single source of truth, complemented by client-side fallback and UI synchronization.

---

## 2. Architecture & Data Flow

```
[User completes Lesson / Vocab / Quiz]
                   │
                   ▼
       lib/api.ts (RPC Calls)
       ├─ record_lesson_progress
       └─ record_vocabulary_review
                   │
                   ▼
     Supabase Database Layer
       atomic upsert to public.daily_activity:
       xp_earned = LEAST(40, current_xp + delta)
                   │
                   ▼
       hooks/useDashboardData
       ├─ targetXp = 40 (DAILY_XP_TARGET)
       ├─ currentXp = Math.min(40, todayActivity.xp_earned)
       └─ isCompleted = currentXp >= 40
                   │
                   ▼
       components/home/DailyGoalCard
       ├─ Progress bar: (currentXp / 40) * 100%
       ├─ Text: "Goal completed! 🎉" (when currentXp >= 40)
       ├─ Icon: checkmark-circle (Mint) vs gift-outline (Amber)
       └─ No popup modal
```

---

## 3. Database Changes (Supabase Migration)

Per [AGENTS.md](file:///d:/projects/lumio/AGENTS.md) rules, Supabase is the single source of truth for all persistent data. All progress and XP caps must be enforced at the database level.

### New Migration: `supabase/migrations/20261010000000_cap_daily_xp.sql`

Updates two stored procedures:

#### 3.1 `public.record_lesson_progress`
- When upserting into `public.daily_activity (user_id, activity_date)`:
  - On `INSERT`:
    ```sql
    xp_earned = LEAST(40, v_xp_delta)
    ```
  - On `CONFLICT (user_id, activity_date) DO UPDATE`:
    ```sql
    xp_earned = LEAST(40, public.daily_activity.xp_earned + EXCLUDED.xp_earned)
    ```
- `public.lesson_progress` continues to record individual lesson completion metrics (`xp_earned` for the specific lesson), but `daily_activity.xp_earned` is capped at 40.

#### 3.2 `public.record_vocabulary_review`
- When upserting into `public.daily_activity`:
  - On `INSERT`:
    ```sql
    xp_earned = LEAST(40, GREATEST(0, p_xp_earned))
    ```
  - On `CONFLICT (user_id, activity_date) DO UPDATE`:
    ```sql
    xp_earned = LEAST(40, public.daily_activity.xp_earned + GREATEST(0, p_xp_earned))
    ```

---

## 4. Frontend & Application Changes

### 4.1 Centralized Constant: `DAILY_XP_TARGET`
- Define and export `DAILY_XP_TARGET = 40` in `lib/dashboardHelpers.ts` (alongside related dashboard domain logic like `getTodayDateString` and `calculateStreak`).
- Export from `lib/dashboardHelpers.ts` and re-export in `hooks/useDashboardData.ts` for clean accessibility.

### 4.2 Hook: `hooks/useDashboardData.ts`
- Replace hardcoded `targetXp = 20` with `targetXp = DAILY_XP_TARGET`.
- Guard `currentXp`:
  ```ts
  const currentXp = Math.min(DAILY_XP_TARGET, todayActivity?.xp_earned ?? 0);
  const targetXp = DAILY_XP_TARGET;
  const isCompleted = currentXp >= targetXp;
  ```

### 4.3 Screen: `app/(tabs)/index.tsx`
- Replace fallback `targetXp={data?.dailyGoal.targetXp ?? 20}` with `targetXp={data?.dailyGoal.targetXp ?? DAILY_XP_TARGET}`.
- Prevents visual flicker/mismatch during data loading states.

### 4.4 Component: `components/home/DailyGoalCard.tsx`
- Maintain existing non-interactive UI structure:
  - Shows progress track up to 100%.
  - When `isCompleted` is true: Displays `"Goal completed! 🎉"` and green checkmark icon.
  - No touchable modal or reward dialog trigger.

---

## 5. Testing & Verification

### 5.1 Unit Tests to Update
1. `__tests__/components/home/DailyGoalCard.test.tsx`:
   - Update tests verifying target XP (change default from 20 to 40, test with current XP 40 and 40+).
2. `__tests__/hooks/useDashboardData.test.ts`:
   - Update mock daily activity and assert `result.current.data?.dailyGoal.targetXp === 40`.
   - Verify `dailyGoal.isCompleted === true` when XP >= 40.
   - Verify `currentXp` does not exceed 40 when activity XP is mock-set to 50.
3. `__tests__/types/home.test.ts`:
   - Update mock target XP assertions from 20 to 40.
4. `__tests__/screens/HomeScreen.test.tsx`:
   - Update mock `targetXp: 40`.

### 5.2 Verification Commands
- `npm run typecheck`
- `npm run lint`
- `npm test -- --testPathPattern="(DailyGoalCard|useDashboardData|home|HomeScreen)"`

---

## 6. Rollout & Risk Mitigation

- **Backward Compatibility:** Existing users who have `xp_earned` in past dates will not have their historical data altered. The `LEAST(40, ...)` logic applies to ongoing and future daily activity increments.
- **Offline/Network tolerance:** Because the cap is mirrored both in client computation (`Math.min`) and database atomic upserts (`LEAST`), race conditions between multiple reviews/lessons completed in quick succession cannot exceed 40 XP.
