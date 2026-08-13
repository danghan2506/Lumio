import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

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
    <View className="mx-6 my-2 p-5 bg-[#EAE6FF]/40 rounded-3xl border border-[#EAE6FF] shadow-sm">
      <View className="flex-row items-center justify-between">
        {/* Left Column: Header & Progress Text */}
        <View className="flex-1 mr-3">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}
            className="text-[#5E5A80] text-xs uppercase tracking-wider mb-1"
          >
            Daily goal
          </Text>
          <View className="flex-row items-baseline">
            <Text
              style={{ fontFamily: 'Fredoka_700Bold' }}
              className="text-[#241B4A] text-2xl"
            >
              {`${currentXp}`}
            </Text>
            <Text
              style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}
              className="text-[#5E5A80] text-sm ml-1"
            >
              {`/ ${targetXp} XP`}
            </Text>
          </View>
        </View>

        {/* Right Badge: Gift Icon Container */}
        <View className="w-12 h-12 rounded-2xl bg-[#FFB74D]/15 items-center justify-center border border-[#FFB74D]/30">
          <Ionicons name="gift-outline" size={24} color={colors.daylightAmber} />
        </View>
      </View>

      {/* Progress Bar Track & Daylight Amber Fill (Reward & Celebration Token) */}
      <View className="w-full bg-[#FFB74D]/20 h-3 rounded-full overflow-hidden mt-4">
        <View
          className="bg-[#FFB74D] h-full rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
};

