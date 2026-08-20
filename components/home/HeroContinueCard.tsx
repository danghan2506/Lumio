import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export interface HeroContinueCardProps {
  lessonTitle: string;
  unitTitle: string;
  xpReward?: number;
  estimatedMinutes?: number;
  isCourseCompleted?: boolean;
  onContinue?: () => void;
}

export const HeroContinueCard: React.FC<HeroContinueCardProps> = ({
  lessonTitle,
  unitTitle,
  xpReward = 10,
  estimatedMinutes = 5,
  isCourseCompleted = false,
  onContinue,
}) => {
  const displayTitle = `${unitTitle} • ${lessonTitle}`;

  return (
    <View className="mx-6 my-3 bg-deep-indigo rounded-3xl shadow-md overflow-hidden relative p-6">
      <View className="absolute right-0 top-0 bottom-0 w-32 bg-canvas-dark-end/40 items-center justify-center pointer-events-none">
        <FontAwesome5 name="landmark" size={48} color="rgba(255, 255, 255, 0.2)" />
      </View>

      <View className="flex-1 pr-20 z-10">
        <Text className="text-lumio-coral micro-label mb-1">
          {isCourseCompleted ? 'COURSE COMPLETED 🎉' : 'CONTINUE LEARNING'}
        </Text>

        <Text className="text-white font-display text-xl mb-3 leading-tight" numberOfLines={2}>
          {displayTitle}
        </Text>

        <View className="flex-row items-center space-x-2 mb-4">
          <View className="bg-daylight-amber/20 px-2.5 py-1 rounded-full border border-daylight-amber/30 mr-2">
            <Text className="text-daylight-amber font-display text-xs">+{xpReward} XP</Text>
          </View>
          <View className="bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
            <Text className="text-white/80 font-sans text-xs">~{estimatedMinutes} min</Text>
          </View>
        </View>

        <Pressable
          onPress={onContinue}
          className="bg-[#FF6B57] px-6 py-3 rounded-full self-start shadow-sm active:bg-[#FF533D]"
          style={({ pressed }) => ({
            opacity: pressed ? 0.9 : 1,
            transform: [{ translateY: pressed ? 1 : 0 }],
          })}
        >
          <Text className="text-cream font-display text-sm">
            {isCourseCompleted ? 'Review' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
