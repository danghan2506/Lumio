import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors } from '@/theme/colors';

export interface SegmentedToggleProps {
  activeTab: 'lessons' | 'practice';
  onTabChange: (tab: 'lessons' | 'practice') => void;
}

export function SegmentedToggle({ activeTab, onTabChange }: SegmentedToggleProps) {
  const tabs: { key: 'lessons' | 'practice'; label: string }[] = [
    { key: 'lessons', label: 'Lessons' },
    { key: 'practice', label: 'Practice' },
  ];

  return (
    <View className="bg-slate-900/60 p-1.5 rounded-full border border-slate-700/40 flex-row items-center">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.8}
            className={`flex-1 py-2.5 items-center justify-center rounded-full ${
              isActive ? 'bg-cream' : 'bg-transparent'
            }`}
            style={isActive ? { backgroundColor: colors.cream } : undefined}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={{
                fontFamily: 'Fredoka_700Bold',
                color: isActive ? colors.deepIndigo : colors.lavenderMist,
              }}
              className="text-sm tracking-wide text-center"
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
