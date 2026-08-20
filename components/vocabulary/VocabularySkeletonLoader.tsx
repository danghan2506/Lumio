import React from 'react';
import { View } from 'react-native';

export const VocabularySkeletonLoader: React.FC = () => {
  return (
    <View testID="vocabulary-skeleton-loader" className="px-6 py-4 space-y-4">
      {/* Hero Card Skeleton */}
      <View className="h-44 bg-lavender-mist/20 rounded-3xl animate-pulse mb-4" />

      {/* Filter Bar Skeleton */}
      <View className="h-12 bg-lavender-mist/20 rounded-2xl animate-pulse mb-4" />

      {/* List Items Skeleton */}
      <View className="h-28 bg-lavender-mist/20 rounded-2xl animate-pulse mb-3" />
      <View className="h-28 bg-lavender-mist/20 rounded-2xl animate-pulse mb-3" />
      <View className="h-28 bg-lavender-mist/20 rounded-2xl animate-pulse mb-3" />
    </View>
  );
};
