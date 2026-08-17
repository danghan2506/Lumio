import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface PracticeCardProps {
  lessonNumber: number;
  title: string;
  activitiesCount: number;
  xpReward: number;
  estimatedMinutes: number;
  status: 'completed' | 'in_progress' | 'not_started';
  onPress: () => void;
  testID?: string;
}

export function PracticeCard({
  lessonNumber,
  title,
  activitiesCount,
  xpReward,
  estimatedMinutes,
  status,
  onPress,
  testID = 'practice-card',
}: PracticeCardProps) {
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';

  const borderColorStyle = isCompleted
    ? { borderColor: `${colors.mint}50` }
    : isInProgress
    ? { borderColor: colors.lumioCoral }
    : { borderColor: 'rgba(51, 65, 85, 0.5)' };

  const buttonBgColor = isCompleted
    ? `${colors.mint}20`
    : isInProgress
    ? `${colors.lumioCoral}20`
    : 'rgba(255, 255, 255, 0.08)';

  const buttonTextColor = isCompleted
    ? colors.mint
    : isInProgress
    ? colors.lumioCoral
    : colors.lavenderMist;

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.8}
      style={borderColorStyle}
      className="mx-4 mb-3.5 p-4 rounded-3xl border bg-slate-900/60 flex-row items-center justify-between"
      accessibilityRole="button"
      accessibilityLabel={`Luyện tập bài ${lessonNumber}: ${title}`}
    >
      <View className="flex-1 mr-3">
        {/* Header Row: Label & Status */}
        <View className="flex-row items-center mb-1">
          <Text
            style={{
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: isCompleted ? colors.mint : colors.lavenderMist,
            }}
            className="text-xs uppercase tracking-wider mr-2"
          >
            {`Bài ${lessonNumber} • Trắc nghiệm`}
          </Text>

          {isCompleted && (
            <View className="px-2 py-0.5 rounded-full bg-[#35D0A0]/15 border border-[#35D0A0]/30 flex-row items-center">
              <Ionicons name="checkmark-circle" size={10} color={colors.mint} style={{ marginRight: 3 }} />
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.mint,
                }}
                className="text-[10px]"
              >
                Đã đạt
              </Text>
            </View>
          )}

          {isInProgress && (
            <View className="px-2 py-0.5 rounded-full bg-[#FF6B57]/15 border border-[#FF6B57]/30">
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.lumioCoral,
                }}
                className="text-[10px]"
              >
                Đang làm
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
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

        {/* Info Tags: Question Count & XP */}
        <View className="flex-row items-center flex-wrap">
          <View className="flex-row items-center mr-3">
            <Ionicons name="help-circle-outline" size={13} color={colors.lavenderMist} style={{ marginRight: 4 }} />
            <Text
              style={{
                fontFamily: 'PlusJakartaSans_500Medium',
                color: colors.lavenderMist,
              }}
              className="text-xs"
            >
              {`${activitiesCount} câu hỏi`}
            </Text>
          </View>

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

          {estimatedMinutes > 0 && (
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={12} color={colors.slate} style={{ marginRight: 4 }} />
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans_400Regular',
                  color: colors.slate,
                }}
                className="text-xs"
              >
                {`~${estimatedMinutes} phút`}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Button on Right */}
      <View
        style={{ backgroundColor: buttonBgColor }}
        className="px-3.5 py-2.5 rounded-2xl flex-row items-center justify-center"
      >
        <Text
          style={{
            fontFamily: 'PlusJakartaSans_700Bold',
            color: buttonTextColor,
          }}
          className="text-xs mr-1.5"
        >
          {isCompleted ? 'Làm lại' : 'Luyện tập'}
        </Text>
        <Ionicons
          name={isCompleted ? 'refresh-outline' : 'play'}
          size={12}
          color={buttonTextColor}
        />
      </View>
    </TouchableOpacity>
  );
}
