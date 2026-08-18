import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TabScreenWrapper } from '@/components/navigation/TabScreenWrapper';
import { UnitHeader } from '@/components/learn/UnitHeader';
import { SegmentedToggle } from '@/components/learn/SegmentedToggle';
import { ActivityCard } from '@/components/ui/ActivityCard';
import { MultipleChoiceQuizModal } from '@/components/practice/MultipleChoiceQuizModal';
import { useLessonsData } from '@/hooks/useLessonsData';
import { usePracticeData } from '@/hooks/usePracticeData';
import { recordLessonProgress } from '@/lib/api';
import { colors } from '@/theme/colors';
import type { QuizResultSummary } from '@/hooks/useMultipleChoiceQuiz';

export default function LearnScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'lessons' | 'practice'>('lessons');

  const {
    activeUnit: lessonsActiveUnit,
    lessons,
    completedCount,
    loading: lessonsLoading,
    refreshing: lessonsRefreshing,
    error: lessonsError,
    refresh: refreshLessons,
  } = useLessonsData();

  const {
    activeUnit: practiceActiveUnit,
    practiceLessons,
    loading: practiceLoading,
    refreshing: practiceRefreshing,
    error: practiceError,
    refresh: refreshPractice,
    selectedPracticeLesson,
    activeLessonActivities,
    loadingActivities,
    selectLessonForPractice,
    clearSelectedPracticeLesson,
  } = usePracticeData();

  const activeUnit = activeTab === 'lessons' ? lessonsActiveUnit : (practiceActiveUnit ?? lessonsActiveUnit);
  const isRefreshing = lessonsRefreshing || practiceRefreshing;

  const practiceCompletedCount = practiceLessons.filter((l) => l.status === 'completed').length;
  const currentCompletedCount = activeTab === 'lessons' ? completedCount : practiceCompletedCount;
  const currentTotalCount = activeTab === 'lessons' ? lessons.length : practiceLessons.length;

  const handleRefresh = async () => {
    await Promise.all([refreshLessons(), refreshPractice()]);
  };

  const handleLessonPress = (lessonId: string) => {
    router.push({ pathname: '/lesson/[id]', params: { id: lessonId } } as unknown as Href);
  };

  const handleQuizCompleted = async (summary: QuizResultSummary) => {
    if (!selectedPracticeLesson) return;

    try {
      if (summary.calculatedXp > 0) {
        await recordLessonProgress({
          lessonId: selectedPracticeLesson.id,
          status: 'completed',
          currentActivity: summary.totalQuestions,
          xpEarned: summary.calculatedXp,
          minutesPracticed: selectedPracticeLesson.estimated_minutes || 5,
        });
      }
    } catch {
      // Continue even if logging fails
    } finally {
      void refreshLessons();
      void refreshPractice();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <TabScreenWrapper>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.lumioCoral]}
              tintColor={colors.cream}
            />
          }
        >
          {/* Unit Header with Lumi mascot */}
          <UnitHeader
            unitTitle={activeUnit?.title ?? 'Unit 1'}
            unitNumber={activeUnit?.order ?? 1}
            completedCount={currentCompletedCount}
            totalCount={currentTotalCount}
          />

          {/* Segmented Toggle (Lessons vs Practice) */}
          <View className="px-4 mb-4">
            <SegmentedToggle
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </View>

          {/* Tab Content */}
          {activeTab === 'lessons' ? (
            /* Lessons Tab Content */
            lessonsLoading && !lessonsRefreshing ? (
              <View className="py-12 items-center justify-center" testID="loading-indicator">
                <ActivityIndicator size="large" color={colors.lumioCoral} />
              </View>
            ) : lessonsError ? (
              <View className="mx-4 p-6 rounded-3xl bg-red-950/40 border border-red-800/40 items-center justify-center">
                <Ionicons name="alert-circle-outline" size={32} color={colors.lumioCoral} style={{ marginBottom: 8 }} />
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream }}
                  className="text-base text-center mb-2"
                >
                  Failed to load lessons
                </Text>
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
                  className="text-xs text-center mb-4 opacity-80"
                >
                  {lessonsError}
                </Text>
                <TouchableOpacity
                  onPress={refreshLessons}
                  className="px-5 py-2.5 rounded-full bg-slate-800 border border-slate-700"
                  activeOpacity={0.8}
                >
                  <Text
                    style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream }}
                    className="text-xs"
                  >
                    Try again
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {lessons.map((lesson) => (
                  <ActivityCard
                    key={lesson.id}
                    orderNumber={lesson.order}
                    title={lesson.title}
                    status={lesson.status}
                    xpReward={lesson.xp_reward}
                    estimatedMinutes={lesson.estimated_minutes}
                    onPress={() => handleLessonPress(lesson.id)}
                  />
                ))}
              </View>
            )
          ) : (
            /* Practice Tab Content */
            practiceLoading && !practiceRefreshing ? (
              <View className="py-12 items-center justify-center" testID="practice-loading-indicator">
                <ActivityIndicator size="large" color={colors.lumioCoral} />
              </View>
            ) : practiceError ? (
              <View className="mx-4 p-6 rounded-3xl bg-red-950/40 border border-red-800/40 items-center justify-center">
                <Ionicons name="alert-circle-outline" size={32} color={colors.lumioCoral} style={{ marginBottom: 8 }} />
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream }}
                  className="text-base text-center mb-2"
                >
                  Failed to load practice lessons
                </Text>
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
                  className="text-xs text-center mb-4 opacity-80"
                >
                  {practiceError}
                </Text>
                <TouchableOpacity
                  onPress={refreshPractice}
                  className="px-5 py-2.5 rounded-full bg-slate-800 border border-slate-700"
                  activeOpacity={0.8}
                >
                  <Text
                    style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.cream }}
                    className="text-xs"
                  >
                    Try again
                  </Text>
                </TouchableOpacity>
              </View>
            ) : practiceLessons.length === 0 ? (
              <View className="mx-4 p-8 rounded-3xl bg-slate-900/60 border border-slate-700/40 items-center justify-center">
                <View className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 items-center justify-center mb-3">
                  <Ionicons name="sparkles" size={28} color={colors.daylightAmber} />
                </View>
                <Text
                  style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }}
                  className="text-lg text-center mb-1"
                >
                  Chưa có bài tập trắc nghiệm
                </Text>
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
                  className="text-xs text-center opacity-80"
                >
                  Các bài tập trắc nghiệm cho bài học này sẽ được cập nhật sớm!
                </Text>
              </View>
            ) : (
              <View testID="practice-lessons-list">
                {practiceLessons.map((lesson) => (
                  <ActivityCard
                    key={lesson.id}
                    orderNumber={lesson.order}
                    typeLabel="Trắc nghiệm"
                    title={lesson.title}
                    questionsCount={lesson.activitiesCount}
                    xpReward={lesson.xp_reward}
                    estimatedMinutes={lesson.estimated_minutes}
                    status={lesson.status}
                    onPress={() => selectLessonForPractice(lesson)}
                  />
                ))}
              </View>
            )
          )}
        </ScrollView>

        {/* Multiple Choice Quiz Modal */}
        {selectedPracticeLesson && (
          <MultipleChoiceQuizModal
            visible={!!selectedPracticeLesson && !loadingActivities}
            lessonTitle={selectedPracticeLesson.title}
            questions={activeLessonActivities}
            baseXpReward={selectedPracticeLesson.xp_reward}
            onClose={clearSelectedPracticeLesson}
            onCompleted={handleQuizCompleted}
          />
        )}
      </TabScreenWrapper>
    </SafeAreaView>
  );
}
