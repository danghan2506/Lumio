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
