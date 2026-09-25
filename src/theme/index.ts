import { colors } from './colors';
import { typography } from './typography';
import { spacing, radius } from './spacing';
import { shadows } from './shadows';

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} as const;

export type Theme = typeof theme;

export { colors, typography, spacing, radius, shadows };
export type { ColorToken } from './colors';
export type { TypographyVariant } from './typography';
export type { SpacingToken, RadiusToken } from './spacing';
export { navigationTheme, stackScreenOptions } from './navigation';
