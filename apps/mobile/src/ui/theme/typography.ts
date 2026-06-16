export const typography = {
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
  subtitle: { fontSize: 18, lineHeight: 26, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
} as const;

export type TextVariant = keyof typeof typography;
