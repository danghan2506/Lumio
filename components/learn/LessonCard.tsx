import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface LessonCardProps {
  lessonNumber: number;
  title: string;
  status: 'completed' | 'in_progress' | 'not_started';
  xpReward?: number;
  estimatedMinutes?: number;
  onPress: () => void;
}

export function LessonCard({
  lessonNumber,
  title,
  status,
  xpReward,
  estimatedMinutes,
  onPress,
}: LessonCardProps) {
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';

  // Status-dependent container border
  const borderColorStyle = isInProgress
    ? { borderColor: colors.lumioCoral }
    : isCompleted
    ? { borderColor: `${colors.mint}40` }
    : { borderColor: 'rgba(51, 65, 85, 0.4)' }; // slate-700/40

  // Status-dependent lesson label color
  const lessonLabelColor = isCompleted
    ? colors.mint
    : isInProgress
    ? colors.lumioCoral
    : colors.lavenderMist;

  return (
    <TouchableOpacity
      testID="lesson-card"
      onPress={onPress}
      activeOpacity={0.8}
      style={borderColorStyle}
      className={`mx-4 mb-3.5 p-4 rounded-3xl border bg-slate-900/60 flex-row items-center justify-between`}
      accessibilityRole="button"
      accessibilityLabel={`Lesson ${lessonNumber}: ${title}`}
    >
      {/* Left / Main Section */}
      <View className="flex-1 mr-3">
        {/* Header row: Lesson number label & optional status badge */}
        <View className="flex-row items-center mb-1">
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: lessonLabelColor,
            }}
            className="text-xs uppercase tracking-wider mr-2"
          >
            {`Lesson ${lessonNumber}`}
          </Text>

          {isInProgress && (
            <View className="px-2.5 py-0.5 rounded-full bg-[#FF6B57]/15 border border-[#FF6B57]/30">
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.lumioCoral,
                }}
                className="text-[10px]"
              >
                In progress
              </Text>
            </View>
          )}
        </View>

        {/* Lesson Title */}
        <Text
          style={{
            fontFamily: 'Fredoka_700Bold',
            color: colors.cream,
          }}
          className="text-base mb-2"
          numberOfLines={2}
        >
          {title}
        </Text>

        {/* Metadata row (XP reward & duration) */}
        <View className="flex-row items-center space-x-3">
          {xpReward !== undefined && (
            <View className="flex-row items-center mr-3">
              <Ionicons name="sparkles" size={12} color={colors.daylightAmber} style={{ marginRight: 4 }} />
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.daylightAmber,
                }}
                className="text-xs"
              >
                {`+${xpReward} XP`}
              </Text>
            </View>
          )}

          {estimatedMinutes !== undefined && (
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={12} color={colors.lavenderMist} style={{ marginRight: 4 }} />
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.lavenderMist,
                }}
                className="text-xs opacity-80"
              >
                {`${estimatedMinutes} mins`}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Right Action / Status Badge Icon */}
      <View className="items-center justify-center">
        {isCompleted && (
          <View
            className="w-10 h-10 rounded-full bg-[#35D0A0]/15 items-center justify-center border border-[#35D0A0]/40"
            testID="icon-checkmark"
          >
            <Ionicons name="checkmark-sharp" size={20} color={colors.mint} />
          </View>
        )}

        {isInProgress && (
          <View
            className="w-10 h-10 rounded-full bg-[#FF6B57] items-center justify-center shadow-sm"
            testID="icon-play-solid"
          >
            <Ionicons name="play" size={18} color={colors.cream} style={{ marginLeft: 2 }} />
          </View>
        )}

        {status === 'not_started' && (
          <View
            className="w-10 h-10 rounded-full bg-slate-800/60 items-center justify-center border border-slate-700/50"
            testID="icon-play-outline"
          >
            <Ionicons name="play-outline" size={18} color={colors.lavenderMist} style={{ marginLeft: 2 }} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
