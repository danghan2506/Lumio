import React from 'react';
import { ScrollView, RefreshControl, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { HeaderBar } from '@/components/home/HeaderBar';
import { DailyGoalCard } from '@/components/home/DailyGoalCard';
import { HeroContinueCard } from '@/components/home/HeroContinueCard';
import { TodaysPlanList } from '@/components/home/TodaysPlanList';
import { AiVideoHighlightCard } from '@/components/home/AiVideoHighlightCard';
import { DashboardSkeletonLoader } from '@/components/home/DashboardSkeletonLoader';
import { useDashboardData } from '@/hooks/useDashboardData';
import { colors } from '@/theme/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { data, loading, refreshing, error, refresh } = useDashboardData();

  if (loading && !data && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF4' }}>
        <DashboardSkeletonLoader />
      </SafeAreaView>
    );
  }

  const currentLanguage = data?.activeLanguage ?? {
    id: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    learnerLanguage: 'vi',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF4' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.lumioCoral]}
            tintColor={colors.lumioCoral}
          />
        }
      >
        {/* Error Banner */}
        {error && (
          <View className="mx-6 my-2 p-4 bg-lumio-coral/15 border border-lumio-coral/30 rounded-2xl flex-row items-center justify-between">
            <Text className="text-deep-indigo text-xs flex-1 mr-2">{error}</Text>
            <TouchableOpacity
              onPress={refresh}
              className="bg-lumio-coral px-3 py-1.5 rounded-full"
            >
              <Text className="text-cream font-display text-xs">Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <HeaderBar
          userName={data?.userName ?? 'Learner'}
          languageFlag={currentLanguage.flag}
          languageName={currentLanguage.name}
          streak={data?.streak ?? 0}
          isStreakActiveToday={data?.isStreakActiveToday ?? false}
          avatarUrl={data?.avatarUrl}
          onLanguagePress={() => router.push('/(tabs)/learn')}
        />

        <DailyGoalCard
          currentXp={data?.dailyGoal.currentXp ?? 0}
          targetXp={data?.dailyGoal.targetXp ?? 20}
          isCompleted={data?.dailyGoal.isCompleted ?? false}
        />

        {data?.continueLesson && (
          <HeroContinueCard
            lessonTitle={data.continueLesson.lessonTitle}
            unitTitle={data.continueLesson.unitTitle}
            xpReward={data.continueLesson.xpReward}
            estimatedMinutes={data.continueLesson.estimatedMinutes}
            isCourseCompleted={data.continueLesson.isCourseCompleted}
            onContinue={() => {
              if (data.continueLesson?.lessonId) {
                router.push(`/lesson/${data.continueLesson.lessonId}` as any);
              } else {
                router.push('/(tabs)/learn');
              }
            }}
          />
        )}

        <TodaysPlanList
          items={data?.todaysPlan ?? []}
          onItemPress={(item) => {
            if (item.lessonId) {
              router.push(`/lesson/${item.lessonId}` as any);
            } else if (item.type === 'ai_conversation') {
              router.push('/(tabs)/ai-teacher');
            } else {
              router.push('/(tabs)/learn');
            }
          }}
          onViewAll={() => router.push('/(tabs)/learn')}
        />

        <AiVideoHighlightCard
          topicTitle={data?.aiTopicTitle}
          onStartCall={() => {
            if (data?.aiTopicLessonId) {
              router.push(`/lesson/${data.aiTopicLessonId}` as any);
            } else {
              router.push('/(tabs)/ai-teacher');
            }
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

