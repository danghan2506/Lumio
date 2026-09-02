import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface LearningStatsGridProps {
  totalXp: number;
  completedLessons: number;
  masteredWords: number;
  daysActive: number;
  currentStreak: number;
}

interface StatItemProps {
  label: string;
  value: number;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColor: string;
}

const StatCard: React.FC<StatItemProps> = ({
  label,
  value,
  iconName,
  iconColor,
  iconBgColor,
}) => {
  return (
    <View
      style={{
        flex: 1,
        minWidth: '45%',
        backgroundColor: colors.deepIndigo,
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(94, 90, 128, 0.35)',
        justifyContent: 'space-between',
        minHeight: 112,
      }}
    >
      {/* Icon & Spark Indicator Row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            backgroundColor: iconBgColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
      </View>

      {/* Metric Value & Label */}
      <View>
        <Text
          style={{
            fontFamily: 'PlusJakartaSans_700Bold',
            fontSize: 24,
            color: colors.cream,
            letterSpacing: 0.3,
            lineHeight: 28,
            marginBottom: 2,
          }}
        >
          {value.toLocaleString()}
        </Text>

        <Text
          style={{
            fontFamily: 'PlusJakartaSans_600SemiBold',
            fontSize: 11,
            color: colors.lavenderMist,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
};

export const LearningStatsGrid: React.FC<LearningStatsGridProps> = ({
  totalXp,
  completedLessons,
  masteredWords,
  daysActive,
  currentStreak,
}) => {
  return (
    <View style={{ gap: 12 }}>
      {/* Row 1: Total XP & Completed Lessons */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <StatCard
          label="TOTAL XP"
          value={totalXp}
          iconName="sparkles"
          iconColor={colors.daylightAmber}
          iconBgColor="rgba(255, 183, 77, 0.15)"
        />
        <StatCard
          label="LESSONS COMPLETED"
          value={completedLessons}
          iconName="checkmark-circle"
          iconColor={colors.mint}
          iconBgColor="rgba(53, 208, 160, 0.15)"
        />
      </View>

      {/* Row 2: Words Mastered & Days Active */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <StatCard
          label="WORDS MASTERED"
          value={masteredWords}
          iconName="book-outline"
          iconColor={colors.lumioCoral}
          iconBgColor="rgba(255, 107, 87, 0.15)"
        />
        <StatCard
          label="DAYS ACTIVE"
          value={daysActive}
          iconName="calendar-outline"
          iconColor={colors.mint}
          iconBgColor="rgba(53, 208, 160, 0.15)"
        />
      </View>

      {/* Row 3: Current Streak (full width, flame reserved for streak) */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <StatCard
          label="CURRENT STREAK"
          value={currentStreak}
          iconName="flame"
          iconColor={colors.daylightAmber}
          iconBgColor="rgba(255, 183, 77, 0.15)"
        />
      </View>
    </View>
  );
};
