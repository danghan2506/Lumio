import React, { useRef } from 'react';
import { View, Text, ScrollView } from 'react-native';
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
  const scrollViewRef = useRef<ScrollView>(null);

  if (!showCaptions) {
    return <View testID="captions-slot-placeholder" style={{ minHeight: 64 }} />;
  }

  return (
    <View
      testID="captions-slot-card"
      style={{
        marginHorizontal: 24,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: isLive ? 'rgba(94,90,128,0.26)' : 'rgba(94,90,128,0.14)',
        borderWidth: 1,
        borderColor: isLive ? 'rgba(255,107,87,0.4)' : 'rgba(94,90,128,0.2)',
        minHeight: 64,
        maxHeight: 128,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          height: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
          opacity: isLive ? 1 : 0,
        }}
      >
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
      <ScrollView
        testID="captions-scroll-view"
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: 'PlusJakartaSans_500Medium',
            color: isLive ? colors.cream : colors.lavenderMist,
            fontSize: 13,
            textAlign: 'center',
            lineHeight: 19,
            opacity: isLive ? 1 : 0.85,
          }}
        >
          {captionText || `Speak naturally in ${languageName} to practice with Lumi.`}
        </Text>
      </ScrollView>
    </View>
  );
}
