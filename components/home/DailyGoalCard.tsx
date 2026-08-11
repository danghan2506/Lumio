import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DailyGoalCardProps {
  currentXp: number;
  targetXp: number;
}

export const DailyGoalCard: React.FC<DailyGoalCardProps> = ({
  currentXp,
  targetXp,
}) => {
  const percentage = Math.min(100, Math.max(0, (currentXp / targetXp) * 100));

  return (
    <View className="mx-6 my-2 p-5 bg-cream rounded-3xl border border-daylight-amber/30 shadow-sm">
      <View className="flex-row items-center justify-between">
        {/* Left Column: Header & Progress Text */}
        <View className="flex-1 mr-3">
          <Text className="text-deep-indigo/70 micro-label mb-1">
            Daily goal
          </Text>
          <View className="flex-row items-baseline">
            <Text className="text-deep-indigo font-display text-2xl">
              {`${currentXp}`}
            </Text>
            <Text className="text-deep-indigo/60 font-sans text-sm ml-1">
              {`/ ${targetXp} XP`}
            </Text>
          </View>
        </View>

        {/* Right Badge: Gift Icon Container */}
        <View className="w-12 h-12 rounded-2xl bg-daylight-amber/15 items-center justify-center border border-daylight-amber/30">
          <Ionicons name="gift-outline" size={24} color="#FFB74D" />
        </View>
      </View>

      {/* Progress Bar Track & Fill */}
      <View className="w-full bg-daylight-amber/20 h-3 rounded-full overflow-hidden mt-4">
        <View
          className="bg-lumio-coral h-full rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
};
