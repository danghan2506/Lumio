import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useAuth } from '@/hooks/useAuth';
import { languages } from '@/data/languages';
import { HOME_DATA } from '@/data/homeData';
import { HeaderBar } from '@/components/home/HeaderBar';
import { DailyGoalCard } from '@/components/home/DailyGoalCard';
import { HeroContinueCard } from '@/components/home/HeroContinueCard';
import { TodaysPlanList } from '@/components/home/TodaysPlanList';
import { AiVideoHighlightCard } from '@/components/home/AiVideoHighlightCard';

export default function HomeScreen() {
  const router = useRouter();
  const { selectedLanguage } = useLanguageStore();
  const { user } = useAuth();

  const currentLanguage =
    languages.find((l) => l.id === selectedLanguage) ??
    languages.find((l) => l.id === 'es')!;

  const userName =
    user?.user_metadata?.full_name?.split(' ')[0] ??
    user?.user_metadata?.name?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'Alex';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF4' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <HeaderBar
          userName={userName}
          languageFlag={currentLanguage.flag}
          languageName={currentLanguage.name}
          streak={HOME_DATA.streak}
          onLanguagePress={() => router.push('/(tabs)/learn')}
        />

        <DailyGoalCard
          currentXp={HOME_DATA.dailyGoal.currentXp}
          targetXp={HOME_DATA.dailyGoal.targetXp}
        />

        <HeroContinueCard
          language={currentLanguage.name}
          level="A1"
          unitTitle="Unit 2"
          onContinue={() => router.push('/lesson/cafe-1' as any)}
        />

        <TodaysPlanList
          items={HOME_DATA.todaysPlan}
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
          onStartCall={() => router.push('/(tabs)/ai-teacher')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

