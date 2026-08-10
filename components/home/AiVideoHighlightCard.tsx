import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface AiVideoHighlightCardProps {
  onStartCall?: () => void;
}

export const AiVideoHighlightCard: React.FC<AiVideoHighlightCardProps> = ({
  onStartCall,
}) => {
  return (
    <View className="mx-6 my-3 bg-[#35D0A0]/15 rounded-3xl p-5 border border-[#35D0A0]/30 flex-row items-center justify-between shadow-sm">
      {/* Text Info */}
      <View className="flex-1 mr-3">
        <Text className="text-[#237A5F] font-bold text-xs uppercase tracking-wider mb-1">
          NEXT UP
        </Text>
        <Text className="text-[#241B4A] font-extrabold text-xl mb-1 leading-tight">
          AI Video Call
        </Text>
        <Text className="text-[#5E5A80] text-sm">
          Practice speaking with Lumio
        </Text>
      </View>

      {/* Circular Call Button */}
      <Pressable
        onPress={onStartCall}
        testID="start-call-button"
        className="w-14 h-14 rounded-full bg-[#35D0A0] items-center justify-center shadow-md active:opacity-80"
        style={({ pressed }) => ({
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Ionicons name="videocam" size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );
};
