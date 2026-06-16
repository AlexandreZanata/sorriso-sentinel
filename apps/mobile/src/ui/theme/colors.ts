export const colors = {
  primary: '#0B6E4F',
  primaryMuted: '#0B6E4F22',
  danger: '#C62828',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F6F8',
  border: '#D8DEE4',
  textPrimary: '#1A1F24',
  textMuted: '#5C6B7A',
  textOnPrimary: '#FFFFFF',
  warning: '#ED6C02',
  success: '#2E7D32',
} as const;

export type SemanticColor = keyof typeof colors;
