# Register Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm màn hình đăng ký tài khoản bằng email/password với Zod validation, tự động đăng nhập và điều hướng vào app sau khi thành công.

**Architecture:** Cài `zod`, tạo `RegisterForm` component (Zod schema + Supabase signUp logic), tạo `register.tsx` screen, cập nhật `login.tsx` để link sang register.

**Tech Stack:** Expo Router, React Native, Supabase JS v2, Zod, TypeScript strict

## Global Constraints

- TypeScript strict — no `any`
- NativeWind classes cho styling (ngoại lệ: `SafeAreaView` dùng inline style)
- `colors` chỉ import từ `@/theme/colors`
- `supabase` client chỉ import từ `@/lib/supabase`
- Validate on-submit only (không on-blur)
- Không dùng `react-hook-form`

---

### Task 1: Cài package Zod

**Files:**
- Modify: `package.json` (auto-updated by npm)

**Interfaces:**
- Produces: `import { z } from 'zod'` khả dụng trong toàn dự án

- [ ] **Step 1: Cài zod**

```bash
npm install zod
```

- [ ] **Step 2: Verify cài xong**

```bash
npx tsc --noEmit
```

Expected: exit code 0, không lỗi

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add zod for form validation"
```

---

### Task 2: Tạo RegisterForm component

**Files:**
- Create: `components/auth/RegisterForm.tsx`

**Interfaces:**
- Consumes: `supabase` từ `@/lib/supabase`, `colors` từ `@/theme/colors`
- Produces: `export function RegisterForm(props: RegisterFormProps)` nhận `onSuccess?: () => void`

- [ ] **Step 1: Tạo file `components/auth/RegisterForm.tsx`** với nội dung sau:

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { z } from 'zod';
import { colors } from '@/theme/colors';
import { supabase } from '@/lib/supabase';

// ─── Zod Schema ────────────────────────────────────────────────────────────
const registerSchema = z
  .object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;
type FieldErrors = Partial<Record<keyof RegisterFormData, string>>;

// ─── Props ─────────────────────────────────────────────────────────────────
export interface RegisterFormProps {
  onSuccess?: () => void;
}

// ─── Reusable field error text ─────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text
      style={{
        fontSize: 12,
        fontFamily: 'PlusJakartaSans_500Medium',
        color: colors.lumioCoral,
        marginTop: 4,
      }}
    >
      {message}
    </Text>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────
export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleRegister = async () => {
    // 1. Reset errors
    setFieldErrors({});

    // 2. Zod validate
    const result = registerSchema.safeParse({ email, password, confirmPassword });
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof RegisterFormData;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    // 3. Supabase signUp
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Đăng ký thất bại', error.message || 'Vui lòng thử lại.');
      return;
    }

    // 4. Success → _layout.tsx onAuthStateChange sẽ tự redirect về "/"
    onSuccess?.();
  };

  const inputStyle = {
    backgroundColor: 'rgba(234, 230, 255, 0.06)' as const,
    borderWidth: 1,
    borderColor: 'rgba(94, 90, 128, 0.3)' as const,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.cream,
    minHeight: 48,
  };

  return (
    <View style={{ width: '100%' }}>
      {/* Email */}
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'PlusJakartaSans_600SemiBold',
            color: colors.slate,
            marginBottom: 6,
          }}
        >
          Địa chỉ Email
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="bạn@example.com"
          placeholderTextColor="rgba(94, 90, 128, 0.5)"
          keyboardType="email-address"
          autoCapitalize="none"
          style={inputStyle}
        />
        <FieldError message={fieldErrors.email} />
      </View>

      {/* Password */}
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'PlusJakartaSans_600SemiBold',
            color: colors.slate,
            marginBottom: 6,
          }}
        >
          Mật khẩu
        </Text>
        <View style={{ position: 'relative', justifyContent: 'center' }}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Tối thiểu 8 ký tự"
            placeholderTextColor="rgba(94, 90, 128, 0.5)"
            secureTextEntry={!showPassword}
            style={{ ...inputStyle, paddingRight: 50 }}
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: 14, height: 48, justifyContent: 'center' }}
          >
            <Text
              style={{
                fontSize: 13,
                color: colors.slate,
                fontFamily: 'PlusJakartaSans_600SemiBold',
              }}
            >
              {showPassword ? 'Ẩn' : 'Hiện'}
            </Text>
          </Pressable>
        </View>
        <FieldError message={fieldErrors.password} />
      </View>

      {/* Confirm Password */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'PlusJakartaSans_600SemiBold',
            color: colors.slate,
            marginBottom: 6,
          }}
        >
          Nhập lại mật khẩu
        </Text>
        <View style={{ position: 'relative', justifyContent: 'center' }}>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            placeholderTextColor="rgba(94, 90, 128, 0.5)"
            secureTextEntry={!showConfirm}
            style={{ ...inputStyle, paddingRight: 50 }}
          />
          <Pressable
            onPress={() => setShowConfirm(!showConfirm)}
            style={{ position: 'absolute', right: 14, height: 48, justifyContent: 'center' }}
          >
            <Text
              style={{
                fontSize: 13,
                color: colors.slate,
                fontFamily: 'PlusJakartaSans_600SemiBold',
              }}
            >
              {showConfirm ? 'Ẩn' : 'Hiện'}
            </Text>
          </Pressable>
        </View>
        <FieldError message={fieldErrors.confirmPassword} />
      </View>

      {/* Submit */}
      <Pressable
        onPress={handleRegister}
        disabled={loading}
        style={{
          backgroundColor: colors.lumioCoral,
          borderRadius: 9999,
          minHeight: 52,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color={colors.cream} />
        ) : (
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'PlusJakartaSans_700Bold',
              color: colors.cream,
            }}
          >
            Đăng ký
          </Text>
        )}
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: exit code 0

- [ ] **Step 3: Commit**

```bash
git add components/auth/RegisterForm.tsx
git commit -m "feat: add RegisterForm component with Zod validation"
```

---

### Task 3: Tạo màn hình register.tsx

**Files:**
- Create: `app/(auth)/register.tsx`

**Interfaces:**
- Consumes: `RegisterForm` từ `@/components/auth/RegisterForm`, `images` từ `@/constants/images`, `colors` từ `@/theme/colors`
- Produces: default export `RegisterScreen` — route `/(auth)/register`

- [ ] **Step 1: Tạo file `app/(auth)/register.tsx`**

```tsx
import React from 'react';
import { View, Text, SafeAreaView, StatusBar, Image, ScrollView, Pressable } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { colors } from '@/theme/colors';
import { images } from '@/constants/images';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.deepIndigo} />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingVertical: 20,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Image
            source={images.welcome}
            style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 12 }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontSize: 26,
              fontFamily: 'PlusJakartaSans_700Bold',
              color: colors.cream,
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            Tạo tài khoản mới 🎉
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'PlusJakartaSans_500Medium',
              color: colors.lavenderMist,
              textAlign: 'center',
            }}
          >
            Bắt đầu hành trình học ngôn ngữ cùng Lumi
          </Text>
        </View>

        {/* Form Card */}
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
          <RegisterForm onSuccess={() => router.replace('/')} />
        </View>

        {/* Footer */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'PlusJakartaSans_500Medium',
              color: colors.slate,
            }}
          >
            Đã có tài khoản?{' '}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/login' as Href)}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'PlusJakartaSans_700Bold',
                color: colors.lumioCoral,
              }}
            >
              Đăng nhập
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: exit code 0

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/register.tsx
git commit -m "feat: add register screen"
```

---

### Task 4: Cập nhật login.tsx — link "Đăng ký ngay" → register

**Files:**
- Modify: `app/(auth)/login.tsx` — dòng 55, đổi `router.push('/(auth)/login')` → `router.push('/(auth)/register')`

**Interfaces:**
- Consumes: không thay đổi
- Produces: nút "Đăng ký ngay" điều hướng đúng sang `/(auth)/register`

- [ ] **Step 1: Sửa dòng 55 trong `app/(auth)/login.tsx`**

Tìm:
```tsx
<Pressable onPress={() => router.push('/(auth)/login' as Href)}>
```

Thay bằng:
```tsx
<Pressable onPress={() => router.push('/(auth)/register' as Href)}>
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: exit code 0

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/login.tsx
git commit -m "fix: link 'Đăng ký ngay' trỏ đúng sang màn register"
```

---

### Task 5: Kiểm tra end-to-end

- [ ] **Step 1: Khởi động dev server**

```bash
npx expo start
```

- [ ] **Step 2: Kiểm tra happy path**
  - Mở app → thấy màn login
  - Nhấn "Đăng ký ngay" → vào màn register
  - Nhập email hợp lệ + password ≥ 8 ký tự + confirmPassword khớp
  - Nhấn "Đăng ký" → spinner hiện → app chuyển vào màn chính (`/`)

- [ ] **Step 3: Kiểm tra validation**
  - Để trống email → lỗi "Email không hợp lệ"
  - Nhập email sai format → lỗi "Email không hợp lệ"
  - Password < 8 ký tự → lỗi "Mật khẩu tối thiểu 8 ký tự"
  - confirmPassword khác password → lỗi "Mật khẩu nhập lại không khớp"

- [ ] **Step 4: Kiểm tra email đã tồn tại**
  - Đăng ký lại cùng email → Alert "Đăng ký thất bại" với message từ Supabase

- [ ] **Step 5: Final commit nếu cần**

```bash
git add -A
git commit -m "chore: register screen complete and verified"
```
