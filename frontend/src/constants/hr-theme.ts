export const HrColors = {
  navy: '#17324D',
  navyDark: '#0F1E2E',
  blue: '#2867B2',
  blueLight: '#3D80D0',
  blueSoft: '#EAF2FC',
  green: '#16825D',
  greenSoft: '#E8F6F0',
  amber: '#AF6D00',
  amberSoft: '#FFF4D9',
  red: '#B42318',
  redSoft: '#FDECEA',
  purple: '#6941C6',
  purpleSoft: '#F4F3FF',
  ink: '#1C2834',
  muted: '#657585',
  mutedLight: '#8FA3B1',
  border: '#D9E1E8',
  borderLight: '#EEF2F6',
  surface: '#FFFFFF',
  canvas: '#F3F6FA',
  overlay: 'rgba(23, 50, 77, 0.08)',
} as const;

export const HrGradients = {
  navyHero: ['#17324D', '#1A4A72'] as const,
  blueAccent: ['#2867B2', '#3D80D0'] as const,
  greenAccent: ['#16825D', '#1AAB7A'] as const,
  canvas: ['#F3F6FA', '#EAF0F8'] as const,
} as const;

export const HrShadow = {
  sm: {
    shadowColor: '#17324D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#17324D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#17324D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

export const HrRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 9999,
} as const;

export const HrFont = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
} as const;

