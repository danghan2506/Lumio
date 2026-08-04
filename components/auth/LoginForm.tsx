import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/colors';
import { supabase } from '@/lib/supabase';

export interface LoginFormProps {
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
