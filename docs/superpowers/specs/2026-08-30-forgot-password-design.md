# Forgot Password (Supabase Auth Reset Flow)

**Date:** 2026-08-30
**Status:** Draft

## Problem

The login screen already shows a "Forgot password?" link, but it is dead UI — `LoginForm` accepts an `onForgotPassword` prop that no screen passes. Users who lose their password have no way to recover their account.

## Solution

Standard Supabase Auth password recovery with a native deep-link flow:

1. User taps "Forgot password?" → dedicated screen asks for their email.
2. App calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: <deep link> })`.
3. Supabase emails a recovery link. When the user taps it on their phone, the app opens via the `lumio://` scheme (already registered in `app.json`).
4. A reset screen extracts the recovery tokens from the link, establishes a session, and shows a "set new password" form.
5. App calls `supabase.auth.updateUser({ password })` → success → navigate to login.

The user sets the new password inside the app, not in a web browser. This mirrors the existing OAuth flow, which already round-trips through `lumio://auth/callback`.

## User Flow

```
login.tsx ──"Forgot password?"──▶ forgot-password.tsx
                                     │  user enters email
                                     │  resetPasswordForEmail(email, redirectTo: lumio://auth/reset-password)
                                     ▼
                                  "Check your email" confirmation
                                     │
                          (user taps link in email)
                                     │
                                     ▼
                          lumio://auth/reset-password#access_token=...&refresh_token=...&type=recovery
                                     │
                                     ▼
                                reset-password.tsx
                                     │  parse tokens → supabase.auth.setSession()
                                     │  user enters new password (×2)
                                     │  supabase.auth.updateUser({ password })
                                     ▼
                                  success → router.replace("/(auth)/login")
```

## Changes

### 1. Login screen — wire up the link

**File:** `app/(auth)/login.tsx`

Pass `onForgotPassword={() => router.push("/(auth)/forgot-password" as Href)}` to `LoginForm`. The prop already exists in `LoginFormProps`.

### 2. Forgot password screen (new)

**File:** `app/(auth)/forgot-password.tsx`

- Single email input (reuses the input styling from `LoginForm`).
- Submit calls `supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: Linking.createURL("auth/reset-password") })`.
- Always show a neutral confirmation ("If an account exists for this email, we've sent a reset link") — never reveal whether the email is registered (Supabase itself behaves this way; the UI must not leak it).
- Errors (network, rate limit) show a user-friendly message; raw error objects are never displayed.
- After submission, show a "Back to sign in" action.

### 3. Reset password screen (new)

**File:** `app/(auth)/reset-password.tsx`

On mount:
1. Resolve the deep link via `Linking.getInitialURL()` plus a `Linking.addEventListener` listener (cold start and warm start both handled).
2. Parse `access_token` / `refresh_token` from the URL fragment (same parsing pattern as `app/(auth)/callback.tsx`).
3. Call `supabase.auth.setSession({ access_token, refresh_token })`.
4. Invalid/missing tokens → show an error state with a link back to the forgot-password screen.

On submit:
- Validate: password present, minimum 8 characters, matches confirmation.
- Call `supabase.auth.updateUser({ password })`.
- Success → friendly confirmation → `router.replace("/(auth)/login")`. The reset session grants write access to the user row only; no other data is touched.

Both screens follow the existing auth visual language: `colors.deepIndigo` background, rounded translucent card, `colors.lumioCoral` accents, Plus Jakarta Sans fonts.

### 4. Shared deep-link parsing (extract if duplicated)

**File:** `lib/authCallback.ts` (new, only if the token-parsing logic would otherwise be copy-pasted)

Extract "parse access_token/refresh_token from a URL fragment" into a small typed helper used by both `callback.tsx` and `reset-password.tsx`. If the duplication is trivial, keep them separate — decide at implementation time.

## Supabase Configuration (manual, one-time)

No schema or RLS changes — this uses Auth APIs only. One dashboard change is required:

- Add `lumio://auth/reset-password` to **Authentication → URL Configuration → Redirect URLs** in the Supabase dashboard.

The email template can stay at Supabase's default (it includes the `{{ .ConfirmationURL }}` link that honors `redirectTo`).

## Testing

- **Unit tests** for the URL/token parsing helper (valid fragment, missing tokens, non-recovery type) and password validation logic.
- **Manual E2E on device:** request a reset with a real account → tap the email link → app opens on the reset screen → set new password → sign in with it. Also verify: expired/invalid link shows the error state, rate-limit error surfaces a friendly message.

## Out of Scope

- Custom branded email templates (default Supabase template is fine for capstone).
- OTP-code-based reset (rejected in favor of deep links during brainstorming).
- Password strength metering beyond minimum-length validation.
