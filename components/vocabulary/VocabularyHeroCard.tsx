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
    <View className="bg-canvas-dark-end rounded-2xl p-4 mb-3.5 shadow-md border border-white/10 flex-row items-center justify-between">
      {/* Left Column: Title & Stats Chips */}
      <View className="flex-1 mr-3">
        <Text
          style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }}
          className="text-base leading-tight"
        >
          {isAllCaughtUp ? 'All Caught Up! ✨' : 'Vocabulary Vault'}
        </Text>

        <View className="flex-row items-center mt-1.5 flex-wrap">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.daylightAmber }}
            className="text-xs"
          >
            <Text>{dueCount}</Text> Due
          </Text>
          <Text style={{ color: colors.lavenderMist }} className="text-xs mx-1.5">
            •
          </Text>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.mint }}
            className="text-xs"
          >
            <Text>{masteredCount}</Text> Mastered
          </Text>
          <Text style={{ color: colors.lavenderMist }} className="text-xs mx-1.5">
            •
          </Text>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.lavenderMist }}
            className="text-xs"
          >
            <Text>{retentionRate}%</Text>
          </Text>
        </View>
      </View>

      {/* Right Column: Compact Action CTA */}
      {isAllCaughtUp ? (
        <Pressable
          testID="practice-all-btn"
          onPress={onPracticeAll ?? onStartReview}
          className="bg-white/20 active:bg-white/30 px-3.5 py-2.5 rounded-xl items-center flex-row justify-center border border-white/20"
        >
          <Ionicons name="refresh" size={15} color={colors.cream} />
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
            className="text-xs ml-1.5"
          >
            Practice All
          </Text>
        </Pressable>
      ) : (
        <Pressable
          testID="start-review-btn"
          onPress={onStartReview}
          className="bg-lumio-coral active:opacity-90 px-3.5 py-2.5 rounded-xl items-center flex-row justify-center shadow-md active:translate-y-0.5"
        >
          <Ionicons name="play" size={15} color={colors.cream} />
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
            className="text-xs ml-1.5"
          >
            Start Daily Review
          </Text>
        </Pressable>
      )}
    </View>
  );
};
