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
    <View
      style={{
        backgroundColor: 'rgba(36, 27, 74, 0.05)',
        borderColor: 'rgba(36, 27, 74, 0.08)',
      }}
      className="p-1.5 rounded-full border flex-row items-center"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.8}
            className="flex-1 py-2.5 items-center justify-center rounded-full"
            style={
              isActive
                ? {
                    backgroundColor: colors.warmIvory,
                    shadowColor: '#241B4A',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.06,
                    shadowRadius: 2,
                    elevation: 1,
                  }
                : undefined
            }
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={{
                fontFamily: 'Fredoka_700Bold',
                color: isActive ? colors.deepIndigo : colors.slate,
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
