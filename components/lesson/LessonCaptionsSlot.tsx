import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '@/theme/colors';

export interface LessonCaptionsSlotProps {
  languageName?: string;
  showCaptions: boolean;
  captionText?: string | null;
  isLive?: boolean;
}

export function LessonCaptionsSlot({
  languageName = 'your language',
  showCaptions,
  captionText,
  isLive = false,
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
        backgroundColor: isLive ? 'rgba(94,90,128,0.22)' : 'rgba(94,90,128,0.12)',
        borderWidth: 1,
        borderColor: isLive ? 'rgba(255,107,87,0.35)' : 'rgba(94,90,128,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
      }}
    >
      {isLive && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.lumioCoral,
              marginRight: 6,
            }}
          />
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.lumioCoral,
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            LIVE
          </Text>
        </View>
      )}
      <Text
        style={{
          fontFamily: isLive ? 'PlusJakartaSans_600SemiBold' : 'PlusJakartaSans_500Medium',
          color: isLive ? colors.cream : colors.lavenderMist,
          fontSize: 13,
          textAlign: 'center',
          lineHeight: 19,
          opacity: isLive ? 1 : 0.85,
        }}
      >
        {captionText || `Speak naturally in ${languageName} to practice with Lumi.`}
      </Text>
    </View>
  );
}
