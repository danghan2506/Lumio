import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export type VocabularyFilterType = 'all' | 'due' | 'learning' | 'mastered';

export interface VocabularyFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: VocabularyFilterType;
  onFilterChange: (filter: VocabularyFilterType) => void;
  counts: {
    all: number;
    due: number;
    learning: number;
    mastered: number;
  };
}

export const VocabularyFilterBar: React.FC<VocabularyFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  counts,
}) => {
  const filters: { key: VocabularyFilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'due', label: 'Due', count: counts.due },
    { key: 'learning', label: 'Learning', count: counts.learning },
    { key: 'mastered', label: 'Mastered', count: counts.mastered },
  ];

  return (
    <View className="mb-4">
      {/* Search Input */}
      <View className="flex-row items-center bg-white border border-lavender-mist rounded-2xl px-3.5 py-2.5 mb-3 shadow-sm">
        <Ionicons name="search" size={20} color={colors.slate} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search words or translations..."
          placeholderTextColor={colors.slate}
          style={{ fontFamily: 'PlusJakartaSans_500Medium', color: colors.deepIndigo }}
          className="flex-1 ml-2.5 text-sm p-0"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => onSearchChange('')} className="p-1">
            <Ionicons name="close-circle" size={18} color={colors.slate} />
          </Pressable>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
        {filters.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => onFilterChange(f.key)}
              className={`mr-2 px-3.5 py-2 rounded-xl border ${
                isActive
                  ? 'bg-deep-indigo border-deep-indigo'
                  : 'bg-white border-lavender-mist'
              }`}
            >
              <Text
                style={{
                  fontFamily: isActive ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
                  color: isActive ? colors.cream : colors.slate,
                }}
                className="text-xs"
              >
                {f.label} ({f.count})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};
