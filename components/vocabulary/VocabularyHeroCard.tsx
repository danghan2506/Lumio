import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface VocabularyHeroCardProps {
  dueCount: number;
  masteredCount: number;
  retentionRate: number;
  onStartReview: () => void;
  onPracticeAll?: () => void;
}

export const VocabularyHeroCard: React.FC<VocabularyHeroCardProps> = ({
  dueCount,
  masteredCount,
  retentionRate,
  onStartReview,
  onPracticeAll,
}) => {
  const isAllCaughtUp = dueCount === 0;

  return (
    <View className="bg-canvas-dark-end rounded-3xl p-5 mb-5 shadow-md border border-white/10">
      {/* Header Info */}
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text
            style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }}
            className="text-xl leading-tight"
          >
            {isAllCaughtUp ? 'All Caught Up! ✨' : 'Vocabulary Vault'}
          </Text>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
            className="text-xs mt-0.5"
          >
            {isAllCaughtUp
              ? 'Great job keeping your streak alive'
              : 'Daily spaced repetition queue'}
          </Text>
        </View>

        <View className="w-11 h-11 rounded-2xl bg-white/15 items-center justify-center">
          <Ionicons
            name={isAllCaughtUp ? 'sparkles' : 'layers'}
            size={22}
            color={colors.daylightAmber}
          />
        </View>
      </View>

      {/* Stats Deck */}
      <View className="flex-row items-center justify-between bg-black/20 rounded-2xl p-3.5 mb-4">
        <View className="items-center flex-1">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.daylightAmber }}
            className="text-lg"
          >
            {dueCount}
          </Text>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
            className="text-[11px]"
          >
            Due Cards
          </Text>
        </View>

        <View className="w-[1px] h-7 bg-white/15" />

        <View className="items-center flex-1">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.mint }}
            className="text-lg"
          >
            {masteredCount}
          </Text>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
            className="text-[11px]"
          >
            Mastered
          </Text>
        </View>

        <View className="w-[1px] h-7 bg-white/15" />

        <View className="items-center flex-1">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
            className="text-lg"
          >
            {retentionRate}%
          </Text>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
            className="text-[11px]"
          >
            Retention
          </Text>
        </View>
      </View>

      {/* Action Button */}
      {isAllCaughtUp ? (
        <Pressable
          testID="practice-all-btn"
          onPress={onPracticeAll ?? onStartReview}
          className="bg-white/20 active:bg-white/30 py-3 rounded-2xl items-center flex-row justify-center border border-white/20"
        >
          <Ionicons name="refresh" size={18} color={colors.cream} className="mr-2" />
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
            className="text-sm ml-2"
          >
            Practice All Vocabulary
          </Text>
        </Pressable>
      ) : (
        <Pressable
          testID="start-review-btn"
          onPress={onStartReview}
          className="bg-lumio-coral active:opacity-90 py-3.5 rounded-2xl items-center flex-row justify-center shadow-lg active:translate-y-0.5"
        >
          <Ionicons name="play" size={18} color={colors.cream} className="mr-2" />
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
            className="text-sm ml-2"
          >
            Start Daily Review
          </Text>
        </Pressable>
      )}
    </View>
  );
};
