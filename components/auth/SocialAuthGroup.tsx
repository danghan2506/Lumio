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
