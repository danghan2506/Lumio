import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface ActiveLanguageCardProps {
  activeLanguage: {
    id: string;
    name: string;
    nativeName: string;
    flag: string;
    startedAt: string;
  } | null;
  onSwitchLanguage?: () => void;
}

export function formatStartedDate(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.startsWith('Started ')) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `Started ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

export const ActiveLanguageCard: React.FC<ActiveLanguageCardProps> = ({
  activeLanguage,
  onSwitchLanguage,
}) => {
  if (!activeLanguage) {
    return (
      <View
        style={{
          backgroundColor: colors.deepIndigo,
          borderRadius: 24,
          padding: 24,
          borderWidth: 1,
          borderColor: 'rgba(94, 90, 128, 0.35)',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: 'rgba(255, 183, 77, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 183, 77, 0.3)',
          }}
        >
          <Ionicons name="sparkles" size={28} color={colors.daylightAmber} />
        </View>

        <Text
          style={{
            fontFamily: 'Fredoka_700Bold',
            fontSize: 20,
            color: colors.cream,
            textAlign: 'center',
          }}
        >
          Start Learning a Language
        </Text>

        <Text
          style={{
            fontFamily: 'PlusJakartaSans_400Regular',
            fontSize: 14,
            color: colors.lavenderMist,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 4,
          }}
        >
          Choose a language and ignite your learning journey with Lumi.
        </Text>

        <Pressable
          testID="start-language-button"
          onPress={onSwitchLanguage}
          accessibilityRole="button"
          accessibilityLabel="Start learning a language"
          style={({ pressed }) => ({
            minHeight: 48,
            backgroundColor: colors.lumioCoral,
            borderRadius: 9999,
            paddingHorizontal: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: pressed ? 0.9 : 1,
            transform: [{ translateY: pressed ? 1 : 0 }],
          })}
        >
          <Ionicons name="compass-outline" size={18} color={colors.cream} />
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_700Bold',
              fontSize: 15,
              color: colors.cream,
            }}
          >
            Start Learning
          </Text>
        </Pressable>
      </View>
    );
  }

  const formattedStarted = formatStartedDate(activeLanguage.startedAt);

  return (
    <View
      style={{
        backgroundColor: colors.deepIndigo,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(94, 90, 128, 0.35)',
      }}
    >
      {/* Header Micro-label */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <Text
          style={{
            fontFamily: 'PlusJakartaSans_600SemiBold',
            fontSize: 11,
            color: colors.lumioCoral,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
          }}
        >
          ACTIVE LANGUAGE
        </Text>

        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.mint,
          }}
        />
      </View>

      {/* Main Row: Flag + Name + Switch Button */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {/* Flag Badge & Info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: 'rgba(234, 230, 255, 0.1)',
              borderWidth: 1.5,
              borderColor: 'rgba(234, 230, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 26 }}>{activeLanguage.flag}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Fredoka_700Bold',
                fontSize: 19,
                color: colors.cream,
                letterSpacing: 0.38,
              }}
            >
              {activeLanguage.name}
            </Text>

            <Text
              style={{
                fontFamily: 'PlusJakartaSans_500Medium',
                fontSize: 13,
                color: colors.lavenderMist,
                marginTop: 2,
              }}
            >
              {activeLanguage.nativeName}
              {formattedStarted ? ` • ${formattedStarted}` : ''}
            </Text>
          </View>
        </View>

        {/* Ghost Pill Switch Button */}
        <Pressable
          testID="switch-language-button"
          onPress={onSwitchLanguage}
          accessibilityRole="button"
          accessibilityLabel="Switch active learning language"
          style={({ pressed }) => ({
            minHeight: 48,
            minWidth: 48,
            paddingHorizontal: 16,
            borderRadius: 9999,
            borderWidth: 1.5,
            borderColor: 'rgba(234, 230, 255, 0.25)',
            backgroundColor: pressed ? 'rgba(234, 230, 255, 0.1)' : 'transparent',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          })}
        >
          <Ionicons name="swap-horizontal" size={16} color={colors.cream} />
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_600SemiBold',
              fontSize: 13,
              color: colors.cream,
            }}
          >
            Switch Language
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
