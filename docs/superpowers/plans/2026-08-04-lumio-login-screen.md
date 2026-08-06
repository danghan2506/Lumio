# Lumio Login Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a production-ready, Vietnamese-language Login Screen (`app/(auth)/login.tsx`) for Lumio with Email/Password and Google OAuth authentication options, strictly adhering to `DESIGN.md` and `AGENTS.md`.

**Architecture:** Screen component `app/(auth)/login.tsx` composed within an Expo Router `(auth)` group stack. Business logic for Supabase Auth forms isolated into reusable components (`components/auth/LoginForm.tsx` & `components/auth/SocialAuthGroup.tsx`). Singleton Supabase client configured in `lib/supabase.ts`.

**Tech Stack:** React Native, Expo Router, TypeScript, NativeWind/Tailwind CSS, Supabase Auth (`@supabase/supabase-js`), `@react-native-async-storage/async-storage`.

## Global Constraints

- **Language:** All UI strings strictly in Vietnamese (Vietnamese UI).
- **Mascot:** Welcome header mascot uses `lumi-welcome.png` imported via `constants/images.ts`.
- **Canvas Colors:** Deep Indigo gradient (`['#241B4A', '#4B3FA8']`).
- **Primary CTA:** Lumio Coral (`#FF6B57`) pill button with Cream (`#FFFBF4`) text. Minimum tap target 48px.
- **Card Styling:** Squircle card container with `24px` (`rounded-3xl`) border radius.
- **Forbidden:** No pure black (`#000000`), no `Inter` font, no generic serif fonts, no green owl imagery, no neon glows.
- **SafeAreaView:** Use inline styles only (`style={{ flex: 1, backgroundColor: '#241B4A' }}`).

---

### Task 1: Supabase Client & Environment Setup

**Files:**
- Create: `lib/supabase.ts`
- Create: `.env.local`
- Create: `.env.example`
- Test: `__tests__/lib/supabase.test.ts`

**Interfaces:**
- Consumes: `@supabase/supabase-js`, `@react-native-async-storage/async-storage`
- Produces: `supabase` singleton client exported from `@/lib/supabase`

- [ ] **Step 1: Write unit test for Supabase client export**

```typescript
// __tests__/lib/supabase.test.ts
import { supabase } from '@/lib/supabase';

describe('Supabase Client Singleton', () => {
  it('should export a defined supabase client instance', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/supabase.test.ts`
Expected: FAIL with module `@/lib/supabase` not found.

- [ ] **Step 3: Create `.env.example` and `.env.local`**

```env
# .env.example
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

```env
# .env.local
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 4: Implement `lib/supabase.ts`**

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest __tests__/lib/supabase.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/supabase.ts .env.example .env.local __tests__/lib/supabase.test.ts
git commit -m "feat(auth): add Supabase client singleton setup"
```

---

### Task 2: Register Mascot Image Asset in `constants/images.ts`

**Files:**
- Modify: `constants/images.ts`
- Asset verified: `assets/images/lumi-welcome.png`
- Test: `__tests__/constants/images.test.ts`

**Interfaces:**
- Consumes: `assets/images/lumi-welcome.png`
- Produces: `images.welcome` asset reference

- [ ] **Step 1: Write test for image exports**

```typescript
// __tests__/constants/images.test.ts
import { images } from '@/constants/images';

describe('Image Constants', () => {
  it('should export mascot and welcome images', () => {
    expect(images.mascot).toBeDefined();
    expect(images.welcome).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx jest __tests__/constants/images.test.ts`
Expected: FAIL with `images.welcome` is undefined.

- [ ] **Step 3: Update `constants/images.ts`**

```typescript
// constants/images.ts
import lumiMascot from '@/assets/images/lumi_mascot.jpg';
import lumiWelcome from '@/assets/images/lumi-welcome.png';

export const images = {
  mascot: lumiMascot,
  welcome: lumiWelcome,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/constants/images.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add constants/images.ts __tests__/constants/images.test.ts
git commit -m "feat(assets): register lumi-welcome image in constants"
```

---

### Task 3: Build Reusable Auth Components (`LoginForm` & `SocialAuthGroup`)

**Files:**
- Create: `components/auth/LoginForm.tsx`
- Create: `components/auth/SocialAuthGroup.tsx`
- Test: `__tests__/components/auth/LoginForm.test.tsx`

**Interfaces:**
- Consumes: `@/lib/supabase`, `@/theme/colors`
- Produces: `<LoginForm onSuccess={() => void} />`, `<SocialAuthGroup />`

- [ ] **Step 1: Write test for `LoginForm` validation**

```typescript
// __tests__/components/auth/LoginForm.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LoginForm } from '@/components/auth/LoginForm';

describe('LoginForm Component', () => {
  it('renders email and password inputs with Vietnamese labels', () => {
    const { getByText, getByPlaceholderText } = render(<LoginForm onSuccess={jest.fn()} />);
    expect(getByText('Địa chỉ Email')).toBeTruthy();
    expect(getByText('Mật khẩu')).toBeTruthy();
    expect(getByPlaceholderText('bạn@example.com')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx jest __tests__/components/auth/LoginForm.test.tsx`
Expected: FAIL with `LoginForm` module not found.

- [ ] **Step 3: Implement `components/auth/LoginForm.tsx`**

```tsx
// components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/colors';
import { supabase } from '@/lib/supabase';

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

export function LoginForm({ onSuccess, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message || 'Đăng nhập không thành công. Vui lòng thử lại.');
    } else if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <View style={{ width: '100%' }}>
      {/* Email Input */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.slate, marginBottom: 6 }}>
          Địa chỉ Email
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="bạn@example.com"
          placeholderTextColor="rgba(94, 90, 128, 0.5)"
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            backgroundColor: 'rgba(234, 230, 255, 0.06)',
            borderWidth: 1,
            borderColor: 'rgba(94, 90, 128, 0.3)',
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            color: colors.cream,
            minHeight: 48,
          }}
        />
      </View>

      {/* Password Input */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.slate, marginBottom: 6 }}>
          Mật khẩu
        </Text>
        <View style={{ position: 'relative', justifyContent: 'center' }}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="rgba(94, 90, 128, 0.5)"
            secureTextEntry={!showPassword}
            style={{
              backgroundColor: 'rgba(234, 230, 255, 0.06)',
              borderWidth: 1,
              borderColor: 'rgba(94, 90, 128, 0.3)',
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              paddingRight: 50,
              fontSize: 16,
              color: colors.cream,
              minHeight: 48,
            }}
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: 14, height: 48, justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 13, color: colors.slate, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
              {showPassword ? 'Ẩn' : 'Hiện'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Forgot Password */}
      <Pressable onPress={onForgotPassword} style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
        <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lumioCoral }}>
          Quên mật khẩu?
        </Text>
      </Pressable>

      {/* Error Message */}
      {errorMessage && (
        <View style={{ backgroundColor: 'rgba(255, 107, 87, 0.15)', borderRadius: 12, padding: 12, marginBottom: 16 }}>
          <Text style={{ color: colors.lumioCoral, fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium' }}>
            {errorMessage}
          </Text>
        </View>
      )}

      {/* Submit Button */}
      <Pressable
        onPress={handleLogin}
        disabled={loading}
        style={{
          backgroundColor: colors.lumioCoral,
          borderRadius: 9999,
          minHeight: 52,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {loading ? (
          <ActivityIndicator color={colors.cream} />
        ) : (
          <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}>
            Đăng nhập
          </Text>
        )}
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 4: Implement `components/auth/SocialAuthGroup.tsx`**

```tsx
// components/auth/SocialAuthGroup.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { colors } from '@/theme/colors';
import { supabase } from '@/lib/supabase';

export function SocialAuthGroup() {
  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'lumio://auth/callback',
        },
      });
    } catch (err) {
      console.error('Google Auth Error:', err);
    }
  };

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      {/* Divider */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(94, 90, 128, 0.25)' }} />
        <Text style={{ marginHorizontal: 12, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }}>
          hoặc tiếp tục với
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(94, 90, 128, 0.25)' }} />
      </View>

      {/* Google Button */}
      <Pressable
        onPress={handleGoogleLogin}
        style={{
          width: '100%',
          backgroundColor: colors.cream,
          borderRadius: 9999,
          minHeight: 50,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 16,
        }}
      >
        <Text style={{ fontSize: 18, marginRight: 10 }}>🌐</Text>
        <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: colors.deepIndigo }}>
          Đăng nhập bằng Google
        </Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npx jest __tests__/components/auth/LoginForm.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/auth/LoginForm.tsx components/auth/SocialAuthGroup.tsx __tests__/components/auth/LoginForm.test.tsx
git commit -m "feat(auth): create LoginForm and SocialAuthGroup components"
```

---

### Task 4: Main Login Screen (`app/(auth)/login.tsx`) & Stack Layout (`app/(auth)/_layout.tsx`)

**Files:**
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/login.tsx`

**Interfaces:**
- Consumes: `@/components/auth/LoginForm`, `@/components/auth/SocialAuthGroup`, `@/constants/images`, `@/theme/colors`
- Produces: Auth Stack & Login Screen route

- [ ] **Step 1: Create `app/(auth)/_layout.tsx`**

```tsx
// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.deepIndigo },
      }}
    />
  );
}
```

- [ ] **Step 2: Create `app/(auth)/login.tsx`**

```tsx
// app/(auth)/login.tsx
import React from 'react';
import { View, Text, SafeAreaView, StatusBar, Image, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { images } from '@/constants/images';
import { LoginForm } from '@/components/auth/LoginForm';
import { SocialAuthGroup } from '@/components/auth/SocialAuthGroup';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.deepIndigo} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 20, justifyContent: 'center', alignItems: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mascot Header */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Image
            source={images.welcome}
            style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 12 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 26, fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream, textAlign: 'center', marginBottom: 6 }}>
            Chào mừng quay lại! 👋
          </Text>
          <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist, textAlign: 'center' }}>
            Đăng nhập để tiếp tục hành trình học tập cùng Lumi
          </Text>
        </View>

        {/* Form Card Container */}
        <View
          style={{
            width: '100%',
            backgroundColor: 'rgba(234, 230, 255, 0.05)',
            borderWidth: 1,
            borderColor: 'rgba(94, 90, 128, 0.2)',
            borderRadius: 24,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <LoginForm onSuccess={() => router.replace('/(tabs)')} />
          <SocialAuthGroup />
        </View>

        {/* Footer Link */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }}>
            Chưa có tài khoản?{' '}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.lumioCoral }}>
              Đăng ký ngay
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Verify TypeScript and Linting**

Run: `npm run typecheck`
Expected: PASS (No type errors)

- [ ] **Step 4: Commit**

```bash
git add app/\(auth\)/_layout.tsx app/\(auth\)/login.tsx
git commit -m "feat(auth): add Login screen and Auth layout stack"
```

---

### Task 5: End-to-End Verification & Quality Check

- [ ] **Step 1: Run typecheck and linting**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors

- [ ] **Step 2: Commit final completion**

```bash
git commit --allow-empty -m "chore(auth): complete Lumio login screen implementation plan"
```
