import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface AiVideoHighlightCardProps {
  onStartCall?: () => void;
}

export const AiVideoHighlightCard: React.FC<AiVideoHighlightCardProps> = ({
  onStartCall,
}) => {
  return (
    <Pressable
      onPress={onStartCall}
      testID="start-call-card"
      className="mx-6 my-3 bg-[#241B4A] rounded-3xl p-5 border border-[#5E5A80]/30 flex-row items-center justify-between shadow-md active:opacity-90"
      style={({ pressed }) => ({
        opacity: pressed ? 0.9 : 1,
      })}
    >
      {/* Text Info */}
      <View className="flex-1 mr-3">
        <Text
          style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
          className="text-[#FF6B57] text-xs uppercase tracking-wider mb-1"
        >
          NEXT UP
        </Text>
        <Text
          style={{ fontFamily: 'Fredoka_700Bold' }}
          className="text-[#FFFBF4] text-xl mb-1 leading-tight"
        >
          AI Video Call
        </Text>
        <Text
          style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
          className="text-[#EAE6FF]/80 text-sm"
        >
          Practice speaking with Lumio
        </Text>
      </View>

      {/* Circular Call Button (Lumio Coral Primary CTA) */}
      <View
        testID="start-call-button"
        className="w-14 h-14 rounded-full bg-[#FF6B57] items-center justify-center shadow-sm"
      >
        <Ionicons name="videocam" size={26} color={colors.cream} />
      </View>
    </Pressable>
  );
};

