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
