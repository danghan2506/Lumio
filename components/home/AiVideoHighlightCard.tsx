import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface AiVideoHighlightCardProps {
  topicTitle?: string;
  onStartCall?: () => void;
}

export const AiVideoHighlightCard: React.FC<AiVideoHighlightCardProps> = ({
  topicTitle,
  onStartCall,
}) => {
  return (
    <Pressable
      onPress={onStartCall}
      testID="start-call-card"
      className="mx-6 my-3 bg-mint-soft rounded-3xl p-5 border border-mint/30 flex-row items-center justify-between shadow-sm active:opacity-90"
    >
      <View className="flex-1 mr-3">
        <Text className="text-slate micro-label mb-1">
          NEXT UP
        </Text>
        <Text className="text-deep-indigo font-display text-xl mb-1 leading-tight">
          AI Video Call
        </Text>
        <Text className="text-slate font-sans text-sm" numberOfLines={1}>
          {topicTitle ? `Topic: ${topicTitle}` : 'Practice speaking with Lumio'}
        </Text>
      </View>

      <View
        testID="start-call-button"
        className="w-14 h-14 rounded-full bg-mint items-center justify-center shadow-md"
      >
        <Ionicons name="videocam" size={26} color={colors.cream} />
      </View>
    </Pressable>
  );
};
