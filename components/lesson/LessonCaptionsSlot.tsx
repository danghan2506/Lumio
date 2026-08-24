import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '@/theme/colors';

export interface LessonCaptionsSlotProps {
  languageName?: string;
  showCaptions: boolean;
  captionText?: string | null;
}

export function LessonCaptionsSlot({
  languageName = 'your language',
  showCaptions,
  captionText,
}: LessonCaptionsSlotProps) {
  if (!showCaptions) {
    return <View testID="captions-slot-placeholder" style={{ minHeight: 52 }} />;
  }

  return (
    <View
      testID="captions-slot-card"
      style={{
        marginHorizontal: 24,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 16,
        backgroundColor: 'rgba(94,90,128,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(94,90,128,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
      }}
    >
      <Text
        style={{
          fontFamily: 'PlusJakartaSans_500Medium',
          color: colors.lavenderMist,
          fontSize: 13,
          textAlign: 'center',
          lineHeight: 19,
          opacity: 0.85,
        }}
      >
        {captionText || `Speak naturally in ${languageName} to practice with Lumi.`}
      </Text>
    </View>
  );
}
