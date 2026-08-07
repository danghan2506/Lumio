import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { colors } from '@/theme/colors';
import type { Language } from '@/types/learning';

interface LanguageCardProps {
  language: Language;
  isSelected: boolean;
  onSelect: () => void;
}

export const LanguageCard: React.FC<LanguageCardProps> = ({
  language,
  isSelected,
  onSelect,
}) => {
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityLabel={`Select ${language.name}`}
      style={{
        backgroundColor: isSelected ? colors.lavenderMist : '#31265E',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderWidth: 2,
        borderColor: isSelected ? colors.lumioCoral : 'rgba(234, 230, 255, 0.12)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 72,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: isSelected ? 'rgba(36, 27, 74, 0.1)' : 'rgba(234, 230, 255, 0.08)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 26 }}>{language.flag}</Text>
        </View>

        <View style={{ gap: 2, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text
              style={{
                fontFamily: 'Fredoka_700Bold',
                fontSize: 18,
                color: isSelected ? colors.deepIndigo : colors.cream,
              }}
            >
              {language.name}
            </Text>
            {language.badge ? (
              <View
                style={{
                  backgroundColor: isSelected ? colors.lumioCoral : 'rgba(255, 107, 87, 0.18)',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 9999,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans_700Bold',
                    fontSize: 10,
                    color: isSelected ? colors.cream : colors.lumioCoral,
                    letterSpacing: 0.6,
                  }}
                >
                  {language.badge}
                </Text>
              </View>
            ) : null}
          </View>

          <Text
            style={{
              fontFamily: 'PlusJakartaSans_500Medium',
              fontSize: 14,
              color: isSelected ? colors.slate : colors.lavenderMist,
            }}
          >
            {language.nativeName}
            {language.learnerCount ? `  •  ${language.learnerCount}` : ''}
          </Text>
        </View>
      </View>

      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: isSelected ? colors.mint : 'rgba(234, 230, 255, 0.15)',
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: 12,
        }}
      >
        <Text
          style={{
            fontFamily: 'PlusJakartaSans_700Bold',
            fontSize: 14,
            color: isSelected ? colors.deepIndigo : 'transparent',
          }}
        >
          ✓
        </Text>
      </View>
    </Pressable>
  );
};
