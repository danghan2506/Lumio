# Forgot Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the dead "Forgot password?" link into a full native password-recovery flow: request screen → Supabase recovery email → deep link back into the app → set new password.

**Architecture:** Two new auth screens (`forgot-password`, `reset-password`) using the existing Supabase client and the `lumio://` deep-link scheme. URL token parsing is extracted into a small typed helper shared by `callback.tsx` and `reset-password.tsx`. No schema/RLS changes — Auth APIs only.

**Tech Stack:** Expo Router, React Native, Supabase Auth (`resetPasswordForEmail`, `setSession`, `updateUser`), Jest + React Native Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-30-forgot-password-design.md`

## Global Constraints

- Styling follows the existing auth screens: inline style object literals (auth screens don't use `className`), `colors.deepIndigo` background, `colors.lumioCoral` accents, Plus Jakarta Sans font family strings (e.g. `"PlusJakartaSans_700Bold"`).
- `SafeAreaView` always gets inline styles, never `className`.
- All Supabase calls handle the `error` field explicitly; UI shows friendly messages, never raw error objects.
- Never reveal whether an email is registered — always show the neutral confirmation copy.
- TypeScript strict; no `any`.
- Verify with `npm run lint`, `npm run typecheck`, `npx jest <path>` per task; full suite before the final task.
- Supabase dashboard (manual, one-time): add `lumio://auth/reset-password` to **Authentication → URL Configuration → Redirect URLs**.

---

### Task 1: Deep-link token parsing helper

**Files:**
- Create: `lib/authCallback.ts`
- Test: `__tests__/lib/authCallback.test.ts`

**Interfaces:**
- Consumes: nothing (standalone pure helper).
- Produces: `parseAuthTokens(url: string): { access_token: string; refresh_token: string } | null` — exported from `lib/authCallback.ts`. Task 3 and Task 4 consume this.

- [ ] **Step 1: Write the failing test**

```ts
import { parseAuthTokens } from '@/lib/authCallback';

describe('parseAuthTokens', () => {
  it('extracts tokens from a URL fragment', () => {
    const url =
      'lumio://auth/reset-password#access_token=abc123&refresh_token=def456&expires_in=3600&token_type=bearer&type=recovery';
    expect(parseAuthTokens(url)).toEqual({
      access_token: 'abc123',
      refresh_token: 'def456',
    });
  });

  it('extracts tokens when params are in the query string instead', () => {
    const url = 'lumio://auth/reset-password?access_token=abc123&refresh_token=def456';
    expect(parseAuthTokens(url)).toEqual({
      access_token: 'abc123',
      refresh_token: 'def456',
    });
  });

  it('returns null when tokens are missing', () => {
    expect(parseAuthTokens('lumio://auth/reset-password#type=recovery')).toBeNull();
  });

  it('returns null for an unparseable URL', () => {
    expect(parseAuthTokens('not a url')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/authCallback.test.ts`
Expected: FAIL — module `@/lib/authCallback` not found.

- [ ] **Step 3: Write minimal implementation**

```ts
/**
 * Parses Supabase auth tokens (access_token / refresh_token) from a
 * deep-link URL. Supabase puts them in the URL fragment for implicit
 * flows, or in the query string for some verify flows — check both.
 * Returns null when either token is missing or the URL is unparseable.
 */
export function parseAuthTokens(url: string): {
  access_token: string;
  refresh_token: string;
} | null {
  try {
    const parsed = new URL(url);

    const fromFragment = new URLSearchParams(parsed.hash.slice(1));

    const accessToken =
      fromFragment.get("access_token") ?? parsed.searchParams.get("access_token");
    const refreshToken =
      fromFragment.get("refresh_token") ?? parsed.searchParams.get("refresh_token");

    if (!accessToken || !refreshToken) return null;
    return { access_token: accessToken, refresh_token: refreshToken };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/authCallback.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/authCallback.ts __tests__/lib/authCallback.test.ts
git commit -m "feat: add parseAuthTokens deep-link token parsing helper"
```

### Task 2: Forgot password screen

**Files:**
- Create: `app/(auth)/forgot-password.tsx`
- Modify: `app/(auth)/login.tsx` (pass `onForgotPassword` to `LoginForm`)
- Test: `__tests__/screens/forgot-password.test.tsx`

**Interfaces:**
- Consumes: `supabase` singleton from `@/lib/supabase`; `colors` from `@/theme/colors`; `LoginForm` prop `onForgotPassword?: () => void` (already declared in `components/auth/LoginForm.tsx`).
- Produces: route `/(auth)/forgot-password`. Task 3's error state and Task 4's back-links navigate here.

- [ ] **Step 1: Write the failing test**

```tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabase';
import ForgotPasswordScreen from '@/app/(auth)/forgot-password';

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email input and submit button', () => {
    const { getByPlaceholderText, getByText } = render(<ForgotPasswordScreen />);
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByText('Send reset link')).toBeTruthy();
  });

  it('shows validation error when email is empty', async () => {
    const { getByText, findByText } = render(<ForgotPasswordScreen />);
    fireEvent.press(getByText('Send reset link'));
    expect(await findByText('Please enter your email address.')).toBeTruthy();
    expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('calls resetPasswordForEmail with email and deep-link redirect', async () => {
    (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    });
    const { getByPlaceholderText, getByText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(
      getByPlaceholderText('you@example.com'),
      'test@example.com',
    );
    fireEvent.press(getByText('Send reset link'));
    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('auth/reset-password'),
        }),
      );
    });
  });

  it('shows the neutral confirmation after a successful submit', async () => {
    (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    });
    const { getByPlaceholderText, getByText, findByText } = render(
      <ForgotPasswordScreen />,
    );
    fireEvent.changeText(
      getByPlaceholderText('you@example.com'),
      'test@example.com',
    );
    fireEvent.press(getByText('Send reset link'));
    expect(
      await findByText(
        "If an account exists for this email, we've sent a reset link.",
      ),
    ).toBeTruthy();
  });

  it('shows a friendly error when Supabase fails', async () => {
    (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
      data: {},
      error: { message: 'Email rate limit exceeded' },
    });
    const { getByPlaceholderText, getByText, findByText } = render(
      <ForgotPasswordScreen />,
    );
    fireEvent.changeText(
      getByPlaceholderText('you@example.com'),
      'test@example.com',
    );
    fireEvent.press(getByText('Send reset link'));
    expect(
      await findByText(
        'Too many requests. Please wait a moment and try again.',
      ),
    ).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/screens/forgot-password.test.tsx`
Expected: FAIL — module `@/app/(auth)/forgot-password` not found.

- [ ] **Step 3: Write the screen**

```tsx
import { supabase } from "@/lib/supabase";
import { colors } from "@/theme/colors";
import * as Linking from "expo-linking";
import { Href, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { images } from "@/constants/images";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: Linking.createURL("auth/reset-password"),
    });

    setLoading(false);

    if (error) {
      setErrorMessage(
        error.message?.includes("rate limit")
          ? "Too many requests. Please wait a moment and try again."
          : "Something went wrong. Please try again.",
      );
      return;
    }
    setSubmitted(true);
  };

  const inputStyle = {
    backgroundColor: "rgba(234, 230, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(94, 90, 128, 0.3)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.cream,
    minHeight: 48,
  } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.deepIndigo} />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingVertical: 20,
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <Image
            source={images.welcome}
            style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 12 }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontSize: 24,
              fontFamily: "PlusJakartaSans_700Bold",
              color: colors.cream,
              marginBottom: 6,
            }}
          >
            Reset your password 🔑
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontFamily: "PlusJakartaSans_500Medium",
              color: colors.lavenderMist,
              textAlign: "center",
            }}
          >
            Enter your email and we'll send you a reset link.
          </Text>
        </View>

        <View
          style={{
            width: "100%",
            backgroundColor: "rgba(234, 230, 255, 0.05)",
            borderWidth: 1,
            borderColor: "rgba(94, 90, 128, 0.2)",
            borderRadius: 24,
            padding: 20,
          }}
        >
          {submitted ? (
            <>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "PlusJakartaSans_500Medium",
                  color: colors.cream,
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                If an account exists for this email, we've sent a reset link.
              </Text>
              <Pressable
                onPress={() =>
                  router.replace("/(auth)/login" as Href)
                }
                style={{
                  backgroundColor: colors.lumioCoral,
                  borderRadius: 9999,
                  minHeight: 52,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "PlusJakartaSans_700Bold",
                    color: colors.cream,
                  }}
                >
                  Back to sign in
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  color: colors.slate,
                  marginBottom: 6,
                }}
              >
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="rgba(94, 90, 128, 0.5)"
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ ...inputStyle, marginBottom: 12 }}
              />

              {errorMessage && (
                <View
                  style={{
                    backgroundColor: "rgba(255, 107, 87, 0.15)",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      color: colors.lumioCoral,
                      fontSize: 14,
                      fontFamily: "PlusJakartaSans_500Medium",
                    }}
                  >
                    {errorMessage}
                  </Text>
                </View>
              )}

              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={{
                  backgroundColor: colors.lumioCoral,
                  borderRadius: 9999,
                  minHeight: 52,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.cream} />
                ) : (
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "PlusJakartaSans_700Bold",
                      color: colors.cream,
                    }}
                  >
                    Send reset link
                  </Text>
                )}
              </Pressable>
            </>
          )}
        </View>

        <Pressable
          onPress={() => router.back()}
          style={{ alignSelf: "center", marginTop: 20 }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: "PlusJakartaSans_600SemiBold",
              color: colors.slate,
            }}
          >
            Back
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/screens/forgot-password.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Wire the link in login.tsx**

In `app/(auth)/login.tsx`, change the `LoginForm` call:

```tsx
<LoginForm
  onSuccess={() => {}}
  onForgotPassword={() => router.push("/(auth)/forgot-password" as Href)}
/>
```

(`Href` is already imported in `login.tsx`.)

- [ ] **Step 6: Run lint, typecheck, and the full auth test files**

Run: `npm run lint && npm run typecheck && npx jest __tests__/screens/forgot-password.test.tsx __tests__/components/auth/LoginForm.test.tsx`
Expected: all PASS, no errors.

- [ ] **Step 7: Commit**

```bash
git add "app/(auth)/forgot-password.tsx" "app/(auth)/login.tsx" __tests__/screens/forgot-password.test.tsx
git commit -m "feat: add forgot password request screen wired to login"
```

### Task 3: Refactor callback.tsx to use the shared helper

**Files:**
- Modify: `app/(auth)/callback.tsx`
- Test: `__tests__/screens/auth-callback.test.tsx` (new — callback.tsx currently has no test)

**Interfaces:**
- Consumes: `parseAuthTokens` from `@/lib/authCallback` (Task 1).
- Produces: no new interfaces — behavior-preserving refactor of `callback.tsx`.

- [ ] **Step 1: Write the failing test**

```tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const replace = jest.fn();
const setSession = jest.fn();
const getInitialURL = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace }),
}));
jest.mock('expo-linking', () => ({
  getInitialURL: (...args: unknown[]) => getInitialURL(...args),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      setSession: (...args: unknown[]) => setSession(...args),
    },
  },
}));

import AuthCallbackScreen from '@/app/(auth)/callback';

describe('AuthCallbackScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets the session and navigates home when tokens are present', async () => {
    setSession.mockResolvedValue({ data: {}, error: null });
    getInitialURL.mockResolvedValue(
      'lumio://auth/callback#access_token=abc&refresh_token=def',
    );
    render(<AuthCallbackScreen />);
    await waitFor(() => {
      expect(setSession).toHaveBeenCalledWith({
        access_token: 'abc',
        refresh_token: 'def',
      });
      expect(replace).toHaveBeenCalledWith('/');
    });
  });

  it('navigates to login when the URL has no tokens', async () => {
    getInitialURL.mockResolvedValue('lumio://auth/callback');
    render(<AuthCallbackScreen />);
    await waitFor(() => {
      expect(setSession).not.toHaveBeenCalled();
      expect(replace).toHaveBeenCalledWith('/(auth)/login');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it passes against the current implementation**

Run: `npx jest __tests__/screens/auth-callback.test.tsx`
Expected: PASS (the current implementation already behaves this way — this test pins existing behavior before refactoring).

- [ ] **Step 3: Refactor callback.tsx to use parseAuthTokens**

Replace the inline parsing in `handleCallback` (lines 22–37 of `app/(auth)/callback.tsx`):

```tsx
import { parseAuthTokens } from "@/lib/authCallback";
// ...

const tokens = parseAuthTokens(url);
if (tokens) {
  const { error } = await supabase.auth.setSession(tokens);
  if (!error) {
    router.replace("/");
    return;
  }
}
```

The surrounding try/catch and login fallback stay as they are.

- [ ] **Step 4: Run test again to verify the refactor preserves behavior**

Run: `npx jest __tests__/screens/auth-callback.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Run lint and typecheck**

Run: `npm run lint && npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add "app/(auth)/callback.tsx" __tests__/screens/auth-callback.test.tsx
git commit -m "refactor: use shared parseAuthTokens helper in auth callback"
```

### Task 4: Reset password screen

**Files:**
- Create: `app/(auth)/reset-password.tsx`
- Test: `__tests__/screens/reset-password.test.tsx`

**Interfaces:**
- Consumes: `parseAuthTokens` from `@/lib/authCallback` (Task 1); `supabase` from `@/lib/supabase`; `colors` from `@/theme/colors`.
- Produces: route `/(auth)/reset-password` — the redirect target used in Task 2's `Linking.createURL("auth/reset-password")`.

- [ ] **Step 1: Write the failing test**

```tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const replace = jest.fn();
const setSession = jest.fn();
const updateUser = jest.fn();
const getInitialURL = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace }),
}));
jest.mock('expo-linking', () => ({
  getInitialURL: (...args: unknown[]) => getInitialURL(...args),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      setSession: (...args: unknown[]) => setSession(...args),
      updateUser: (...args: unknown[]) => updateUser(...args),
    },
  },
}));

import { supabase } from '@/lib/supabase';
import ResetPasswordScreen from '@/app/(auth)/reset-password';

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('establishes a session from the deep link on mount', async () => {
    setSession.mockResolvedValue({ data: {}, error: null });
    getInitialURL.mockResolvedValue(
      'lumio://auth/reset-password#access_token=abc&refresh_token=def&type=recovery',
    );
    render(<ResetPasswordScreen />);
    await waitFor(() => {
      expect(supabase.auth.setSession).toHaveBeenCalledWith({
        access_token: 'abc',
        refresh_token: 'def',
      });
    });
  });

  it('shows an error state when the link carries no tokens', async () => {
    getInitialURL.mockResolvedValue('lumio://auth/reset-password#type=recovery');
    const { findByText } = render(<ResetPasswordScreen />);
    expect(
      await findByText('This reset link is invalid or has expired.'),
    ).toBeTruthy();
    expect(supabase.auth.setSession).not.toHaveBeenCalled();
  });

  it('validates password length and match before submitting', async () => {
    setSession.mockResolvedValue({ data: {}, error: null });
    getInitialURL.mockResolvedValue(
      'lumio://auth/reset-password#access_token=abc&refresh_token=def',
    );
    const { findByPlaceholderText, getByPlaceholderText, getByText, findByText } =
      render(<ResetPasswordScreen />);
    await findByPlaceholderText('New password');
    fireEvent.changeText(getByPlaceholderText('New password'), 'short');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'short');
    fireEvent.press(getByText('Update password'));
    expect(
      await findByText('Password must be at least 8 characters.'),
    ).toBeTruthy();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('calls updateUser and navigates to login on success', async () => {
    setSession.mockResolvedValue({ data: {}, error: null });
    updateUser.mockResolvedValue({ data: {}, error: null });
    getInitialURL.mockResolvedValue(
      'lumio://auth/reset-password#access_token=abc&refresh_token=def',
    );
    const { findByPlaceholderText, getByPlaceholderText, getByText, findByText } =
      render(<ResetPasswordScreen />);
    await findByPlaceholderText('New password');
    fireEvent.changeText(getByPlaceholderText('New password'), 'newpassword1');
    fireEvent.changeText(
      getByPlaceholderText('Confirm new password'),
      'newpassword1',
    );
    fireEvent.press(getByText('Update password'));
    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword1',
      });
    });
    expect(await findByText('Password updated! 🎉')).toBeTruthy();
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/(auth)/login');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/screens/reset-password.test.tsx`
Expected: FAIL — module `@/app/(auth)/reset-password` not found.

- [ ] **Step 3: Write the screen**

```tsx
import { supabase } from "@/lib/supabase";
import { parseAuthTokens } from "@/lib/authCallback";
import { colors } from "@/theme/colors";
import * as Linking from "expo-linking";
import { Href, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [linkState, setLinkState] = useState<"loading" | "ready" | "invalid">(
    "loading",
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const establishSession = async () => {
      const url =
        (await Linking.getInitialURL()) ?? undefined;
      const listener = Linking.addEventListener("url", () => {});
      listener.remove();

      const tokens = url ? parseAuthTokens(url) : null;
      if (!tokens) {
        setLinkState("invalid");
        return;
      }
      const { error } = await supabase.auth.setSession(tokens);
      if (error) {
        setLinkState("invalid");
        return;
      }
      setLinkState("ready");
    };
    establishSession();
  }, []);

  const handleUpdate = async () => {
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setErrorMessage("Could not update the password. Please try again.");
      return;
    }
    setSuccess(true);
    setTimeout(() => router.replace("/(auth)/login" as Href), 1500);
  };

  const inputStyle = {
    backgroundColor: "rgba(234, 230, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(94, 90, 128, 0.3)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.cream,
    minHeight: 48,
  } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.deepIndigo} />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingVertical: 20,
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        {linkState === "loading" && (
          <ActivityIndicator size="large" color={colors.lumioCoral} />
        )}

        {linkState === "invalid" && (
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "PlusJakartaSans_700Bold",
                color: colors.cream,
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              This reset link is invalid or has expired.
            </Text>
            <Pressable
              onPress={() =>
                router.replace("/(auth)/forgot-password" as Href)
              }
              style={{
                backgroundColor: colors.lumioCoral,
                borderRadius: 9999,
                minHeight: 52,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 32,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: colors.cream,
                }}
              >
                Request a new link
              </Text>
            </Pressable>
          </View>
        )}

        {linkState === "ready" && (
          <View
            style={{
              width: "100%",
              backgroundColor: "rgba(234, 230, 255, 0.05)",
              borderWidth: 1,
              borderColor: "rgba(94, 90, 128, 0.2)",
              borderRadius: 24,
              padding: 20,
            }}
          >
            {success ? (
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: colors.cream,
                  textAlign: "center",
                }}
              >
                Password updated! 🎉
              </Text>
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: "PlusJakartaSans_700Bold",
                    color: colors.cream,
                    marginBottom: 20,
                    textAlign: "center",
                  }}
                >
                  Set a new password
                </Text>

                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    color: colors.slate,
                    marginBottom: 6,
                  }}
                >
                  New password
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="New password"
                  placeholderTextColor="rgba(94, 90, 128, 0.5)"
                  secureTextEntry
                  style={{ ...inputStyle, marginBottom: 12 }}
                />

                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    color: colors.slate,
                    marginBottom: 6,
                  }}
                >
                  Confirm new password
                </Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="rgba(94, 90, 128, 0.5)"
                  secureTextEntry
                  style={{ ...inputStyle, marginBottom: 12 }}
                />

                {errorMessage && (
                  <View
                    style={{
                      backgroundColor: "rgba(255, 107, 87, 0.15)",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 16,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.lumioCoral,
                        fontSize: 14,
                        fontFamily: "PlusJakartaSans_500Medium",
                      }}
                    >
                      {errorMessage}
                    </Text>
                  </View>
                )}

                <Pressable
                  onPress={handleUpdate}
                  disabled={loading}
                  style={{
                    backgroundColor: colors.lumioCoral,
                    borderRadius: 9999,
                    minHeight: 52,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.cream} />
                  ) : (
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: "PlusJakartaSans_700Bold",
                        color: colors.cream,
                      }}
                    >
                      Update password
                    </Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/screens/reset-password.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Run lint, typecheck, and the full test suite**

Run: `npm run lint && npm run typecheck && npx jest`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add "app/(auth)/reset-password.tsx" __tests__/screens/reset-password.test.tsx
git commit -m "feat: add reset password screen with deep-link session recovery"
```

### Task 5: Manual E2E verification on device

**Files:** none (verification only)

**Interfaces:**
- Consumes: everything from Tasks 1–4, plus the Supabase dashboard redirect URL configured under Global Constraints.
- Produces: verified end-to-end flow.

- [ ] **Step 1: Configure the Supabase redirect URL**

In the Supabase dashboard: **Authentication → URL Configuration → Redirect URLs** → add `lumio://auth/reset-password`. Save.

- [ ] **Step 2: Run the app on a device/emulator**

Run: `npx expo start` and open on a device (dev build or Expo Go as appropriate for the project).

- [ ] **Step 3: Request a reset**

On the login screen tap **Forgot password?** → enter a real registered email → **Send reset link**. Verify the neutral confirmation appears and the email arrives.

- [ ] **Step 4: Complete the reset**

Tap the link in the email on the device → verify the app opens on the reset screen → enter a new password twice → **Update password** → verify the success message and navigation to login → sign in with the new password.

- [ ] **Step 5: Verify failure paths**

- Open the app via an old/used reset link → invalid-link error state appears with "Request a new link".
- Submit mismatched/short passwords → friendly validation messages, no Supabase call.

---

## Self-Review Results

- **Spec coverage:** login link wiring (Task 2), forgot screen with neutral confirmation + friendly errors (Task 2), reset screen with deep-link session + validation + success path (Task 4), shared parsing helper (Tasks 1 & 3), dashboard config (Global Constraints + Task 5), unit + E2E testing (all tasks + Task 5). No gaps.
- **Placeholder scan:** none — all steps contain actual code or exact commands.
- **Type consistency:** `parseAuthTokens` signature identical in Tasks 1, 3, 4. Route strings `/(auth)/forgot-password` and `/(auth)/reset-password` consistent across Tasks 2, 3, 4.
