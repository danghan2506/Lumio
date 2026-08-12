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
import { LessonCard } from '@/components/learn/LessonCard';
import { useLessonsData } from '@/hooks/useLessonsData';
import { colors } from '@/theme/colors';

export default function LearnScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'lessons' | 'practice'>('lessons');

  const {
    activeUnit,
    lessons,
    completedCount,
    loading,
    refreshing,
    error,
    refresh,
  } = useLessonsData();

  const handleLessonPress = (lessonId: string) => {
    router.push({ pathname: '/lesson/[id]', params: { id: lessonId } } as unknown as Href);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.deepIndigo }}>
      <TabScreenWrapper>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={[colors.lumioCoral]}
              tintColor={colors.cream}
            />
          }
        >
          {/* Unit Header with Lumi mascot */}
          <UnitHeader
            unitTitle={activeUnit?.title ?? 'Unit 1'}
            unitNumber={activeUnit?.order ?? 1}
            completedCount={completedCount}
            totalCount={lessons.length}
          />

          {/* Segmented Toggle (Lessons vs Practice) */}
          <View className="px-4 mb-4">
            <SegmentedToggle
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </View>

          {/* Screen Content */}
          {loading && !refreshing ? (
            <View className="py-12 items-center justify-center" testID="loading-indicator">
              <ActivityIndicator size="large" color={colors.lumioCoral} />
            </View>
          ) : error ? (
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
                {error}
              </Text>
              <TouchableOpacity
                onPress={refresh}
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
          ) : activeTab === 'practice' ? (
            <View className="mx-4 p-8 rounded-3xl bg-slate-900/60 border border-slate-700/40 items-center justify-center">
              <View className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 items-center justify-center mb-3">
                <Ionicons name="sparkles" size={28} color={colors.daylightAmber} />
              </View>
              <Text
                style={{ fontFamily: 'Fredoka_700Bold', color: colors.cream }}
                className="text-lg text-center mb-1"
              >
                Practice Mode Coming Soon!
              </Text>
              <Text
                style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.lavenderMist }}
                className="text-xs text-center opacity-80"
              >
                Review your vocabulary and reinforce skills with tailored AI practice sessions.
              </Text>
            </View>
          ) : (
            <View>
              {lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lessonNumber={lesson.order}
                  title={lesson.title}
                  status={lesson.status}
                  xpReward={lesson.xp_reward}
                  estimatedMinutes={lesson.estimated_minutes}
                  onPress={() => handleLessonPress(lesson.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </TabScreenWrapper>
    </SafeAreaView>
  );
}
