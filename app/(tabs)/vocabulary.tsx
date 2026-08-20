import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TabScreenWrapper } from '@/components/navigation/TabScreenWrapper';
import { useVocabularyData } from '@/hooks/useVocabularyData';
import { VocabularyHeroCard } from '@/components/vocabulary/VocabularyHeroCard';
import {
  VocabularyFilterBar,
  VocabularyFilterType,
} from '@/components/vocabulary/VocabularyFilterBar';
import { VocabularyListItem } from '@/components/vocabulary/VocabularyListItem';
import { VocabularySkeletonLoader } from '@/components/vocabulary/VocabularySkeletonLoader';
import { colors } from '@/theme/colors';

export default function VocabularyScreen() {
  const router = useRouter();
  const { vocabularies, dueWords, stats, loading, refreshing, error, refresh } =
    useVocabularyData();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<VocabularyFilterType>('all');

  const filteredVocabularies = useMemo(() => {
    return vocabularies.filter((item) => {
      // Search filter
      const matchesSearch =
        searchQuery.trim().length === 0 ||
        item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.translation.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Status chip filter
      if (activeFilter === 'all') return true;
      if (activeFilter === 'due') {
        return dueWords.some((d) => d.id === item.id);
      }
      return item.status === activeFilter;
    });
  }, [vocabularies, dueWords, searchQuery, activeFilter]);

  const filterCounts = useMemo(() => {
    return {
      all: vocabularies.length,
      due: dueWords.length,
      learning: vocabularies.filter((v) => v.status === 'learning').length,
      mastered: vocabularies.filter((v) => v.status === 'mastered').length,
    };
  }, [vocabularies, dueWords]);

  return (
    <TabScreenWrapper>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top']}>
        {/* Header */}
        <View className="px-6 pt-3 pb-2 flex-row items-center justify-between">
          <View>
            <Text
              style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo }}
              className="text-2xl"
            >
              Vocabulary Vault
            </Text>
            <Text
              style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.slate }}
              className="text-xs mt-0.5"
            >
              Master words with spaced repetition
            </Text>
          </View>
        </View>

        {loading ? (
          <VocabularySkeletonLoader />
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-14 h-14 rounded-full bg-lumio-coral/15 items-center justify-center mb-3">
              <Ionicons name="alert-circle" size={30} color={colors.lumioCoral} />
            </View>
            <Text
              style={{ fontFamily: 'Fredoka_700Bold', color: colors.deepIndigo }}
              className="text-lg text-center mb-1"
            >
              Unable to load vocabulary
            </Text>
            <Text
              style={{ fontFamily: 'PlusJakartaSans_400Regular', color: colors.slate }}
              className="text-sm text-center mb-5"
            >
              {error}
            </Text>
            <Pressable
              testID="retry-vocab-btn"
              onPress={refresh}
              className="bg-lumio-coral px-6 py-3 rounded-2xl active:opacity-90 shadow-sm"
            >
              <Text
                style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors.cream }}
                className="text-sm"
              >
                Try Again
              </Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filteredVocabularies}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <VocabularyListItem item={item} />}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor={colors.lumioCoral}
              />
            }
            ListHeaderComponent={
              <View className="pt-3">
                <VocabularyHeroCard
                  dueCount={stats.dueCount}
                  masteredCount={stats.masteredCount}
                  retentionRate={stats.retentionRate}
                  onStartReview={() => router.push('/vocabulary/review' as any)}
                />
                <VocabularyFilterBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                  counts={filterCounts}
                />
              </View>
            }
            ListEmptyComponent={
              <View className="py-12 items-center justify-center">
                <Ionicons name="search-outline" size={40} color={colors.slate} />
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.deepIndigo }}
                  className="text-base mt-2"
                >
                  No vocabulary found
                </Text>
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_400Regular', color: colors.slate }}
                  className="text-xs text-center mt-1 text-gray-500"
                >
                  Try clearing your search query or changing filter.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </TabScreenWrapper>
  );
}
