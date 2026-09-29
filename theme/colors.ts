export const colors = {
  deepIndigo: '#241B4A',
  canvasDarkEnd: '#4B3FA8',
  lumioCoral: '#FF6B57',
  lumioCoralDark: '#D84936',
  daylightAmber: '#FFB74D',
  daylightAmberDark: '#B86200',
  mint: '#35D0A0',
  mintDark: '#1F8A6B',
  mintSoft: '#E6F9F3',
  lavenderMist: '#EAE6FF',
  cream: '#FFFBF4',
  warmIvory: '#FAF7F0',
  slate: '#5E5A80',
  gradients: {
    canvas: ['#241B4A', '#4B3FA8'] as const,
    ember: ['#FFB74D', '#FF6B57'] as const,
  },
} as const;

export type Colors = typeof colors;
