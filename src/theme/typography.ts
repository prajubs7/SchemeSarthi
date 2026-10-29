import { TextStyle } from 'react-native';

// System font; sizes scale with the OS font setting (Text allowFontScaling defaults to true).
export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  h1: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  h2: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  title: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodySm: { fontSize: 13, lineHeight: 19, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
