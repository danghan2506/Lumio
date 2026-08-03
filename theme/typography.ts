export const fontFamilies = {
  display: 'Fredoka_700Bold',
  displaySemiBold: 'Fredoka_600SemiBold',
  displayMedium: 'Fredoka_500Medium',
  sansBold: 'PlusJakartaSans_700Bold',
  sansSemiBold: 'PlusJakartaSans_600SemiBold',
  sansMedium: 'PlusJakartaSans_500Medium',
  sansRegular: 'PlusJakartaSans_400Regular',
  mono: 'JetBrainsMono_500Medium',
} as const;

export const typeScale = {
  displayLarge: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: fontFamilies.display,
    letterSpacing: 0.64, // +2%
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fontFamilies.display,
    letterSpacing: 0.48, // +2%
  },
  bodyLarge: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: fontFamilies.sansMedium,
  },
  bodyRegular: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fontFamilies.sansRegular,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.sansMedium,
  },
  microLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fontFamilies.sansSemiBold,
    letterSpacing: 0.44, // +4%
    textTransform: 'uppercase' as const,
  },
} as const;
