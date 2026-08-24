import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface LessonHeaderProps {
  languageFlag?: string;
  languageName?: string;
  lessonOrder: number;
  lessonTitle: string;
  xpReward: number;
  onBack: () => void;
}

export function LessonHeader({
  languageFlag = '🌐',
  languageName = 'Language',
  lessonOrder,
  lessonTitle,
  xpReward,
  onBack,
}: LessonHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <TouchableOpacity
        testID="lesson-back-btn"
        onPress={onBack}
        activeOpacity={0.7}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(94,90,128,0.15)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name="chevron-back" size={22} color={colors.cream} />
      </TouchableOpacity>

      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginHorizontal: 10,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: 'rgba(94,90,128,0.12)',
          borderWidth: 1,
          borderColor: 'rgba(94,90,128,0.18)',
        }}
      >
        <Text style={{ fontSize: 13, marginRight: 6 }}>{languageFlag}</Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: 'PlusJakartaSans_600SemiBold',
            color: colors.lavenderMist,
            fontSize: 12,
          }}
        >
          Lesson {lessonOrder}: {lessonTitle}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: colors.daylightAmber,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
        }}
      >
        <Text style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo, fontSize: 12 }}>
          +{xpReward} XP
        </Text>
      </View>
    </View>
  );
}
