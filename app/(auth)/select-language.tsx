import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { languages } from '@/data/languages';
import { LanguageCard } from '@/components/ui/LanguageCard';
import { images } from '@/constants/images';
import type { LanguageId } from '@/types/learning';

export default function SelectLanguageScreen() {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState<LanguageId>('en');

  const handleContinue = () => {
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <StatusBar barStyle="light-content" />

      {/* Top Header Navigation */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingVertical: 14,
        }}
      >
        <View
          style={{
            backgroundColor: 'rgba(255, 183, 77, 0.15)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 9999,
            borderWidth: 1,
            borderColor: colors.daylightAmber,
          }}
        >
          <Text
            style={{
              fontFamily: 'JetBrainsMono_500Medium',
              fontSize: 12,
              color: colors.daylightAmber,
            }}
          >
            STEP 1 OF 3
          </Text>
        </View>

        <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={12}>
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_600SemiBold',
              fontSize: 14,
              color: colors.slate,
            }}
          >
            Skip
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 32,
          gap: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot Banner */}
        <View
          style={{
            backgroundColor: '#31265E',
            borderRadius: 24,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            borderWidth: 1,
            borderColor: 'rgba(234, 230, 255, 0.15)',
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: colors.lumioCoral,
            }}
          >
            <Image
              source={images.mascot}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={{
                fontFamily: 'Fredoka_700Bold',
                fontSize: 20,
                lineHeight: 26,
                color: colors.cream,
              }}
            >
              What language would you like to learn?
            </Text>
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_400Regular',
                fontSize: 13,
                color: colors.lavenderMist,
              }}
            >
              Choose a language to light up your daily practice with Lumi.
            </Text>
          </View>
        </View>

        {/* Card Options */}
        <View style={{ gap: 14 }}>
          {languages.map((lang) => (
            <LanguageCard
              key={lang.id}
              language={lang}
              isSelected={selectedLang === lang.id}
              onSelect={() => setSelectedLang(lang.id)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA Bar */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 24,
          paddingTop: 12,
          backgroundColor: colors.deepIndigo,
          borderTopWidth: 1,
          borderTopColor: 'rgba(234, 230, 255, 0.08)',
        }}
      >
        <Pressable
          onPress={handleContinue}
          style={{
            backgroundColor: colors.lumioCoral,
            borderRadius: 9999,
            minHeight: 54,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_700Bold',
              fontSize: 17,
              color: colors.cream,
            }}
          >
            Continue
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
