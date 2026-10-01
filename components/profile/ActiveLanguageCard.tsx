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
          backgroundColor: colors.warmIvory,
          borderRadius: 24,
          padding: 24,
          borderWidth: 1,
          borderColor: 'rgba(36, 27, 74, 0.06)',
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
            color: colors.deepIndigo,
            textAlign: 'center',
          }}
        >
          Start Learning a Language
        </Text>

        <Text
          style={{
            fontFamily: 'PlusJakartaSans_400Regular',
            fontSize: 14,
            color: colors.slate,
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
        backgroundColor: colors.warmIvory,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(36, 27, 74, 0.06)',
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

      {/* Main Row: Flag + Name + Circular Switch Button */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {/* Flag Badge & Info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'rgba(234, 230, 255, 0.5)',
              borderWidth: 1.5,
              borderColor: 'rgba(36, 27, 74, 0.08)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 26 }}>{activeLanguage.flag}</Text>
          </View>

          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: 'Fredoka_700Bold',
                fontSize: 18,
                color: colors.deepIndigo,
                letterSpacing: 0.38,
              }}
            >
              {activeLanguage.name}
            </Text>

            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                fontFamily: 'PlusJakartaSans_500Medium',
                fontSize: 13,
                color: colors.slate,
              }}
            >
              {activeLanguage.nativeName}
              {formattedStarted ? ` • ${formattedStarted}` : ''}
            </Text>
          </View>
        </View>

        {/* Circular Switch Button */}
        <Pressable
          testID="switch-language-button"
          onPress={onSwitchLanguage}
          accessibilityRole="button"
          accessibilityLabel="Switch active learning language"
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: pressed ? 'rgba(36, 27, 74, 0.1)' : 'rgba(36, 27, 74, 0.05)',
            borderWidth: 1,
            borderColor: 'rgba(36, 27, 74, 0.08)',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          })}
        >
          <Ionicons name="swap-horizontal" size={20} color={colors.deepIndigo} />
        </Pressable>
      </View>
    </View>
  );
};
