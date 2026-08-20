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
import { TranslationQuizModal } from '@/components/practice/TranslationQuizModal';
import { useLessonsData } from '@/hooks/useLessonsData';
import { usePracticeData } from '@/hooks/usePracticeData';
import { recordLessonProgress } from '@/lib/api';
import { colors } from '@/theme/colors';
import type { QuizResultSummary } from '@/hooks/useMultipleChoiceQuiz';
import type { PracticeActivityType } from '@/types/learning';

const FILTER_OPTIONS: { type: PracticeActivityType; label: string }[] = [
  { type: 'all', label: 'All' },
  { type: 'multiple_choice', label: 'Quiz' },
  { type: 'translation', label: 'Sentence' },
];

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
    selectedLanguage,
    activeUnit: practiceActiveUnit,
    practiceLessons,
    filteredPracticeLessons,
    filterType,
    setFilterType,
    loading: practiceLoading,
    refreshing: practiceRefreshing,
    error: practiceError,
    refresh: refreshPractice,
    selectedPracticeLesson,
    selectedPracticeActivityType,
    activeLessonActivities,
    activeTranslationActivities,
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
            ) : (
              <View>
                {/* Practice Activity Filter Pills */}
                <View className="px-4 mb-4 flex-row items-center gap-2" testID="practice-filter-bar">
                  {FILTER_OPTIONS.map((opt) => {
                    const isSelected = filterType === opt.type;
                    return (
                      <TouchableOpacity
                        key={opt.type}
                        testID={`filter-chip-${opt.type}`}
                        onPress={() => setFilterType(opt.type)}
                        activeOpacity={0.8}
                        style={{
                          backgroundColor: isSelected ? colors.lumioCoral : 'rgba(255, 255, 255, 0.06)',
                          borderColor: isSelected ? colors.lumioCoral : 'rgba(255, 255, 255, 0.12)',
                        }}
                        className="px-4 py-2 rounded-full border"
                        accessibilityRole="button"
                        accessibilityLabel={`Filter by ${opt.label}`}
                      >
                        <Text
                          style={{
                            fontFamily: isSelected ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
                            color: isSelected ? colors.cream : colors.lavenderMist,
                          }}
                          className="text-xs"
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {filteredPracticeLessons.length === 0 ? (
                  <View className="mx-4 p-8 rounded-3xl bg-slate-900/60 border border-slate-700/40 items-center justify-center">
                    <View className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 items-center justify-center mb-3">
                      <Ionicons name="sparkles" size={28} color={colors.daylightAmber} />
                    </View>
                    <Text
                      style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }}
                      className="text-lg text-center mb-1"
                    >
                      No practice exercises yet
                    </Text>
                    <Text
                      style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
                      className="text-xs text-center opacity-80"
                    >
                      Exercises for this unit will be added soon!
                    </Text>
                  </View>
                ) : (
                  <View testID="practice-lessons-list">
                    {filteredPracticeLessons.flatMap((lesson) => {
                      const mcCount = lesson.multipleChoiceActivitiesCount ?? (lesson.translationActivitiesCount ? 0 : lesson.activitiesCount);
                      const trCount = lesson.translationActivitiesCount ?? 0;

                      const cards: React.ReactNode[] = [];

                      // If filter is all or multiple_choice, and has MC questions
                      if ((filterType === 'all' || filterType === 'multiple_choice') && (mcCount > 0 || (mcCount === 0 && trCount === 0))) {
                        cards.push(
                          <ActivityCard
                            key={`${lesson.id}-mc`}
                            testID={`practice-card-mc-${lesson.id}`}
                            orderNumber={lesson.order}
                            typeLabel="Quiz"
                            title={lesson.title}
                            questionsCount={mcCount || lesson.activitiesCount}
                            xpReward={lesson.xp_reward}
                            estimatedMinutes={lesson.estimated_minutes}
                            status={lesson.status}
                            onPress={() => selectLessonForPractice(lesson, 'multiple_choice')}
                          />
                        );
                      }

                      // If filter is all or translation, and has translation questions
                      if ((filterType === 'all' || filterType === 'translation') && trCount > 0) {
                        cards.push(
                          <ActivityCard
                            key={`${lesson.id}-tr`}
                            testID={`practice-card-tr-${lesson.id}`}
                            orderNumber={lesson.order}
                            typeLabel="Sentence Builder"
                            title={lesson.title}
                            questionsCount={trCount}
                            xpReward={lesson.xp_reward}
                            estimatedMinutes={lesson.estimated_minutes}
                            status={lesson.status}
                            onPress={() => selectLessonForPractice(lesson, 'translation')}
                          />
                        );
                      }

                      return cards;
                    })}
                  </View>
                )}
              </View>
            )
          )}
        </ScrollView>

        {/* Multiple Choice Quiz Modal */}
        {selectedPracticeLesson && selectedPracticeActivityType === 'multiple_choice' && (
          <MultipleChoiceQuizModal
            visible={!loadingActivities && activeLessonActivities.length > 0}
            lessonTitle={selectedPracticeLesson.title}
            questions={activeLessonActivities}
            baseXpReward={selectedPracticeLesson.xp_reward}
            onClose={clearSelectedPracticeLesson}
            onCompleted={handleQuizCompleted}
          />
        )}

        {/* Translation Word Bank Quiz Modal */}
        {selectedPracticeLesson && selectedPracticeActivityType === 'translation' && (
          <TranslationQuizModal
            visible={!loadingActivities && activeTranslationActivities.length > 0}
            lessonTitle={selectedPracticeLesson.title}
            questions={activeTranslationActivities}
            baseXpReward={selectedPracticeLesson.xp_reward}
            languageId={selectedLanguage}
            onClose={clearSelectedPracticeLesson}
            onCompleted={handleQuizCompleted}
          />
        )}
      </TabScreenWrapper>
    </SafeAreaView>
  );
}
